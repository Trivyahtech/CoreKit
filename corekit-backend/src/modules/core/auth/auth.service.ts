import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { CacheService } from '../../../platform/cache/cache.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redis: CacheService,
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

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: dto.tenantSlug }});
    if (!tenant) throw new UnauthorizedException('Invalid credentials');

    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: dto.email.toLowerCase() } },
    });

    if (!user || user.status !== UserStatus.ACTIVE || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    return this.generateTokens(user);
  }

  // OTP Login Flow
  async sendOtp(tenantSlug: string, email: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug }});
    if (!tenant) throw new BadRequestException('Tenant not found');

    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: email.toLowerCase() } },
    });

    // Don't leak user existence, just return success uniformly (basic security)
    if (!user) return { message: 'If an account exists, an OTP has been sent.' };

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
    await this.redis.getClient().setex(`otp:${tenant.id}:${email.toLowerCase()}`, 300, otp);
    
    // Simulate sending SMS/Email
    console.log(`[SIMULATE] OTP for ${email}: ${otp}`);

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(tenantSlug: string, email: string, otp: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug }});
    if (!tenant) throw new BadRequestException('Tenant not found');

    const key = `otp:${tenant.id}:${email.toLowerCase()}`;
    const storedOtp = await this.redis.getClient().get(key);

    if (!storedOtp || storedOtp !== otp) {
       throw new UnauthorizedException('Invalid or expired OTP');
    }

    await this.redis.getClient().del(key);

    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: email.toLowerCase() } },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid user');
    }

    return this.generateTokens(user);
  }

  // Refresh Token Flow
  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.hashedRefreshToken) throw new UnauthorizedException('Access Denied');

    const rtMatches = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
    if (!rtMatches) throw new UnauthorizedException('Access Denied');

    return this.generateTokens(user);
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
