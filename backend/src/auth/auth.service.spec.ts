import { NotFoundException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
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
