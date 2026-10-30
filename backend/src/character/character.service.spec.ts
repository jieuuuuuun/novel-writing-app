import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import { CharacterService } from './character.service.js';

const createdAt = new Date('2026-01-01');
const updatedAt = new Date('2026-01-02');
const emptyProfile = {
  height: '',
  bodyType: '',
  hair: '',
  eyes: '',
  skin: '',
  fashion: '',
  feature: '',
  appearanceNote: '',
  personality: '',
  likes: '',
  dislikes: '',
  secret: '',
  habits: '',
  speechMannerism: '',
  signature: '',
};
const detailInclude = {
  profile: true,
  customFields: {
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  },
};

function characterRecord(overrides: Record<string, unknown> = {}) {
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

function detailRecord(overrides: Record<string, unknown> = {}) {
  return characterRecord({
    profile: null,
    customFields: [],
    ...overrides,
  });
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
      findFirstOrThrow: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      aggregate: ReturnType<typeof vi.fn>;
    };
    characterProfile: {
      upsert: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
    characterCustomField: {
      findMany: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
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
        findFirstOrThrow: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        aggregate: vi.fn(),
      },
      characterProfile: {
        upsert: vi.fn(),
        create: vi.fn(),
      },
      characterCustomField: {
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        deleteMany: vi.fn(),
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

  it('keeps the list payload without profile or customFields', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.findMany.mockResolvedValue([characterRecord()]);

    const [result] = await service.findAll(4, 2);

    expect(prisma.character.findMany.mock.calls[0][0]).not.toHaveProperty(
      'include',
    );
    expect(result).not.toHaveProperty('profile');
    expect(result).not.toHaveProperty('customFields');
    expect(result.quote).toBe('이번엔 놓치지 않겠어.');
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
    expect(prisma.characterProfile.upsert).not.toHaveBeenCalled();
    expect(prisma.characterCustomField.create).not.toHaveBeenCalled();
    expect(result.name).toBe('서윤');
    expect(result.sortOrder).toBe(0);
    expect(result).not.toHaveProperty('profile');
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

  it('returns a character detail with an empty profile when none exists', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.findFirst.mockResolvedValue(detailRecord());

    const result = await service.findOne(4, 21, 2);

    expect(prisma.character.findFirst).toHaveBeenCalledWith({
      where: {
        id: 21,
        workId: 4,
      },
      include: detailInclude,
    });
    expect(prisma.characterProfile.create).not.toHaveBeenCalled();
    expect(prisma.characterProfile.upsert).not.toHaveBeenCalled();
    expect(result.id).toBe(21);
    expect(result.role).toBe('주인공');
    expect(result.profile).toEqual(emptyProfile);
    expect(result.customFields).toEqual([]);
  });

  it('returns stored profile and custom fields on detail GET', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.findFirst.mockResolvedValue(
      detailRecord({
        profile: {
          height: '168',
          bodyType: '슬림',
          hair: '흑발',
          eyes: '갈색',
          skin: '',
          fashion: '',
          feature: '',
          appearanceNote: '왼손목 팔찌',
          personality: '차분하다',
          likes: '커피',
          dislikes: '',
          secret: '',
          habits: '',
          speechMannerism: '',
          signature: '팔찌',
        },
        customFields: [
          {
            id: 8,
            characterId: 21,
            label: 'MBTI',
            value: 'INFJ',
            sortOrder: 0,
            valueType: 'text',
            createdAt,
            updatedAt,
          },
        ],
      }),
    );

    const result = await service.findOne(4, 21, 2);

    expect(result.profile.height).toBe('168');
    expect(result.profile.signature).toBe('팔찌');
    expect(result.customFields).toHaveLength(1);
    expect(result.customFields[0].label).toBe('MBTI');
  });

  it('updates a character without changing sortOrder or workId', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.findFirst.mockResolvedValue(characterRecord());
    prisma.character.update.mockResolvedValue(
      characterRecord({ name: '서윤 수정', role: '여주' }),
    );
    prisma.character.findFirstOrThrow.mockResolvedValue(
      detailRecord({ name: '서윤 수정', role: '여주' }),
    );

    const result = await service.update(4, 21, 2, {
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
    expect(prisma.characterProfile.upsert).not.toHaveBeenCalled();
    expect(prisma.characterCustomField.findMany).not.toHaveBeenCalled();
    expect(result.profile).toEqual(emptyProfile);
  });

  it('creates a profile on the first PATCH and updates it later', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.findFirst.mockResolvedValue(characterRecord());
    prisma.character.update.mockResolvedValue(characterRecord());
    prisma.character.findFirstOrThrow.mockResolvedValue(
      detailRecord({
        profile: {
          ...emptyProfile,
          height: '168',
          personality: '차분하다',
        },
      }),
    );

    await service.update(4, 21, 2, {
      name: '서윤',
      profile: {
        height: ' 168 ',
        personality: '차분하다',
      },
    });

    expect(prisma.characterProfile.upsert).toHaveBeenCalledWith({
      where: { characterId: 21 },
      create: {
        characterId: 21,
        ...emptyProfile,
        height: '168',
        personality: '차분하다',
      },
      update: {
        ...emptyProfile,
        height: '168',
        personality: '차분하다',
      },
    });
  });

  it('creates a custom field without using client valueType', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.findFirst.mockResolvedValue(characterRecord());
    prisma.character.update.mockResolvedValue(characterRecord());
    prisma.characterCustomField.findMany.mockResolvedValue([]);
    prisma.character.findFirstOrThrow.mockResolvedValue(detailRecord());

    await service.update(4, 21, 2, {
      name: '서윤',
      customFields: [
        {
          label: ' MBTI ',
          value: 'INFJ',
          sortOrder: 0,
          valueType: 'date',
        } as never,
      ],
    });

    expect(prisma.characterCustomField.create).toHaveBeenCalledWith({
      data: {
        characterId: 21,
        label: 'MBTI',
        value: 'INFJ',
        sortOrder: 0,
        valueType: 'text',
      },
    });
  });

  it('updates owned custom fields and reorders them', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.findFirst.mockResolvedValue(characterRecord());
    prisma.character.update.mockResolvedValue(characterRecord());
    prisma.characterCustomField.findMany.mockResolvedValue([
      { id: 8, characterId: 21 },
      { id: 9, characterId: 21 },
    ]);
    prisma.character.findFirstOrThrow.mockResolvedValue(detailRecord());

    await service.update(4, 21, 2, {
      name: '서윤',
      customFields: [
        { id: 9, label: '종족', value: '인간', sortOrder: 0 },
        { id: 8, label: 'MBTI', value: 'INFJ', sortOrder: 1 },
      ],
    });

    expect(prisma.characterCustomField.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: {
        label: '종족',
        value: '인간',
        sortOrder: 0,
      },
    });
    expect(prisma.characterCustomField.update).toHaveBeenCalledWith({
      where: { id: 8 },
      data: {
        label: 'MBTI',
        value: 'INFJ',
        sortOrder: 1,
      },
    });
    expect(prisma.characterCustomField.deleteMany).not.toHaveBeenCalled();
  });

  it('deletes custom fields omitted from the request array', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.findFirst.mockResolvedValue(characterRecord());
    prisma.character.update.mockResolvedValue(characterRecord());
    prisma.characterCustomField.findMany.mockResolvedValue([
      { id: 8, characterId: 21 },
      { id: 9, characterId: 21 },
    ]);
    prisma.character.findFirstOrThrow.mockResolvedValue(detailRecord());

    await service.update(4, 21, 2, {
      name: '서윤',
      customFields: [{ id: 8, label: 'MBTI', value: '', sortOrder: 0 }],
    });

    expect(prisma.characterCustomField.deleteMany).toHaveBeenCalledWith({
      where: {
        characterId: 21,
        id: { in: [9] },
      },
    });
  });

  it('rejects another character custom field id', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.findFirst.mockResolvedValue(characterRecord());
    prisma.character.update.mockResolvedValue(characterRecord());
    prisma.characterCustomField.findMany.mockResolvedValue([
      { id: 8, characterId: 21 },
    ]);

    await expect(
      service.update(4, 21, 2, {
        name: '서윤',
        customFields: [
          { id: 99, label: '훔친 필드', value: 'x', sortOrder: 0 },
        ],
      }),
    ).rejects.toMatchObject({
      message: 'Invalid custom field.',
    });
    expect(prisma.characterCustomField.update).not.toHaveBeenCalled();
  });

  it('rejects duplicate custom field ids', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.findFirst.mockResolvedValue(characterRecord());
    prisma.character.update.mockResolvedValue(characterRecord());
    prisma.characterCustomField.findMany.mockResolvedValue([
      { id: 8, characterId: 21 },
    ]);

    await expect(
      service.update(4, 21, 2, {
        name: '서윤',
        customFields: [
          { id: 8, label: 'A', value: '1', sortOrder: 0 },
          { id: 8, label: 'B', value: '2', sortOrder: 1 },
        ],
      }),
    ).rejects.toMatchObject({
      message: 'Invalid custom field.',
    });
  });

  it('rejects a blank custom field label', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.findFirst.mockResolvedValue(characterRecord());

    await expect(
      service.update(4, 21, 2, {
        name: '서윤',
        customFields: [{ label: '   ', value: 'x', sortOrder: 0 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects a profile short field longer than its limit', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.findFirst.mockResolvedValue(characterRecord());

    await expect(
      service.update(4, 21, 2, {
        name: '서윤',
        profile: { height: '가'.repeat(101) },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('deletes a character after ownership verification without extra child deletes', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.findFirst.mockResolvedValue(characterRecord());
    prisma.character.delete.mockResolvedValue(characterRecord());

    await service.remove(4, 21, 2);

    expect(prisma.character.delete).toHaveBeenCalledWith({
      where: { id: 21 },
    });
    expect(prisma.characterCustomField.deleteMany).not.toHaveBeenCalled();
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
      include: detailInclude,
    });
  });

  it('returns 404 for a missing character', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.character.findFirst.mockResolvedValue(null);

    await expect(
      service.update(4, 8, 2, { name: '서윤' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.character.update).not.toHaveBeenCalled();
  });
});
