import { UnauthorizedException } from '@nestjs/common';
import type { Profile } from 'passport-google-oauth20';
import { GoogleStrategy } from './google.strategy.js';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;

  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_CALLBACK_URL =
      'http://localhost:3001/auth/google/callback';
    strategy = new GoogleStrategy();
  });

  it('maps a verified Google email onto the app user profile', () => {
    const user = strategy.validate('token', 'refresh', {
      id: 'google-1',
      displayName: 'Author',
      emails: [{ value: 'author@example.com', verified: true }],
    } as Profile);

    expect(user).toEqual({
      googleId: 'google-1',
      email: 'author@example.com',
      name: 'Author',
      emailVerified: true,
    });
  });

  it('does not treat a missing verified flag as true', () => {
    const user = strategy.validate('token', 'refresh', {
      id: 'google-1',
      displayName: 'Author',
      emails: [{ value: 'author@example.com' }],
    } as Profile);

    expect(user.emailVerified).toBe(false);
  });

  it('does not treat a string verified value as true', () => {
    const user = strategy.validate('token', 'refresh', {
      id: 'google-1',
      displayName: 'Author',
      emails: [{ value: 'author@example.com', verified: 'true' as never }],
    } as Profile);

    expect(user.emailVerified).toBe(false);
  });

  it('rejects a Google profile without an email', () => {
    expect(() =>
      strategy.validate('token', 'refresh', {
        id: 'google-1',
        displayName: 'Author',
        emails: [],
      } as Profile),
    ).toThrow(UnauthorizedException);
  });
});
