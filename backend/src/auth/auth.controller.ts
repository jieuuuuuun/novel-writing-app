import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { GoogleAuthGuard } from './guards/google-auth.guard.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type {
  AuthenticatedUser,
  GoogleUser,
} from './types/authenticated-user.js';

interface GoogleRequest extends Request {
  user: GoogleUser;
}

function requireEnvironment(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin(): void {
    return;
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Req() request: GoogleRequest,
    @Res() response: Response,
  ): Promise<void> {
    const user = await this.authService.findOrCreateGoogleUser(request.user);
    const accessToken = await this.authService.issueAccessToken(user);

    response.cookie('access_token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction(),
      maxAge: this.authService.getAccessTokenMaxAge(),
      path: '/',
    });
    const frontendUrl = requireEnvironment('FRONTEND_URL').replace(/\/$/, '');
    response.redirect(`${frontendUrl}/works`);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(
    @CurrentUser() user: AuthenticatedUser,
  ): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie('access_token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction(),
      path: '/',
    });
  }
}
