import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { RelationService } from './relation.service.js';

const createdAt = new Date('2026-01-01');
const updatedAt = new Date('2026-01-02');

function characterSummary(
  id: number,
  name: string,
  role: string | null = '주인공',
) {
  return { id, name, role };
}

function relationRecord(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: 11,
    workId: 4,
    characterAId: 2,
    characterBId: 5,
    type: '연인',
    summary: '서로를 다른 방식으로 바라본다',
    aToBLabel: '친구',
    aToBNote: '2는 5를 친구로 생각함',
    bToALabel: '짝사랑',
    bToANote: '5가 2를 좋아함',
    createdAt,
    updatedAt,
    characterA: characterSummary(2, '한서한', '남주'),
    characterB: characterSummary(5, '홍려은', '여주'),
    ...overrides,
  };
}

function uniqueConstraintError() {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: '7.10.0',
  });
}

describe('RelationService', () => {
  let service: RelationService;
  let prisma: {
    work: {
      findFirst: ReturnType<typeof vi.fn>;
    };
    character: {
      findMany: ReturnType<typeof vi.fn>;
    };
    characterRelation: {
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prisma = {
      work: {
        findFirst: vi.fn(),
      },
      character: {
        findMany: vi.fn(),
      },
      characterRelation: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };
    service = new RelationService(prisma as unknown as PrismaService);
  });

  it('returns an empty list for a work with no relations', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.characterRelation.findMany.mockResolvedValue([]);

    await expect(service.findAll(4, 2)).resolves.toEqual([]);
    expect(prisma.characterRelation.findMany).toHaveBeenCalledWith({
      where: { workId: 4 },
      include: {
        characterA: { select: { id: true, name: true, role: true } },
        characterB: { select: { id: true, name: true, role: true } },
      },
      orderBy: { id: 'asc' },
    });
  });

  it('creates a relation without swapping when A is already lower', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.findMany.mockResolvedValue([{ id: 2 }, { id: 5 }]);
    prisma.characterRelation.findFirst.mockResolvedValue(null);
    prisma.characterRelation.create.mockResolvedValue(relationRecord());

    const result = await service.create(4, 2, {
      characterAId: 2,
      characterBId: 5,
      type: ' 연인 ',
      summary: '서로를 다른 방식으로 바라본다',
      aToBLabel: '친구',
      aToBNote: '2는 5를 친구로 생각함',
      bToALabel: '짝사랑',
      bToANote: '5가 2를 좋아함',
    });

    expect(prisma.characterRelation.create).toHaveBeenCalledWith({
      data: {
        workId: 4,
        characterAId: 2,
        characterBId: 5,
        type: '연인',
        summary: '서로를 다른 방식으로 바라본다',
        aToBLabel: '친구',
        aToBNote: '2는 5를 친구로 생각함',
        bToALabel: '짝사랑',
        bToANote: '5가 2를 좋아함',
      },
      include: {
        characterA: { select: { id: true, name: true, role: true } },
        characterB: { select: { id: true, name: true, role: true } },
      },
    });
    expect(result.characterA.id).toBe(2);
    expect(result.characterB.id).toBe(5);
    expect(result.aToBLabel).toBe('친구');
    expect(result.bToALabel).toBe('짝사랑');
  });

  it('canonicalizes reversed ids and swaps directional fields on create', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.findMany.mockResolvedValue([{ id: 2 }, { id: 5 }]);
    prisma.characterRelation.findFirst.mockResolvedValue(null);
    prisma.characterRelation.create.mockResolvedValue(relationRecord());

    await service.create(4, 2, {
      characterAId: 5,
      characterBId: 2,
      aToBLabel: '짝사랑',
      aToBNote: '5가 2를 좋아함',
      bToALabel: '친구',
      bToANote: '2는 5를 친구로 생각함',
    });

    expect(prisma.characterRelation.create).toHaveBeenCalledWith({
      data: {
        workId: 4,
        characterAId: 2,
        characterBId: 5,
        type: '',
        summary: '',
        aToBLabel: '친구',
        aToBNote: '2는 5를 친구로 생각함',
        bToALabel: '짝사랑',
        bToANote: '5가 2를 좋아함',
      },
      include: {
        characterA: { select: { id: true, name: true, role: true } },
        characterB: { select: { id: true, name: true, role: true } },
      },
    });
  });

  it('returns a relation detail after ownership checks', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.characterRelation.findFirst.mockResolvedValue(relationRecord());

    const result = await service.findOne(4, 11, 2);

    expect(prisma.characterRelation.findFirst).toHaveBeenCalledWith({
      where: {
        id: 11,
        workId: 4,
      },
      include: {
        characterA: { select: { id: true, name: true, role: true } },
        characterB: { select: { id: true, name: true, role: true } },
      },
    });
    expect(result.id).toBe(11);
    expect(result.characterA.role).toBe('남주');
    expect(result.characterB.role).toBe('여주');
  });

  it('normalizes a missing character role to an empty string', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.characterRelation.findFirst.mockResolvedValue(
      relationRecord({
        characterA: characterSummary(2, '한서한', null),
      }),
    );

    const result = await service.findOne(4, 11, 2);

    expect(result.characterA.role).toBe('');
  });

  it('updates a relation and keeps the current pair when ids are omitted', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.characterRelation.findFirst
      .mockResolvedValueOnce(relationRecord())
      .mockResolvedValueOnce(null);
    prisma.character.findMany.mockResolvedValue([{ id: 2 }, { id: 5 }]);
    prisma.characterRelation.update.mockResolvedValue(
      relationRecord({ type: '라이벌', summary: '긴장 관계' }),
    );

    await service.update(4, 11, 2, {
      type: '라이벌',
      summary: '긴장 관계',
      aToBLabel: '친구',
      aToBNote: '2는 5를 친구로 생각함',
      bToALabel: '짝사랑',
      bToANote: '5가 2를 좋아함',
    });

    expect(prisma.characterRelation.update).toHaveBeenCalledWith({
      where: { id: 11 },
      data: {
        characterAId: 2,
        characterBId: 5,
        type: '라이벌',
        summary: '긴장 관계',
        aToBLabel: '친구',
        aToBNote: '2는 5를 친구로 생각함',
        bToALabel: '짝사랑',
        bToANote: '5가 2를 좋아함',
      },
      include: {
        characterA: { select: { id: true, name: true, role: true } },
        characterB: { select: { id: true, name: true, role: true } },
      },
    });
  });

  it('swaps directional fields on update when the selected pair is reversed', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.characterRelation.findFirst
      .mockResolvedValueOnce(relationRecord())
      .mockResolvedValueOnce(null);
    prisma.character.findMany.mockResolvedValue([{ id: 2 }, { id: 5 }]);
    prisma.characterRelation.update.mockResolvedValue(relationRecord());

    await service.update(4, 11, 2, {
      characterAId: 5,
      characterBId: 2,
      aToBLabel: '짝사랑',
      aToBNote: '5가 2를 좋아함',
      bToALabel: '친구',
      bToANote: '2는 5를 친구로 생각함',
    });

    expect(prisma.characterRelation.update).toHaveBeenCalledWith({
      where: { id: 11 },
      data: {
        characterAId: 2,
        characterBId: 5,
        type: '',
        summary: '',
        aToBLabel: '친구',
        aToBNote: '2는 5를 친구로 생각함',
        bToALabel: '짝사랑',
        bToANote: '5가 2를 좋아함',
      },
      include: {
        characterA: { select: { id: true, name: true, role: true } },
        characterB: { select: { id: true, name: true, role: true } },
      },
    });
  });

  it('allows updating a relation with its own current pair', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.characterRelation.findFirst
      .mockResolvedValueOnce(relationRecord())
      .mockResolvedValueOnce(null);
    prisma.character.findMany.mockResolvedValue([{ id: 2 }, { id: 5 }]);
    prisma.characterRelation.update.mockResolvedValue(relationRecord());

    await service.update(4, 11, 2, {
      characterAId: 2,
      characterBId: 5,
      type: '연인',
    });

    expect(prisma.characterRelation.findFirst).toHaveBeenLastCalledWith({
      where: {
        workId: 4,
        characterAId: 2,
        characterBId: 5,
        NOT: { id: 11 },
      },
      select: { id: true },
    });
  });

  it('deletes a relation after ownership verification', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.characterRelation.findFirst.mockResolvedValue(relationRecord());
    prisma.characterRelation.delete.mockResolvedValue(relationRecord());

    await service.remove(4, 11, 2);

    expect(prisma.characterRelation.delete).toHaveBeenCalledWith({
      where: { id: 11 },
    });
  });

  it('rejects a relation with itself', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });

    await expect(
      service.create(4, 2, { characterAId: 5, characterBId: 5 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.character.findMany).not.toHaveBeenCalled();
    expect(prisma.characterRelation.create).not.toHaveBeenCalled();
  });

  it('rejects creating the same pair twice', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.findMany.mockResolvedValue([{ id: 2 }, { id: 5 }]);
    prisma.characterRelation.findFirst.mockResolvedValue({ id: 11 });

    await expect(
      service.create(4, 2, { characterAId: 2, characterBId: 5 }),
    ).rejects.toMatchObject({
      message: 'Relation already exists.',
    });
    expect(prisma.characterRelation.create).not.toHaveBeenCalled();
  });

  it('rejects creating the reversed pair of an existing relation', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.findMany.mockResolvedValue([{ id: 2 }, { id: 5 }]);
    prisma.characterRelation.findFirst.mockResolvedValue({ id: 11 });

    await expect(
      service.create(4, 2, { characterAId: 5, characterBId: 2 }),
    ).rejects.toMatchObject({
      message: 'Relation already exists.',
    });
  });

  it('rejects a patch that collides with another relation', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.characterRelation.findFirst
      .mockResolvedValueOnce(relationRecord())
      .mockResolvedValueOnce({ id: 12 });
    prisma.character.findMany.mockResolvedValue([{ id: 2 }, { id: 8 }]);

    await expect(
      service.update(4, 11, 2, { characterAId: 2, characterBId: 8 }),
    ).rejects.toMatchObject({
      message: 'Relation already exists.',
    });
    expect(prisma.characterRelation.update).not.toHaveBeenCalled();
  });

  it('normalizes a unique constraint race to a 400', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.findMany.mockResolvedValue([{ id: 2 }, { id: 5 }]);
    prisma.characterRelation.findFirst.mockResolvedValue(null);
    prisma.characterRelation.create.mockRejectedValue(uniqueConstraintError());

    await expect(
      service.create(4, 2, { characterAId: 2, characterBId: 5 }),
    ).rejects.toMatchObject({
      message: 'Relation already exists.',
    });
  });

  it('rejects a missing character', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.findMany.mockResolvedValue([{ id: 2 }]);

    await expect(
      service.create(4, 2, { characterAId: 2, characterBId: 99 }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.characterRelation.create).not.toHaveBeenCalled();
  });

  it('returns 404 when a character belongs to another work', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.findMany.mockResolvedValue([{ id: 2 }]);

    await expect(
      service.create(4, 2, { characterAId: 2, characterBId: 30 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 for another user work', async () => {
    prisma.work.findFirst.mockResolvedValue(null);

    await expect(service.findAll(1, 2)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      service.create(1, 2, { characterAId: 2, characterBId: 5 }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.characterRelation.findMany).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing work', async () => {
    prisma.work.findFirst.mockResolvedValue(null);

    await expect(service.findOne(99, 11, 2)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns 404 for a missing relation', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.characterRelation.findFirst.mockResolvedValue(null);

    await expect(service.findOne(4, 8, 2)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns 404 for a relation from another work', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.characterRelation.findFirst.mockResolvedValue(null);

    await expect(service.update(4, 99, 2, { type: '친구' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.characterRelation.update).not.toHaveBeenCalled();
  });

  it('rejects a type longer than 50 characters', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });

    await expect(
      service.create(4, 2, {
        characterAId: 2,
        characterBId: 5,
        type: '가'.repeat(51),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a summary longer than 300 characters', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });

    await expect(
      service.create(4, 2, {
        characterAId: 2,
        characterBId: 5,
        summary: '가'.repeat(301),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a label longer than 50 characters', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });

    await expect(
      service.create(4, 2, {
        characterAId: 2,
        characterBId: 5,
        aToBLabel: '가'.repeat(51),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a non-integer character id', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });

    await expect(
      service.create(4, 2, {
        characterAId: 1.5 as unknown as number,
        characterBId: 5,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.character.findMany).not.toHaveBeenCalled();
  });

  it('rejects a non-positive character id', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });

    await expect(
      service.create(4, 2, {
        characterAId: 0,
        characterBId: 5,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
