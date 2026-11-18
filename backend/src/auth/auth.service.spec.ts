import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';
import type { GoogleUser } from './types/authenticated-user.js';

const verifiedGoogleUser: GoogleUser = {
  googleId: 'google-1',
  email: 'author@example.com',
  name: 'Author',
  emailVerified: true,
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    work: {
      updateMany: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    process.env.JWT_EXPIRES_IN = '7d';
    prisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      work: {
        updateMany: vi.fn(),
      },
      $transaction: vi.fn(),
    };
    prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof prisma) => Promise<unknown>) =>
        callback(prisma),
    );
    service = new AuthService(
      prisma as unknown as PrismaService,
      {} as JwtService,
    );
  });

  it('logs in an existing user by googleId', async () => {
    const existing = { id: 7, googleId: 'google-1', email: 'author@example.com' };
    prisma.user.findUnique.mockResolvedValue(existing);

    await expect(
      service.findOrCreateGoogleUser(verifiedGoogleUser),
    ).resolves.toEqual(existing);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { googleId: 'google-1' },
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('creates a new verified Google user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 8, ...verifiedGoogleUser });

    await service.findOrCreateGoogleUser(verifiedGoogleUser);

    expect(prisma.user.findUnique).toHaveBeenNthCalledWith(1, {
      where: { googleId: 'google-1' },
    });
    expect(prisma.user.findUnique).toHaveBeenNthCalledWith(2, {
      where: { email: 'author@example.com' },
    });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        googleId: 'google-1',
        email: 'author@example.com',
        name: 'Author',
      },
    });
  });

  it('logs in again with the same googleId without creating a second user', async () => {
    const existing = { id: 7, googleId: 'google-1', email: 'author@example.com' };
    prisma.user.findUnique.mockResolvedValue(existing);

    await service.findOrCreateGoogleUser(verifiedGoogleUser);
    await service.findOrCreateGoogleUser(verifiedGoogleUser);

    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(2);
  });

  it('does not attach a different googleId to an existing email', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 7,
        googleId: 'google-original',
        email: 'author@example.com',
      });

    await expect(
      service.findOrCreateGoogleUser({
        ...verifiedGoogleUser,
        googleId: 'google-attacker',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('still logs in an existing googleId user when the current Google email is not verified', async () => {
    const existing = { id: 7, googleId: 'google-1', email: 'author@example.com' };
    prisma.user.findUnique.mockResolvedValue(existing);

    await expect(
      service.findOrCreateGoogleUser({
        ...verifiedGoogleUser,
        emailVerified: false,
      }),
    ).resolves.toEqual(existing);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('does not create or link a user when the Google email is not verified', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.findOrCreateGoogleUser({
        ...verifiedGoogleUser,
        emailVerified: false,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { googleId: 'google-1' },
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('deletes only the authenticated user after nulling synopsis pointers', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 7 });
    prisma.work.updateMany.mockResolvedValue({ count: 2 });
    prisma.user.delete.mockResolvedValue({ id: 7 });

    await service.deleteAccount(7);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 7 },
      select: { id: true },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.work.updateMany).toHaveBeenCalledWith({
      where: { userId: 7 },
      data: { currentSynopsisVersionId: null },
    });
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: 7 },
    });
    expect(prisma.user.delete).not.toHaveBeenCalledWith({
      where: { id: 8 },
    });
  });

  it('returns 404 when the authenticated user no longer exists', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.deleteAccount(7)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('does not delete the user if clearing synopsis pointers fails', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 7 });
    prisma.work.updateMany.mockRejectedValue(new Error('fk'));

    await expect(service.deleteAccount(7)).rejects.toThrow('fk');
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });
});
