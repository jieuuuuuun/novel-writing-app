import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import { PlanningService } from './planning.service.js';

const emptyCustomFields = {
  orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
};

describe('PlanningService', () => {
  let service: PlanningService;
  let prisma: {
    work: {
      findFirst: ReturnType<typeof vi.fn>;
    };
    workPlanning: {
      findUnique: ReturnType<typeof vi.fn>;
      findUniqueOrThrow: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    workPlanningCustomField: {
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
      workPlanning: {
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      workPlanningCustomField: {
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
    service = new PlanningService(prisma as unknown as PrismaService);
  });

  it('returns an empty planning payload without creating a row', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.workPlanning.findUnique.mockResolvedValue(null);

    await expect(service.findOne(4, 2)).resolves.toEqual({
      id: null,
      workId: 4,
      genre: '',
      subgenre: '',
      targetAudience: '',
      keywords: '',
      logline: '',
      introduction: '',
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
    expect(prisma.workPlanning.findUnique).toHaveBeenCalledWith({
      where: { workId: 4 },
      include: {
        customFields: emptyCustomFields,
      },
    });
    expect(prisma.workPlanning.create).not.toHaveBeenCalled();
  });

  it('returns 404 for another user work on GET', async () => {
    prisma.work.findFirst.mockResolvedValue(null);

    await expect(service.findOne(1, 2)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.workPlanning.findUnique).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing work on GET', async () => {
    prisma.work.findFirst.mockResolvedValue(null);

    await expect(service.findOne(99, 2)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates planning on the first PATCH', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.workPlanning.findUnique.mockResolvedValue(null);
    prisma.workPlanning.create.mockResolvedValue({ id: 10, workId: 4 });
    prisma.workPlanning.findUniqueOrThrow.mockResolvedValue({
      id: 10,
      workId: 4,
      genre: '판타지',
      subgenre: '',
      targetAudience: '',
      keywords: '',
      logline: '',
      introduction: '',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      customFields: [],
    });

    const result = await service.update(4, 2, {
      genre: '판타지',
      customFields: [],
    });

    expect(prisma.workPlanning.create).toHaveBeenCalledWith({
      data: {
        workId: 4,
        genre: '판타지',
        subgenre: '',
        targetAudience: '',
        keywords: '',
        logline: '',
        introduction: '',
      },
    });
    expect(prisma.workPlanning.update).not.toHaveBeenCalled();
    expect(result.id).toBe(10);
    expect(result.genre).toBe('판타지');
  });

  it('updates an existing planning on later PATCH', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.workPlanning.findUnique.mockResolvedValue({
      id: 10,
      workId: 4,
      customFields: [],
    });
    prisma.workPlanning.update.mockResolvedValue({ id: 10, workId: 4 });
    prisma.workPlanning.findUniqueOrThrow.mockResolvedValue({
      id: 10,
      workId: 4,
      genre: '로맨스',
      subgenre: '',
      targetAudience: '',
      keywords: '',
      logline: '',
      introduction: '',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-02'),
      customFields: [],
    });

    await service.update(4, 2, {
      genre: '로맨스',
      customFields: [],
    });

    expect(prisma.workPlanning.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: {
        genre: '로맨스',
        subgenre: '',
        targetAudience: '',
        keywords: '',
        logline: '',
        introduction: '',
      },
    });
    expect(prisma.workPlanning.create).not.toHaveBeenCalled();
  });

  it('creates a custom field without using client valueType', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.workPlanning.findUnique.mockResolvedValue({
      id: 10,
      workId: 4,
      customFields: [],
    });
    prisma.workPlanning.update.mockResolvedValue({ id: 10, workId: 4 });
    prisma.workPlanning.findUniqueOrThrow.mockResolvedValue({
      id: 10,
      workId: 4,
      genre: '',
      subgenre: '',
      targetAudience: '',
      keywords: '',
      logline: '',
      introduction: '',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      customFields: [
        {
          id: 21,
          planningId: 10,
          label: '분위기',
          value: '따뜻한',
          sortOrder: 0,
          valueType: 'text',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
      ],
    });

    await service.update(4, 2, {
      customFields: [
        {
          label: ' 분위기 ',
          value: '따뜻한',
          sortOrder: 0,
          valueType: 'date',
        } as never,
      ],
    });

    expect(prisma.workPlanningCustomField.create).toHaveBeenCalledWith({
      data: {
        planningId: 10,
        label: '분위기',
        value: '따뜻한',
        sortOrder: 0,
        valueType: 'text',
      },
    });
  });

  it('updates a owned custom field and reorders it', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.workPlanning.findUnique.mockResolvedValue({
      id: 10,
      workId: 4,
      customFields: [
        { id: 21, planningId: 10 },
        { id: 22, planningId: 10 },
      ],
    });
    prisma.workPlanning.update.mockResolvedValue({ id: 10, workId: 4 });
    prisma.workPlanning.findUniqueOrThrow.mockResolvedValue({
      id: 10,
      workId: 4,
      genre: '',
      subgenre: '',
      targetAudience: '',
      keywords: '',
      logline: '',
      introduction: '',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      customFields: [],
    });

    await service.update(4, 2, {
      customFields: [
        { id: 22, label: '참고 작품', value: 'A', sortOrder: 0 },
        { id: 21, label: '분위기', value: '차분한', sortOrder: 1 },
      ],
    });

    expect(prisma.workPlanningCustomField.update).toHaveBeenCalledWith({
      where: { id: 22 },
      data: {
        label: '참고 작품',
        value: 'A',
        sortOrder: 0,
      },
    });
    expect(prisma.workPlanningCustomField.update).toHaveBeenCalledWith({
      where: { id: 21 },
      data: {
        label: '분위기',
        value: '차분한',
        sortOrder: 1,
      },
    });
    expect(prisma.workPlanningCustomField.deleteMany).not.toHaveBeenCalled();
  });

  it('deletes custom fields omitted from the request array', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.workPlanning.findUnique.mockResolvedValue({
      id: 10,
      workId: 4,
      customFields: [
        { id: 21, planningId: 10 },
        { id: 22, planningId: 10 },
      ],
    });
    prisma.workPlanning.update.mockResolvedValue({ id: 10, workId: 4 });
    prisma.workPlanning.findUniqueOrThrow.mockResolvedValue({
      id: 10,
      workId: 4,
      genre: '',
      subgenre: '',
      targetAudience: '',
      keywords: '',
      logline: '',
      introduction: '',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      customFields: [],
    });

    await service.update(4, 2, {
      customFields: [{ id: 21, label: '분위기', value: '', sortOrder: 0 }],
    });

    expect(prisma.workPlanningCustomField.deleteMany).toHaveBeenCalledWith({
      where: {
        planningId: 10,
        id: { in: [22] },
      },
    });
  });

  it('rejects another planning custom field id', async () => {
    prisma.work.findFirst.mockResolvedValue({ id: 4 });
    prisma.workPlanning.findUnique.mockResolvedValue({
      id: 10,
      workId: 4,
      customFields: [{ id: 21, planningId: 10 }],
    });
    prisma.workPlanning.update.mockResolvedValue({ id: 10, workId: 4 });

    await expect(
      service.update(4, 2, {
        customFields: [
          { id: 99, label: '훔친 필드', value: 'x', sortOrder: 0 },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.workPlanningCustomField.update).not.toHaveBeenCalled();
  });

  it('returns 404 for another user work on PATCH', async () => {
    prisma.work.findFirst.mockResolvedValue(null);

    await expect(
      service.update(1, 2, { customFields: [] }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
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
});
