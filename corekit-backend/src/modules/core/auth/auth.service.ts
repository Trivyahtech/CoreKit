import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { CacheService } from '../../../platform/cache/cache.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import * as crypto from 'crypto';
import type { OtpJob, PasswordResetJob } from '../../../platform/mail/email.processor.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redis: CacheService,
    private readonly config: ConfigService,
    @InjectQueue('emails') private readonly emailQueue: Queue,
  ) {}

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, { expiresIn: '15m' });
    const refreshToken = await this.jwtService.signAsync(payload, { expiresIn: '7d' });

    // Hash refresh token to store in DB
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { hashedRefreshToken },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async register(dto: RegisterDto) {
    const tenant = await this.prisma.tenant.findUnique({
                 where: { slug: dto.tenantSlug },
      select: { id: true, status: true },
    });

    if (!tenant) throw new BadRequestException('Tenant not found');

    const existingUser = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: dto.email.toLowerCase() } },
    });

    if (existingUser) throw new BadRequestException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
      },
    });

    // Fire-and-forget: send an email verification link after registration
    this.sendVerificationEmail(user.id).catch((err) => {
      this.logger.warn(`Could not queue verification email for ${user.id}: ${err?.message ?? err}`);
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: dto.tenantSlug }});
    if (!tenant) throw new UnauthorizedException('Invalid credentials');

    const normalizedEmail = dto.email.toLowerCase();
    const redis = this.redis.getClient();
    const lockKey = `login:fail:${tenant.id}:${normalizedEmail}`;
    const fails = Number((await redis.get(lockKey)) || 0);
    if (fails >= 10) {
      throw new UnauthorizedException(
        'Too many failed attempts — account temporarily locked. Try again later or reset your password.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: normalizedEmail } },
    });

    const invalid = async () => {
      const count = await redis.incr(lockKey);
      if (count === 1) await redis.expire(lockKey, 900);
      throw new UnauthorizedException('Invalid credentials');
    };

    if (!user || user.status !== UserStatus.ACTIVE || !user.passwordHash) {
      await invalid();
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user!.passwordHash!);
    if (!isPasswordValid) await invalid();

    await redis.del(lockKey);
    return this.generateTokens(user!);
  }

  // OTP Login Flow
  async sendOtp(tenantSlug: string, email: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug }});
    if (!tenant) throw new BadRequestException('Tenant not found');

    const normalizedEmail = email.toLowerCase();
    const redis = this.redis.getClient();
    const rateKey = `otp:send:rate:${tenant.id}:${normalizedEmail}`;
    const count = await redis.incr(rateKey);
    if (count === 1) await redis.expire(rateKey, 3600);
    if (count > 5) {
      // Respond identically to success to avoid user enumeration
      return { message: 'If an account exists, an OTP has been sent.' };
    }

    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: normalizedEmail } },
    });

    if (!user) return { message: 'If an account exists, an OTP has been sent.' };

    const otp = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
    await redis.setex(`otp:${tenant.id}:${normalizedEmail}`, 300, otp);
    await redis.del(`otp:fail:${tenant.id}:${normalizedEmail}`);

    try {
      const job: OtpJob = { type: 'otp', to: normalizedEmail, code: otp, ttlMinutes: 5 };
      await this.emailQueue.add('otp', job, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: true,
        removeOnFail: 100,
      });
    } catch (err) {
      this.logger.error(`Failed to enqueue OTP email for ${normalizedEmail}`, err as Error);
    }

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(tenantSlug: string, email: string, otp: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug }});
    if (!tenant) throw new BadRequestException('Tenant not found');

    const normalizedEmail = email.toLowerCase();
    const redis = this.redis.getClient();
    const key = `otp:${tenant.id}:${normalizedEmail}`;
    const failKey = `otp:fail:${tenant.id}:${normalizedEmail}`;

    const failCount = Number((await redis.get(failKey)) || 0);
    if (failCount >= 5) {
      throw new UnauthorizedException('Too many failed attempts. Request a new OTP.');
    }

    const storedOtp = await redis.get(key);
    const ok =
      !!storedOtp &&
      storedOtp.length === otp.length &&
      crypto.timingSafeEqual(Buffer.from(storedOtp), Buffer.from(otp));

    if (!ok) {
      const fails = await redis.incr(failKey);
      if (fails === 1) await redis.expire(failKey, 900);
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    await redis.del(key);
    await redis.del(failKey);

    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: normalizedEmail } },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid user');
    }

    return this.generateTokens(user);
  }

  async requestPasswordReset(tenantSlug: string, email: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    const normalizedEmail = email.toLowerCase();
    const redis = this.redis.getClient();
    const generic = { message: 'If an account exists, a password reset link has been sent.' };

    const rateKey = `pwreset:rate:${tenantSlug}:${normalizedEmail}`;
    const rate = await redis.incr(rateKey);
    if (rate === 1) await redis.expire(rateKey, 3600);
    if (rate > 5 || !tenant) return generic;

    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: normalizedEmail } },
    });
    if (!user || user.status !== UserStatus.ACTIVE) return generic;

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await redis.setex(`pwreset:${tokenHash}`, 1800, `${tenant.id}:${user.id}`);

    try {
      const frontendUrl = this.config.get<string>('app.frontendUrl', 'http://localhost:3000');
      const resetUrl = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${token}`;
      const job: PasswordResetJob = {
        type: 'password-reset',
        to: normalizedEmail,
        resetUrl,
        ttlMinutes: 30,
      };
      await this.emailQueue.add('password-reset', job, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: true,
        removeOnFail: 100,
      });
    } catch (err) {
      this.logger.error(
        `Failed to enqueue password reset email for ${normalizedEmail}`,
        err as Error,
      );
    }

    return generic;
  }

  async resetPassword(token: string, newPassword: string) {
    const redis = this.redis.getClient();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const key = `pwreset:${tokenHash}`;
    const payload = await redis.get(key);
    if (!payload) throw new UnauthorizedException('Invalid or expired reset token');
    await redis.del(key);

    const [, userId] = payload.split(':');
    if (!userId) throw new UnauthorizedException('Invalid reset token payload');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, hashedRefreshToken: null },
    });

    return { passwordReset: true };
  }

  // --- Email verification ---
  async sendVerificationEmail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, emailVerifiedAt: true, tenantId: true },
    });
    if (!user) throw new BadRequestException('User not found');
    if (user.emailVerifiedAt) {
      return { message: 'Email is already verified' };
    }

    const redis = this.redis.getClient();
    const rateKey = `emailverify:rate:${user.id}`;
    const count = await redis.incr(rateKey);
    if (count === 1) await redis.expire(rateKey, 600);
    if (count > 3) {
      throw new BadRequestException(
        'Too many verification emails requested — try again in 10 minutes.',
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await redis.setex(`emailverify:${tokenHash}`, 86_400, user.id);

    const frontendUrl = this.config.get<string>('app.frontendUrl', 'http://localhost:3000');
    const verifyUrl = `${frontendUrl.replace(/\/$/, '')}/verify-email?token=${token}`;

    try {
      await this.emailQueue.add(
        'email-verification',
        {
          type: 'email-verification',
          to: user.email,
          verifyUrl,
          ttlMinutes: 24 * 60,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5_000 },
          removeOnComplete: true,
          removeOnFail: 100,
        },
      );
    } catch (err) {
      this.logger.error('Failed to enqueue verification email', err as Error);
    }

    return { message: 'Verification email sent' };
  }

  async verifyEmail(token: string) {
    if (!token) throw new BadRequestException('Token required');
    const redis = this.redis.getClient();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const key = `emailverify:${tokenHash}`;
    const userId = await redis.get(key);
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }
    await redis.del(key);
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    });
    return { verified: true };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: null },
    });
    return { loggedOut: true };
  }

  // Refresh Token Flow
  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.hashedRefreshToken) throw new UnauthorizedException('Access Denied');
    if (user.status !== UserStatus.ACTIVE) throw new UnauthorizedException('Account is not active');

    const rtMatches = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
    if (!rtMatches) throw new UnauthorizedException('Access Denied');

    return this.generateTokens(user);
  }

  decodeOAuthState(state: string | undefined): string | null {
    if (!state) return null;
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
      return typeof decoded?.tenantSlug === 'string' ? decoded.tenantSlug : null;
    } catch {
      return null;
    }
  }

  // Google OAuth Formatter
  async googleLogin(profile: any, tenantSlug: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug }});
    if (!tenant) throw new BadRequestException('Tenant not found');

    const email = profile.email.toLowerCase();
    let user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email } },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          tenantId: tenant.id,
          email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          googleId: profile.googleId,
          role: UserRole.CUSTOMER,
          status: UserStatus.ACTIVE,
        },
      });
    } else if (!user.googleId) {
       // Link google account to existing email account
       user = await this.prisma.user.update({
         where: { id: user.id },
         data: { googleId: profile.googleId },
       });
    }

    return this.generateTokens(user);
  }
}
