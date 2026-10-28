import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import { CharacterService } from './character.service.js';

const createdAt = new Date('2026-01-01');
const updatedAt = new Date('2026-01-02');

function characterRecord(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: 21,
    workId: 4,
    name: '서윤',
    role: '주인공',
    age: '20대 후반',
    occupation: '경찰',
    summary: '한 줄 소개',
    goal: '진실을 밝힌다',
    trauma: '과거의 사건',
    weakness: '쉽게 믿는다',
    lack: '안정감',
    quote: '이번엔 놓치지 않겠어.',
    sortOrder: 0,
    createdAt,
    updatedAt,
    ...overrides,
  };
}

describe('CharacterService', () => {
  let service: CharacterService;
  let prisma: {
    work: {
      findFirst: ReturnType<typeof vi.fn>;
    };
    character: {
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      aggregate: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    prisma = {
      work: {
        findFirst: vi.fn(),
      },
      character: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        aggregate: vi.fn(),
      },
      $transaction: vi.fn(),
    };
    prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof prisma) => Promise<unknown>) =>
        callback(prisma),
    );
    service = new CharacterService(prisma as unknown as PrismaService);
  });

  it('returns an empty list for a work with no characters', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.findMany.mockResolvedValue([]);

    await expect(service.findAll(4, 2)).resolves.toEqual([]);
    expect(prisma.character.findMany).toHaveBeenCalledWith({
      where: { workId: 4 },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  });

  it('creates a character with only a name and sortOrder 0', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.aggregate.mockResolvedValue({
      _max: { sortOrder: null },
    });
    prisma.character.create.mockResolvedValue(
      characterRecord({
        role: '',
        age: '',
        occupation: '',
        summary: '',
        goal: '',
        trauma: '',
        weakness: '',
        lack: '',
        quote: '',
      }),
    );

    const result = await service.create(4, 2, { name: ' 서윤 ' });

    expect(prisma.character.create).toHaveBeenCalledWith({
      data: {
        workId: 4,
        name: '서윤',
        role: '',
        age: '',
        occupation: '',
        summary: '',
        goal: '',
        trauma: '',
        weakness: '',
        lack: '',
        quote: '',
        sortOrder: 0,
      },
    });
    expect(result.name).toBe('서윤');
    expect(result.sortOrder).toBe(0);
  });

  it('creates a character with every field and increments sortOrder', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.aggregate.mockResolvedValue({
      _max: { sortOrder: 0 },
    });
    prisma.character.create.mockResolvedValue(characterRecord({ sortOrder: 1 }));

    await service.create(4, 2, {
      name: '민재',
      role: '남주',
      age: '30',
      occupation: '기자',
      summary: '소개',
      goal: '목표',
      trauma: '트라우마',
      weakness: '약점',
      lack: '결핍',
      quote: '대사',
    });

    expect(prisma.character.create).toHaveBeenCalledWith({
      data: {
        workId: 4,
        name: '민재',
        role: '남주',
        age: '30',
        occupation: '기자',
        summary: '소개',
        goal: '목표',
        trauma: '트라우마',
        weakness: '약점',
        lack: '결핍',
        quote: '대사',
        sortOrder: 1,
      },
    });
  });

  it('returns a character detail after ownership checks', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.findFirst.mockResolvedValue(characterRecord());

    const result = await service.findOne(4, 21, 2);

    expect(prisma.character.findFirst).toHaveBeenCalledWith({
      where: {
        id: 21,
        workId: 4,
      },
    });
    expect(result.id).toBe(21);
    expect(result.role).toBe('주인공');
  });

  it('updates a character without changing sortOrder or workId', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.findFirst.mockResolvedValue(characterRecord());
    prisma.character.update.mockResolvedValue(
      characterRecord({ name: '서윤 수정', role: '여주' }),
    );

    await service.update(4, 21, 2, {
      name: '서윤 수정',
      role: '여주',
    });

    expect(prisma.character.update).toHaveBeenCalledWith({
      where: { id: 21 },
      data: {
        name: '서윤 수정',
        role: '여주',
        age: '',
        occupation: '',
        summary: '',
        goal: '',
        trauma: '',
        weakness: '',
        lack: '',
        quote: '',
      },
    });
  });

  it('deletes a character after ownership verification', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.findFirst.mockResolvedValue(characterRecord());
    prisma.character.delete.mockResolvedValue(characterRecord());

    await service.remove(4, 21, 2);

    expect(prisma.character.delete).toHaveBeenCalledWith({
      where: { id: 21 },
    });
  });

  it('rejects a blank name on create', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });

    await expect(service.create(4, 2, { name: '   ' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects a blank name on update', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.findFirst.mockResolvedValue(characterRecord());

    await expect(
      service.update(4, 21, 2, { name: '' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.character.update).not.toHaveBeenCalled();
  });

  it('rejects a name longer than 100 characters', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });

    await expect(
      service.create(4, 2, { name: '가'.repeat(101) }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns 404 for another user work', async () => {
    prisma.work.findFirst.mockResolvedValue(null);

    await expect(service.findAll(1, 2)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.create(1, 2, { name: '서윤' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.character.findMany).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing work', async () => {
    prisma.work.findFirst.mockResolvedValue(null);

    await expect(service.findOne(99, 21, 2)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns 404 for a character from another work', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.findFirst.mockResolvedValue(null);

    await expect(service.findOne(4, 99, 2)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.character.findFirst).toHaveBeenCalledWith({
      where: {
        id: 99,
        workId: 4,
      },
    });
  });

  it('returns 404 for a missing character', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.findFirst.mockResolvedValue(null);

    await expect(service.update(4, 8, 2, { name: '서윤' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.character.update).not.toHaveBeenCalled();
  });
});
