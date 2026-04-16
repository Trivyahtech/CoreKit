import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('auth.googleClientId') || 'PLACEHOLDER_ID',
      clientSecret: configService.get<string>('auth.googleClientSecret') || 'PLACEHOLDER_SECRET',
      callbackURL: configService.get<string>('auth.googleCallbackUrl') || 'http://localhost:3000/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const { name, emails, id } = profile;
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      googleId: id,
      accessToken,
    };
    done(null, user);
  }
}
