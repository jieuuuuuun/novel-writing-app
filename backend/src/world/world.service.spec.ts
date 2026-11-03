import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import { WorldService } from './world.service.js';

const createdAt = new Date('2026-01-01');
const updatedAt = new Date('2026-01-02');
const customFieldOrder = {
  orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
};

function settingRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    workId: 4,
    era: '현대 서울',
    places: '명화그룹 사옥',
    atmosphere: '차분하고 차가운',
    createdAt,
    updatedAt,
    customFields: [],
    ...overrides,
  };
}

describe('WorldService', () => {
  let service: WorldService;
  let prisma: {
    work: {
      findFirst: ReturnType<typeof vi.fn>;
    };
    workWorldSetting: {
      findUnique: ReturnType<typeof vi.fn>;
      findUniqueOrThrow: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    workWorldSettingCustomField: {
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
      workWorldSetting: {
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      workWorldSettingCustomField: {
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
    service = new WorldService(prisma as unknown as PrismaService);
  });

  it('returns an empty world payload without creating a row', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.workWorldSetting.findUnique.mockResolvedValue(null);

    await expect(service.findOne(4, 2)).resolves.toEqual({
      id: null,
      workId: 4,
      era: '',
      places: '',
      atmosphere: '',
      customFields: [],
      createdAt: null,
      updatedAt: null,
    });
    expect(prisma.work.findFirst).toHaveBeenCalledWith({
      where: {
        id: 4,
        userId: 2,
      },
      select: { id: true },
    });
    expect(prisma.workWorldSetting.findUnique).toHaveBeenCalledWith({
      where: { workId: 4 },
      include: {
        customFields: customFieldOrder,
      },
    });
    expect(prisma.workWorldSetting.create).not.toHaveBeenCalled();
  });

  it('returns stored world fields and normalizes null strings', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.workWorldSetting.findUnique.mockResolvedValue(
      settingRecord({
        era: null,
        places: '명화그룹 사옥',
        atmosphere: null,
      }),
    );

    await expect(service.findOne(4, 2)).resolves.toEqual({
      id: 10,
      workId: 4,
      era: '',
      places: '명화그룹 사옥',
      atmosphere: '',
      customFields: [],
      createdAt,
      updatedAt,
    });
  });

  it('loads custom fields in sortOrder then id order', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.workWorldSetting.findUnique.mockResolvedValue(settingRecord());

    await service.findOne(4, 2);

    expect(prisma.workWorldSetting.findUnique).toHaveBeenCalledWith({
      where: { workId: 4 },
      include: {
        customFields: customFieldOrder,
      },
    });
  });

  it('returns 404 for another user work on GET', async () => {
    prisma.work.findFirst.mockResolvedValue(null);

    await expect(service.findOne(1, 2)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.workWorldSetting.findUnique).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing work on GET', async () => {
    prisma.work.findFirst.mockResolvedValue(null);

    await expect(service.findOne(99, 2)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates a world setting on the first PATCH', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.workWorldSetting.findUnique.mockResolvedValue(null);
    prisma.workWorldSetting.create.mockResolvedValue({ id: 10, workId: 4 });
    prisma.workWorldSetting.findUniqueOrThrow.mockResolvedValue(
      settingRecord({
        era: '현대\n서울',
        places: '사옥',
        atmosphere: '차가운',
      }),
    );

    const result = await service.update(4, 2, {
      era: '현대\n서울',
      places: '사옥',
      atmosphere: '차가운',
      customFields: [],
    });

    expect(prisma.workWorldSetting.create).toHaveBeenCalledWith({
      data: {
        workId: 4,
        era: '현대\n서울',
        places: '사옥',
        atmosphere: '차가운',
      },
    });
    expect(prisma.workWorldSetting.update).not.toHaveBeenCalled();
    expect(result.id).toBe(10);
    expect(result.era).toBe('현대\n서울');
  });

  it('updates an existing world setting on later PATCH', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.workWorldSetting.findUnique.mockResolvedValue({
      id: 10,
      workId: 4,
      customFields: [],
    });
    prisma.workWorldSetting.update.mockResolvedValue({ id: 10, workId: 4 });
    prisma.workWorldSetting.findUniqueOrThrow.mockResolvedValue(
      settingRecord({
        era: '근미래',
        places: '강력계',
        atmosphere: '긴장감',
      }),
    );

    await service.update(4, 2, {
      era: '근미래',
      places: '강력계',
      atmosphere: '긴장감',
      customFields: [],
    });

    expect(prisma.workWorldSetting.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: {
        era: '근미래',
        places: '강력계',
        atmosphere: '긴장감',
      },
    });
    expect(prisma.workWorldSetting.create).not.toHaveBeenCalled();
  });

  it('creates a custom field without using client valueType', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.workWorldSetting.findUnique.mockResolvedValue({
      id: 10,
      workId: 4,
      customFields: [],
    });
    prisma.workWorldSetting.update.mockResolvedValue({ id: 10, workId: 4 });
    prisma.workWorldSetting.findUniqueOrThrow.mockResolvedValue(
      settingRecord({
        customFields: [
          {
            id: 21,
            settingId: 10,
            label: '회사',
            value: '명화그룹',
            sortOrder: 0,
            valueType: 'text',
            createdAt,
            updatedAt,
          },
        ],
      }),
    );

    await service.update(4, 2, {
      customFields: [
        {
          label: ' 회사 ',
          value: '명화그룹',
          sortOrder: 0,
          valueType: 'date',
        } as never,
      ],
    });

    expect(prisma.workWorldSettingCustomField.create).toHaveBeenCalledWith({
      data: {
        settingId: 10,
        label: '회사',
        value: '명화그룹',
        sortOrder: 0,
        valueType: 'text',
      },
    });
  });

  it('updates an owned custom field and reorders it', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.workWorldSetting.findUnique.mockResolvedValue({
      id: 10,
      workId: 4,
      customFields: [
        { id: 21, settingId: 10 },
        { id: 22, settingId: 10 },
      ],
    });
    prisma.workWorldSetting.update.mockResolvedValue({ id: 10, workId: 4 });
    prisma.workWorldSetting.findUniqueOrThrow.mockResolvedValue(
      settingRecord(),
    );

    await service.update(4, 2, {
      customFields: [
        { id: 22, label: '조직', value: '강력계', sortOrder: 0 },
        { id: 21, label: '회사', value: '명화그룹', sortOrder: 1 },
      ],
    });

    expect(prisma.workWorldSettingCustomField.update).toHaveBeenCalledWith({
      where: { id: 22 },
      data: {
        label: '조직',
        value: '강력계',
        sortOrder: 0,
      },
    });
    expect(prisma.workWorldSettingCustomField.update).toHaveBeenCalledWith({
      where: { id: 21 },
      data: {
        label: '회사',
        value: '명화그룹',
        sortOrder: 1,
      },
    });
    expect(prisma.workWorldSettingCustomField.deleteMany).not.toHaveBeenCalled();
  });

  it('deletes custom fields omitted from the request array', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.workWorldSetting.findUnique.mockResolvedValue({
      id: 10,
      workId: 4,
      customFields: [
        { id: 21, settingId: 10 },
        { id: 22, settingId: 10 },
      ],
    });
    prisma.workWorldSetting.update.mockResolvedValue({ id: 10, workId: 4 });
    prisma.workWorldSetting.findUniqueOrThrow.mockResolvedValue(
      settingRecord(),
    );

    await service.update(4, 2, {
      customFields: [{ id: 21, label: '회사', value: '', sortOrder: 0 }],
    });

    expect(prisma.workWorldSettingCustomField.deleteMany).toHaveBeenCalledWith({
      where: {
        settingId: 10,
        id: { in: [22] },
      },
    });
  });

  it('rejects another setting custom field id', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.workWorldSetting.findUnique.mockResolvedValue({
      id: 10,
      workId: 4,
      customFields: [{ id: 21, settingId: 10 }],
    });
    prisma.workWorldSetting.update.mockResolvedValue({ id: 10, workId: 4 });

    await expect(
      service.update(4, 2, {
        customFields: [
          { id: 99, label: '훔친 필드', value: 'x', sortOrder: 0 },
        ],
      }),
    ).rejects.toMatchObject({
      message: 'Invalid custom field.',
    });
    expect(prisma.workWorldSettingCustomField.update).not.toHaveBeenCalled();
  });

  it('rejects duplicate custom field ids', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.workWorldSetting.findUnique.mockResolvedValue({
      id: 10,
      workId: 4,
      customFields: [{ id: 21, settingId: 10 }],
    });
    prisma.workWorldSetting.update.mockResolvedValue({ id: 10, workId: 4 });

    await expect(
      service.update(4, 2, {
        customFields: [
          { id: 21, label: '회사', value: 'A', sortOrder: 0 },
          { id: 21, label: '조직', value: 'B', sortOrder: 1 },
        ],
      }),
    ).rejects.toMatchObject({
      message: 'Invalid custom field.',
    });
  });

  it('rejects a blank custom field label', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });

    await expect(
      service.update(4, 2, {
        customFields: [{ label: '   ', value: 'x', sortOrder: 0 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects a custom field label longer than 100 characters', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });

    await expect(
      service.update(4, 2, {
        customFields: [{ label: '가'.repeat(101), value: 'x', sortOrder: 0 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('allows an empty custom field value', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.workWorldSetting.findUnique.mockResolvedValue({
      id: 10,
      workId: 4,
      customFields: [],
    });
    prisma.workWorldSetting.update.mockResolvedValue({ id: 10, workId: 4 });
    prisma.workWorldSetting.findUniqueOrThrow.mockResolvedValue(
      settingRecord(),
    );

    await service.update(4, 2, {
      customFields: [{ label: '화폐', value: '', sortOrder: 0 }],
    });

    expect(prisma.workWorldSettingCustomField.create).toHaveBeenCalledWith({
      data: {
        settingId: 10,
        label: '화폐',
        value: '',
        sortOrder: 0,
        valueType: 'text',
      },
    });
  });

  it('rejects a negative or fractional sortOrder', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });

    await expect(
      service.update(4, 2, {
        customFields: [{ label: '회사', value: '명화그룹', sortOrder: -1 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.update(4, 2, {
        customFields: [{ label: '회사', value: '명화그룹', sortOrder: 1.5 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rolls back the transaction when a later custom field write fails', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.workWorldSetting.findUnique.mockResolvedValue({
      id: 10,
      workId: 4,
      customFields: [],
    });
    prisma.workWorldSetting.update.mockResolvedValue({ id: 10, workId: 4 });
    prisma.workWorldSettingCustomField.create.mockRejectedValue(
      new Error('write failed'),
    );

    await expect(
      service.update(4, 2, {
        customFields: [{ label: '회사', value: '명화그룹', sortOrder: 0 }],
      }),
    ).rejects.toThrow('write failed');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.workWorldSetting.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it('returns 404 for another user work on PATCH', async () => {
    prisma.work.findFirst.mockResolvedValue(null);

    await expect(
      service.update(1, 2, { customFields: [] }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
