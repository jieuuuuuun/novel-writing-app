import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  GoogleUser,
  JwtPayload,
} from './types/authenticated-user.js';

function requireEnvironment(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parseDurationToSeconds(duration: string): number {
  const match = /^(\d+)([smhd])$/i.exec(duration.trim());

  if (!match) {
    throw new Error(
      'JWT_EXPIRES_IN must use a duration such as 30m, 12h, or 7d.',
    );
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const unitSeconds: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
  };

  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error('JWT_EXPIRES_IN must be greater than zero.');
  }

  return value * unitSeconds[unit];
}

@Injectable()
export class AuthService {
  private readonly expiresInSeconds = parseDurationToSeconds(
    requireEnvironment('JWT_EXPIRES_IN'),
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async findOrCreateGoogleUser(profile: GoogleUser) {
    const googleUser = await this.prisma.user.findUnique({
      where: { googleId: profile.googleId },
    });

    if (googleUser) {
      return googleUser;
    }

    const emailUser = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (emailUser) {
      return this.prisma.user.update({
        where: { id: emailUser.id },
        data: {
          googleId: profile.googleId,
          name: profile.name,
        },
      });
    }

    return this.prisma.user.create({
      data: profile,
    });
  }

  async issueAccessToken(user: {
    id: number;
    email: string;
  }): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.signAsync(payload, {
      expiresIn: this.expiresInSeconds,
    });
  }

  getAccessTokenMaxAge(): number {
    return this.expiresInSeconds * 1000;
  }
}
