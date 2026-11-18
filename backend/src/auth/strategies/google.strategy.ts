import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile } from 'passport-google-oauth20';
import type { GoogleUser } from '../types/authenticated-user.js';

function requireEnvironment(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

type GoogleEmail = {
  value?: string;
  verified?: boolean;
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: requireEnvironment('GOOGLE_CLIENT_ID'),
      clientSecret: requireEnvironment('GOOGLE_CLIENT_SECRET'),
      callbackURL: requireEnvironment('GOOGLE_CALLBACK_URL'),
      scope: ['profile', 'email'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): GoogleUser {
    const emailEntry = profile.emails?.[0] as GoogleEmail | undefined;
    const email = emailEntry?.value?.trim();

    if (!profile.id || !email) {
      throw new UnauthorizedException(
        'Google 계정에서 필수 사용자 정보를 확인할 수 없습니다.',
      );
    }

    return {
      googleId: profile.id,
      email,
      name: (profile.displayName || email.split('@')[0]).slice(0, 100),
      // passport-google-oauth20 OpenID parser sets emails[0].verified from email_verified.
      emailVerified: emailEntry?.verified === true,
    };
  }
}
