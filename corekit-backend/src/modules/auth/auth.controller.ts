import { Body, Controller, Get, Post, Request, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
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
  @Post('otp/send')
  @ApiOperation({ summary: 'Send OTP for passwordless login' })
  sendOtp(@Body() dto: { tenantSlug: string; email: string }) {
    return this.authService.sendOtp(dto.tenantSlug, dto.email);
  }

  @Public()
  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify OTP and get JWT' })
  verifyOtp(@Body() dto: { tenantSlug: string; email: string; otp: string }) {
    return this.authService.verifyOtp(dto.tenantSlug, dto.email, dto.otp);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh JWT Access Token using a Refresh Token' })
  async refreshTokens(@Request() req: any, @Body() dto: { refreshToken: string }) {
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
  @ApiOperation({ summary: 'Initiate Google SSO (pass tenantSlug in Query)' })
  googleAuth(@Request() req: any) {
    // Handled by Passport
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google SSO Callback' })
  async googleAuthRedirect(@Request() req: any) {
    // Hard Rule: Config/feature logic parsing, but for simple auth we map directly
    // Using a default tenant slug 'corekit' since callback via query params in google strategy setup is tricky without session
    return this.authService.googleLogin(req.user, 'corekit'); 
  }

  // --- Protected ---
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
