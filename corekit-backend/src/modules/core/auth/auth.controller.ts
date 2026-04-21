import { Body, Controller, Get, Post, Query, Request, UseGuards, Req, UnauthorizedException, HttpException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common/decorators/public.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import {
  SendOtpDto,
  VerifyOtpDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/otp.dto.js';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
     private readonly authService: AuthService,
     private readonly jwtService: JwtService
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @ApiOperation({ summary: 'Register a new customer account' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @ApiOperation({ summary: 'Login and receive JWT token' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('otp/send')
  @ApiOperation({ summary: 'Send OTP for passwordless login' })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.tenantSlug, dto.email);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify OTP and get JWT' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.tenantSlug, dto.email, dto.otp);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('password/forgot')
  @ApiOperation({ summary: 'Request a password reset token (emails link to user)' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto.tenantSlug, dto.email);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('password/reset')
  @ApiOperation({ summary: 'Reset password using token from email' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh JWT Access Token using a Refresh Token' })
  async refreshTokens(@Body() dto: RefreshTokenDto) {
     try {
       const payload = await this.jwtService.verifyAsync(dto.refreshToken);
       return this.authService.refreshTokens(payload.sub, dto.refreshToken);
     } catch(e) {
       throw new UnauthorizedException('Invalid or expired refresh token');
     }
  }

  // --- Google OAuth ---
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google SSO (tenantSlug passed via state)' })
  @ApiQuery({ name: 'tenantSlug', required: true })
  googleAuth(@Query('tenantSlug') _tenantSlug: string) {
    // Handled by Passport; tenantSlug is forwarded as OAuth `state` by the strategy
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google SSO Callback' })
  async googleAuthRedirect(@Request() req: any, @Query('state') state: string) {
    const tenantSlug = this.authService.decodeOAuthState(state);
    if (!tenantSlug) throw new UnauthorizedException('Missing or invalid OAuth state');
    return this.authService.googleLogin(req.user, tenantSlug);
  }

  // --- Email verification ---
  @ApiBearerAuth()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('email/send-verification')
  @ApiOperation({ summary: 'Send (or resend) the email verification link' })
  sendEmailVerification(@Request() req: any) {
    return this.authService.sendVerificationEmail(req.user.id);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('email/verify')
  @ApiOperation({ summary: 'Consume an email verification token' })
  verifyEmail(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  // --- Protected ---
  @ApiBearerAuth()
  @Post('logout')
  @ApiOperation({ summary: 'Revoke refresh token for current user' })
  logout(@Request() req: any) {
    return this.authService.logout(req.user.id);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  getMe(@Request() req: any) {
    return req.user;
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Get('admin-check')
  @ApiOperation({ summary: 'Admin-only route' })
  adminCheck(@Request() req: any) {
    return { message: 'You have admin access', user: req.user };
  }
}
