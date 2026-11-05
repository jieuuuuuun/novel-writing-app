import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import { SynopsisService } from './synopsis.service.js';

const createdAt = new Date('2026-01-01');
const updatedAt = new Date('2026-01-02');
const listOrder = {
  orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
};

function synopsisRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 21,
    workId: 4,
    title: '초고',
    summary: '한 줄 줄거리',
    beginning: '도입',
    development: '전개',
    crisis: '위기',
    ending: '결말',
    memo: '메모',
    sortOrder: 0,
    createdAt,
    updatedAt,
    ...overrides,
  };
}

describe('SynopsisService', () => {
  let service: SynopsisService;
  let prisma: {
    work: {
      findFirst: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    synopsisVersion: {
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      aggregate: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    prisma = {
      work: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      synopsisVersion: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
        aggregate: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      $transaction: vi.fn(),
    };
    prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof prisma) => Promise<unknown>) =>
        callback(prisma),
    );
    service = new SynopsisService(prisma as unknown as PrismaService);
  });

  it('returns 404 for another user work', async () => {
    prisma.work.findFirst.mockResolvedValue(null);

    await expect(service.findAll(4, 2)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.work.findFirst).toHaveBeenCalledWith({
      where: {
        id: 4,
        userId: 2,
      },
      select: {
        id: true,
        currentSynopsisVersionId: true,
      },
    });
  });

  it('returns 404 for a missing work', async () => {
    prisma.work.findFirst.mockResolvedValue(null);

    await expect(service.findOne(99, 21, 2)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns 404 for a synopsis that belongs to another work', async () => {
    prisma.work.findFirst.mockResolvedValue({
      id: 4,
      currentSynopsisVersionId: null,
    });
    prisma.synopsisVersion.findFirst.mockResolvedValue(null);

    await expect(service.findOne(4, 21, 2)).rejects.toThrow('Synopsis not found.');
    expect(prisma.synopsisVersion.findFirst).toHaveBeenCalledWith({
      where: {
        id: 21,
        workId: 4,
      },
    });
  });

  it('returns an empty list payload', async () => {
    prisma.work.findFirst.mockResolvedValue({
      id: 4,
      currentSynopsisVersionId: null,
    });
    prisma.synopsisVersion.findMany.mockResolvedValue([]);

    await expect(service.findAll(4, 2)).resolves.toEqual({
      currentId: null,
      items: [],
    });
    expect(prisma.synopsisVersion.findMany).toHaveBeenCalledWith({
      where: { workId: 4 },
      ...listOrder,
      select: {
        id: true,
        title: true,
        sortOrder: true,
        updatedAt: true,
      },
    });
  });

  it('lists versions by sortOrder then id and computes isCurrent', async () => {
    prisma.work.findFirst.mockResolvedValue({
      id: 4,
      currentSynopsisVersionId: 22,
    });
    prisma.synopsisVersion.findMany.mockResolvedValue([
      {
        id: 21,
        title: '초고',
        sortOrder: 0,
        updatedAt,
      },
      {
        id: 22,
        title: '투고용',
        sortOrder: 1,
        updatedAt,
      },
    ]);

    const result = await service.findAll(4, 2);

    expect(result.currentId).toBe(22);
    expect(result.items[0]).toEqual({
      id: 21,
      title: '초고',
      sortOrder: 0,
      isCurrent: false,
      updatedAt,
    });
    expect(result.items[1].isCurrent).toBe(true);
    expect(result.items[0]).not.toHaveProperty('summary');
    expect(result.items[0]).not.toHaveProperty('memo');
  });

  it('creates the first version as 초고 and sets it current', async () => {
    prisma.work.findFirst.mockResolvedValue({
      id: 4,
      currentSynopsisVersionId: null,
    });
    prisma.synopsisVersion.count.mockResolvedValue(0);
    prisma.synopsisVersion.aggregate.mockResolvedValue({
      _max: { sortOrder: null },
    });
    prisma.synopsisVersion.create.mockResolvedValue(
      synopsisRecord({
        summary: null,
        beginning: null,
        development: null,
        crisis: null,
        ending: null,
        memo: null,
      }),
    );

    const result = await service.create(4, 2, {});

    expect(prisma.synopsisVersion.create).toHaveBeenCalledWith({
      data: {
        workId: 4,
        title: '초고',
        sortOrder: 0,
      },
    });
    expect(prisma.work.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: { currentSynopsisVersionId: 21 },
    });
    expect(result.title).toBe('초고');
    expect(result.isCurrent).toBe(true);
    expect(result.sortOrder).toBe(0);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('creates later versions as 새 버전 without changing current', async () => {
    prisma.work.findFirst.mockResolvedValue({
      id: 4,
      currentSynopsisVersionId: 21,
    });
    prisma.synopsisVersion.count.mockResolvedValue(1);
    prisma.synopsisVersion.aggregate.mockResolvedValue({
      _max: { sortOrder: 0 },
    });
    prisma.synopsisVersion.create.mockResolvedValue(
      synopsisRecord({
        id: 22,
        title: '새 버전',
        sortOrder: 1,
        summary: null,
        beginning: null,
        development: null,
        crisis: null,
        ending: null,
        memo: null,
      }),
    );

    const result = await service.create(4, 2, {});

    expect(prisma.synopsisVersion.create).toHaveBeenCalledWith({
      data: {
        workId: 4,
        title: '새 버전',
        sortOrder: 1,
      },
    });
    expect(prisma.work.update).not.toHaveBeenCalled();
    expect(result.title).toBe('새 버전');
    expect(result.isCurrent).toBe(false);
    expect(result.sortOrder).toBe(1);
  });

  it('uses a custom title and next sortOrder', async () => {
    prisma.work.findFirst.mockResolvedValue({
      id: 4,
      currentSynopsisVersionId: 21,
    });
    prisma.synopsisVersion.count.mockResolvedValue(1);
    prisma.synopsisVersion.aggregate.mockResolvedValue({
      _max: { sortOrder: 3 },
    });
    prisma.synopsisVersion.create.mockResolvedValue(
      synopsisRecord({
        id: 22,
        title: '투고용',
        sortOrder: 4,
        summary: null,
        beginning: null,
        development: null,
        crisis: null,
        ending: null,
        memo: null,
      }),
    );

    const result = await service.create(4, 2, { title: ' 투고용 ' });

    expect(prisma.synopsisVersion.create).toHaveBeenCalledWith({
      data: {
        workId: 4,
        title: '투고용',
        sortOrder: 4,
      },
    });
    expect(result.title).toBe('투고용');
  });

  it('rejects an empty title', async () => {
    prisma.work.findFirst.mockResolvedValue({
      id: 4,
      currentSynopsisVersionId: null,
    });

    await expect(service.create(4, 2, { title: '   ' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects a title longer than 100 characters', async () => {
    prisma.work.findFirst.mockResolvedValue({
      id: 4,
      currentSynopsisVersionId: null,
    });

    await expect(
      service.create(4, 2, { title: '가'.repeat(101) }),
    ).rejects.toThrow('title must be at most 100 characters.');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('normalizes nullable body fields and computes isCurrent', async () => {
    prisma.work.findFirst.mockResolvedValue({
      id: 4,
      currentSynopsisVersionId: 21,
    });
    prisma.synopsisVersion.findFirst.mockResolvedValue(
      synopsisRecord({
        summary: null,
        beginning: null,
        development: null,
        crisis: null,
        ending: null,
        memo: null,
      }),
    );

    const result = await service.findOne(4, 21, 2);

    expect(result).toMatchObject({
      summary: '',
      beginning: '',
      development: '',
      crisis: '',
      ending: '',
      memo: '',
      isCurrent: true,
    });
  });

  it('updates title and body fields without changing current', async () => {
    prisma.work.findFirst.mockResolvedValue({
      id: 4,
      currentSynopsisVersionId: 21,
    });
    prisma.synopsisVersion.findFirst.mockResolvedValue(synopsisRecord());
    prisma.synopsisVersion.update.mockResolvedValue(
      synopsisRecord({
        title: '1차 수정',
        summary: '수정된 줄거리',
        memo: '',
      }),
    );

    const result = await service.update(4, 21, 2, {
      title: '1차 수정',
      summary: '수정된 줄거리',
      memo: '',
    });

    expect(prisma.synopsisVersion.update).toHaveBeenCalledWith({
      where: { id: 21 },
      data: {
        title: '1차 수정',
        summary: '수정된 줄거리',
        memo: '',
      },
    });
    expect(prisma.work.update).not.toHaveBeenCalled();
    expect(result.title).toBe('1차 수정');
    expect(result.summary).toBe('수정된 줄거리');
    expect(result.memo).toBe('');
    expect(result.isCurrent).toBe(true);
  });

  it('allows empty body fields and ignores current in PATCH', async () => {
    prisma.work.findFirst.mockResolvedValue({
      id: 4,
      currentSynopsisVersionId: 21,
    });
    prisma.synopsisVersion.findFirst.mockResolvedValue(synopsisRecord());
    prisma.synopsisVersion.update.mockResolvedValue(
      synopsisRecord({
        beginning: '',
        development: '전개\n다음 줄',
      }),
    );

    await service.update(4, 21, 2, {
      beginning: '',
      development: '전개\n다음 줄',
    });

    expect(prisma.synopsisVersion.update).toHaveBeenCalledWith({
      where: { id: 21 },
      data: {
        beginning: '',
        development: '전개\n다음 줄',
      },
    });
    expect(prisma.synopsisVersion.update.mock.calls[0][0].data).not.toHaveProperty(
      'isCurrent',
    );
    expect(prisma.synopsisVersion.update.mock.calls[0][0].data).not.toHaveProperty(
      'sortOrder',
    );
    expect(prisma.synopsisVersion.update.mock.calls[0][0].data).not.toHaveProperty(
      'workId',
    );
  });

  it('duplicates a version with copied body and a new id', async () => {
    prisma.work.findFirst.mockResolvedValue({
      id: 4,
      currentSynopsisVersionId: 21,
    });
    prisma.synopsisVersion.findFirst.mockResolvedValue(synopsisRecord());
    prisma.synopsisVersion.aggregate.mockResolvedValue({
      _max: { sortOrder: 0 },
    });
    prisma.synopsisVersion.create.mockResolvedValue(
      synopsisRecord({
        id: 22,
        title: '초고 복사',
        sortOrder: 1,
      }),
    );

    const result = await service.duplicate(4, 21, 2, {});

    expect(prisma.synopsisVersion.create).toHaveBeenCalledWith({
      data: {
        workId: 4,
        title: '초고 복사',
        summary: '한 줄 줄거리',
        beginning: '도입',
        development: '전개',
        crisis: '위기',
        ending: '결말',
        memo: '메모',
        sortOrder: 1,
      },
    });
    expect(prisma.work.update).not.toHaveBeenCalled();
    expect(result.id).toBe(22);
    expect(result.title).toBe('초고 복사');
    expect(result.summary).toBe('한 줄 줄거리');
    expect(result.isCurrent).toBe(false);
    expect(result.sortOrder).toBe(1);
  });

  it('uses a custom duplicate title', async () => {
    prisma.work.findFirst.mockResolvedValue({
      id: 4,
      currentSynopsisVersionId: 21,
    });
    prisma.synopsisVersion.findFirst.mockResolvedValue(synopsisRecord());
    prisma.synopsisVersion.aggregate.mockResolvedValue({
      _max: { sortOrder: 2 },
    });
    prisma.synopsisVersion.create.mockResolvedValue(
      synopsisRecord({
        id: 23,
        title: '최종',
        sortOrder: 3,
      }),
    );

    await service.duplicate(4, 21, 2, { title: '최종' });

    expect(prisma.synopsisVersion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: '최종',
        sortOrder: 3,
      }),
    });
  });

  it('truncates a generated copy title to 100 characters', async () => {
    const longTitle = '가'.repeat(100);
    prisma.work.findFirst.mockResolvedValue({
      id: 4,
      currentSynopsisVersionId: 21,
    });
    prisma.synopsisVersion.findFirst.mockResolvedValue(
      synopsisRecord({ title: longTitle }),
    );
    prisma.synopsisVersion.aggregate.mockResolvedValue({
      _max: { sortOrder: 0 },
    });
    prisma.synopsisVersion.create.mockResolvedValue(
      synopsisRecord({
        id: 22,
        title: `${'가'.repeat(97)} 복사`,
        sortOrder: 1,
      }),
    );

    await service.duplicate(4, 21, 2, {});

    expect(prisma.synopsisVersion.create.mock.calls[0][0].data.title).toHaveLength(
      100,
    );
    expect(prisma.synopsisVersion.create.mock.calls[0][0].data.title).toMatch(
      / 복사$/,
    );
  });

  it('sets current for a version in the same work', async () => {
    prisma.work.findFirst.mockResolvedValue({
      id: 4,
      currentSynopsisVersionId: 21,
    });
    prisma.synopsisVersion.findFirst.mockResolvedValue(
      synopsisRecord({ id: 22 }),
    );

    await expect(service.setCurrent(4, 22, 2)).resolves.toEqual({
      currentId: 22,
    });
    expect(prisma.work.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: { currentSynopsisVersionId: 22 },
    });
  });

  it('returns 404 when setting current to another work version', async () => {
    prisma.work.findFirst.mockResolvedValue({
      id: 4,
      currentSynopsisVersionId: 21,
    });
    prisma.synopsisVersion.findFirst.mockResolvedValue(null);

    await expect(service.setCurrent(4, 99, 2)).rejects.toThrow(
      'Synopsis not found.',
    );
    expect(prisma.work.update).not.toHaveBeenCalled();
  });

  it('allows setting the same current version again', async () => {
    prisma.work.findFirst.mockResolvedValue({
      id: 4,
      currentSynopsisVersionId: 21,
    });
    prisma.synopsisVersion.findFirst.mockResolvedValue(synopsisRecord());

    await expect(service.setCurrent(4, 21, 2)).resolves.toEqual({
      currentId: 21,
    });
    expect(prisma.work.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: { currentSynopsisVersionId: 21 },
    });
  });

  it('deletes a non-current version without changing current', async () => {
    prisma.work.findFirst.mockResolvedValue({
      id: 4,
      currentSynopsisVersionId: 21,
    });
    prisma.synopsisVersion.findFirst.mockResolvedValue(
      synopsisRecord({ id: 22 }),
    );

    await expect(service.remove(4, 22, 2)).resolves.toEqual({
      deletedId: 22,
      currentId: 21,
    });
    expect(prisma.work.update).not.toHaveBeenCalled();
    expect(prisma.synopsisVersion.delete).toHaveBeenCalledWith({
      where: { id: 22 },
    });
  });

  it('promotes the most recently updated remaining version after deleting current', async () => {
    const later = new Date('2026-03-01');
    prisma.work.findFirst.mockResolvedValue({
      id: 4,
      currentSynopsisVersionId: 21,
    });
    prisma.synopsisVersion.findFirst
      .mockResolvedValueOnce(synopsisRecord())
      .mockResolvedValueOnce(
        synopsisRecord({
          id: 23,
          title: '최종',
          updatedAt: later,
        }),
      );

    const result = await service.remove(4, 21, 2);

    expect(prisma.work.update).toHaveBeenNthCalledWith(1, {
      where: { id: 4 },
      data: { currentSynopsisVersionId: null },
    });
    expect(prisma.synopsisVersion.delete).toHaveBeenCalledWith({
      where: { id: 21 },
    });
    expect(prisma.synopsisVersion.findFirst).toHaveBeenLastCalledWith({
      where: { workId: 4 },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
    expect(prisma.work.update).toHaveBeenNthCalledWith(2, {
      where: { id: 4 },
      data: { currentSynopsisVersionId: 23 },
    });
    expect(result).toEqual({
      deletedId: 21,
      currentId: 23,
    });
  });

  it('clears current after deleting the last version', async () => {
    prisma.work.findFirst.mockResolvedValue({
      id: 4,
      currentSynopsisVersionId: 21,
    });
    prisma.synopsisVersion.findFirst
      .mockResolvedValueOnce(synopsisRecord())
      .mockResolvedValueOnce(null);

    await expect(service.remove(4, 21, 2)).resolves.toEqual({
      deletedId: 21,
      currentId: null,
    });
    expect(prisma.work.update).toHaveBeenCalledTimes(1);
    expect(prisma.work.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: { currentSynopsisVersionId: null },
    });
  });

  it('returns 200 with null current when none is set', async () => {
    prisma.work.findFirst.mockResolvedValue({
      id: 4,
      currentSynopsisVersionId: null,
    });

    await expect(service.findCurrent(4, 2)).resolves.toEqual({
      current: null,
    });
    expect(prisma.synopsisVersion.findFirst).not.toHaveBeenCalled();
  });

  it('returns the current version detail including memo', async () => {
    prisma.work.findFirst.mockResolvedValue({
      id: 4,
      currentSynopsisVersionId: 21,
    });
    prisma.synopsisVersion.findFirst.mockResolvedValue(synopsisRecord());

    const result = await service.findCurrent(4, 2);

    expect(result.current).toMatchObject({
      id: 21,
      title: '초고',
      summary: '한 줄 줄거리',
      beginning: '도입',
      development: '전개',
      crisis: '위기',
      ending: '결말',
      memo: '메모',
      isCurrent: true,
    });
  });
});
