import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptionsWithRequest, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('auth.googleClientId') || 'PLACEHOLDER_ID',
      clientSecret: configService.get<string>('auth.googleClientSecret') || 'PLACEHOLDER_SECRET',
      callbackURL:
        configService.get<string>('auth.googleCallbackUrl') ||
        'http://localhost:3000/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
      passReqToCallback: true,
    } as StrategyOptionsWithRequest);
  }

  authorizationParams(options: any): Record<string, string> {
    const tenantSlug = options?.tenantSlug ?? options?.req?.query?.tenantSlug;
    if (!tenantSlug) return {};
    const state = Buffer.from(JSON.stringify({ tenantSlug, nonce: Date.now() })).toString(
      'base64url',
    );
    return { state };
  }

  async validate(
    _req: Request,
    accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, id } = profile;
    if (!emails?.[0]?.value) return done(new Error('Google profile missing email'), undefined);
    done(null, {
      email: emails[0].value,
      firstName: name?.givenName,
      lastName: name?.familyName,
      googleId: id,
      accessToken,
    });
  }
}
