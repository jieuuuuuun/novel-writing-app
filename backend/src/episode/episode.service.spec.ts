import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import { EpisodeService } from './episode.service.js';

describe('EpisodeService', () => {
  let service: EpisodeService;
  let prisma: {
    work: {
      findFirst: ReturnType<typeof vi.fn>;
    };
    episode: {
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
        findFirst: vi.fn(),
      },
      episode: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };
    service = new EpisodeService(prisma as unknown as PrismaService);
  });

  it('creates an episode only after confirming work ownership', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.episode.create.mockResolvedValue({ id: 8 });
    const input = {
      workId: 4,
      title: 'Episode',
      content: 'Content',
      sortOrder: 1,
    };

    await service.create(2, input);

    expect(prisma.work.findFirst).toHaveBeenCalledWith({
      where: {
        id: 4,
        userId: 2,
      },
      select: { id: true },
    });
    expect(prisma.episode.create).toHaveBeenCalledWith({ data: input });
  });

  it('returns 404 when creating under another user work', async () => {
    prisma.work.findFirst.mockResolvedValue(null);

    await expect(
      service.create(2, {
        workId: 1,
        title: 'Episode',
        content: 'Content',
        sortOrder: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.episode.create).not.toHaveBeenCalled();
  });

  it('lists only episodes belonging to the authenticated user works', async () => {
    prisma.episode.findMany.mockResolvedValue([]);

    await service.findAll(2);

    expect(prisma.episode.findMany).toHaveBeenCalledWith({
      where: {
        work: { userId: 2 },
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('returns 404 for another user episode', async () => {
    prisma.episode.findFirst.mockResolvedValue(null);

    await expect(service.findOne(1, 2)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.episode.findFirst).toHaveBeenCalledWith({
      where: {
        id: 1,
        work: { userId: 2 },
      },
    });
  });

  it('updates and deletes an episode after ownership verification', async () => {
    prisma.episode.findFirst.mockResolvedValue({ id: 8, workId: 4 });
    prisma.episode.update.mockResolvedValue({ id: 8 });
    prisma.episode.delete.mockResolvedValue({ id: 8 });

    await service.update(8, 2, {
      title: 'Updated episode',
      content: 'Updated content',
      sortOrder: 2,
    });
    await service.remove(8, 2);

    expect(prisma.episode.findFirst).toHaveBeenCalledTimes(2);
    expect(prisma.episode.update).toHaveBeenCalledWith({
      where: { id: 8 },
      data: {
        title: 'Updated episode',
        content: 'Updated content',
        sortOrder: 2,
      },
    });
    expect(prisma.episode.delete).toHaveBeenCalledWith({
      where: { id: 8 },
    });
  });
});
