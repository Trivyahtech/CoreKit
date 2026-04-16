import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { RedisModule } from '../../redis/redis.module.js';
import { GoogleStrategy } from './strategies/google.strategy.js';

@Module({
  imports: [
    PassportModule,
    RedisModule, // Added for OTP
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('auth.jwtSecret')!,
        signOptions: {
          expiresIn: config.get<string>('auth.jwtExpiresIn') as `${number}${'s' | 'm' | 'h' | 'd'}`,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy], // Added GoogleStrategy
  exports: [AuthService, JwtModule], // Exported JwtModule for the controller payload verification
})
export class AuthModule {}
