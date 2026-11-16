import { RequestMethod } from '@nestjs/common';
import {
  GUARDS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import type { Response } from 'express';
import { AuthController } from './auth.controller.js';
import type { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

describe('AuthController', () => {
  it('protects GET /auth/me with the JWT guard', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      AuthController.prototype.getCurrentUser,
    ) as unknown[] | undefined;
    const path = Reflect.getMetadata(
      PATH_METADATA,
      AuthController.prototype.getCurrentUser,
    );
    const method = Reflect.getMetadata(
      METHOD_METADATA,
      AuthController.prototype.getCurrentUser,
    );

    expect(guards).toContain(JwtAuthGuard);
    expect(path).toBe('me');
    expect(method).toBe(RequestMethod.GET);
  });

  it('protects DELETE /auth/me with the JWT guard and does not take a user id param', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      AuthController.prototype.deleteCurrentUser,
    ) as unknown[] | undefined;
    const path = Reflect.getMetadata(
      PATH_METADATA,
      AuthController.prototype.deleteCurrentUser,
    );
    const method = Reflect.getMetadata(
      METHOD_METADATA,
      AuthController.prototype.deleteCurrentUser,
    );

    expect(guards).toContain(JwtAuthGuard);
    expect(path).toBe('me');
    expect(path).not.toContain('userId');
    expect(method).toBe(RequestMethod.DELETE);
    expect(AuthController.prototype.deleteCurrentUser.length).toBe(2);
  });

  it('deletes the JWT user only and then clears the access cookie', async () => {
    const deleteAccount = vi.fn().mockResolvedValue(undefined);
    const controller = new AuthController({
      deleteAccount,
    } as unknown as AuthService);
    const response = {
      clearCookie: vi.fn(),
    };

    await controller.deleteCurrentUser(
      { id: 7, email: 'author@example.com', name: 'Author' },
      response as unknown as Response,
    );

    expect(deleteAccount).toHaveBeenCalledTimes(1);
    expect(deleteAccount).toHaveBeenCalledWith(7);
    expect(response.clearCookie).toHaveBeenCalledWith(
      'access_token',
      expect.objectContaining({
        httpOnly: true,
        path: '/',
      }),
    );
  });

  it('does not clear the cookie when account deletion fails', async () => {
    const deleteAccount = vi
      .fn()
      .mockRejectedValue(new Error('delete failed'));
    const controller = new AuthController({
      deleteAccount,
    } as unknown as AuthService);
    const response = {
      clearCookie: vi.fn(),
    };

    await expect(
      controller.deleteCurrentUser(
        { id: 7, email: 'author@example.com', name: 'Author' },
        response as unknown as Response,
      ),
    ).rejects.toThrow('delete failed');
    expect(response.clearCookie).not.toHaveBeenCalled();
  });
});
