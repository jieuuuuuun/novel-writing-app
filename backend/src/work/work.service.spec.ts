import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import { WorkService } from './work.service.js';

describe('WorkService', () => {
  let service: WorkService;
  let prisma: {
    work: {
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prisma = {
      work: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };
    service = new WorkService(prisma as unknown as PrismaService);
  });

  it('creates a work with the authenticated user id', async () => {
    prisma.work.create.mockResolvedValue({ id: 10 });

    await service.create(2, {
      title: 'My work',
      subtitle: 'Subtitle',
    });

    expect(prisma.work.create).toHaveBeenCalledWith({
      data: {
        title: 'My work',
        subtitle: 'Subtitle',
        userId: 2,
      },
    });
  });

  it('lists only works owned by the authenticated user', async () => {
    prisma.work.findMany.mockResolvedValue([]);

    await service.findAll(2);

    expect(prisma.work.findMany).toHaveBeenCalledWith({
      where: { userId: 2 },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('returns 404 for another user work', async () => {
    prisma.work.findFirst.mockResolvedValue(null);

    await expect(service.findOne(1, 2)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.work.findFirst).toHaveBeenCalledWith({
      where: {
        id: 1,
        userId: 2,
      },
    });
  });

  it('updates and deletes a work after ownership verification', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4, userId: 2 });
    prisma.work.update.mockResolvedValue({ id: 4 });
    prisma.work.delete.mockResolvedValue({ id: 4 });

    await service.update(4, 2, { title: 'Updated' });
    await service.remove(4, 2);

    expect(prisma.work.findFirst).toHaveBeenCalledTimes(2);
    expect(prisma.work.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: {
        title: 'Updated',
        subtitle: undefined,
      },
    });
    expect(prisma.work.delete).toHaveBeenCalledWith({
      where: { id: 4 },
    });
  });
});
