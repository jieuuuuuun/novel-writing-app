import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { UpdatePlanningDto } from './dto/update-planning.dto.js';
import type { PlanningResponse } from './planning.types.js';

const CUSTOM_FIELD_VALUE_TYPE = 'text';
const EMPTY_PLANNING_FIELDS = {
  genre: '',
  subgenre: '',
  targetAudience: '',
  keywords: '',
  logline: '',
  introduction: '',
} as const;

interface ParsedCustomField {
  id?: number;
  label: string;
  value: string;
  sortOrder: number;
}

interface ParsedPlanningUpdate {
  genre: string;
  subgenre: string;
  targetAudience: string;
  keywords: string;
  logline: string;
  introduction: string;
  customFields: ParsedCustomField[];
}

@Injectable()
export class PlanningService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(workId: number, userId: number): Promise<PlanningResponse> {
    await this.assertWorkOwned(workId, userId);

    const planning = await this.prisma.workPlanning.findUnique({
      where: { workId },
      include: {
        customFields: {
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        },
      },
    });

    if (!planning) {
      return this.emptyPlanning(workId);
    }

    return this.toPlanningResponse(planning);
  }

  async update(
    workId: number,
    userId: number,
    updatePlanningDto: UpdatePlanningDto,
  ): Promise<PlanningResponse> {
    await this.assertWorkOwned(workId, userId);
    const parsed = this.parseUpdate(updatePlanningDto);

    const planning = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.workPlanning.findUnique({
        where: { workId },
        include: { customFields: true },
      });

      const savedPlanning = existing
        ? await tx.workPlanning.update({
            where: { id: existing.id },
            data: {
              genre: parsed.genre,
              subgenre: parsed.subgenre,
              targetAudience: parsed.targetAudience,
              keywords: parsed.keywords,
              logline: parsed.logline,
              introduction: parsed.introduction,
            },
          })
        : await tx.workPlanning.create({
            data: {
              workId,
              genre: parsed.genre,
              subgenre: parsed.subgenre,
              targetAudience: parsed.targetAudience,
              keywords: parsed.keywords,
              logline: parsed.logline,
              introduction: parsed.introduction,
            },
          });

      const existingFields = existing?.customFields ?? [];
      const existingById = new Map(
        existingFields.map((field) => [field.id, field]),
      );
      const keptIds = new Set<number>();

      for (const field of parsed.customFields) {
        if (field.id == null) {
          await tx.workPlanningCustomField.create({
            data: {
              planningId: savedPlanning.id,
              label: field.label,
              value: field.value,
              sortOrder: field.sortOrder,
              valueType: CUSTOM_FIELD_VALUE_TYPE,
            },
          });
          continue;
        }

        if (keptIds.has(field.id) || !existingById.has(field.id)) {
          throw new BadRequestException('Invalid custom field.');
        }

        keptIds.add(field.id);
        await tx.workPlanningCustomField.update({
          where: { id: field.id },
          data: {
            label: field.label,
            value: field.value,
            sortOrder: field.sortOrder,
          },
        });
      }

      const idsToDelete = existingFields
        .filter((field) => !keptIds.has(field.id))
        .map((field) => field.id);

      if (idsToDelete.length > 0) {
        await tx.workPlanningCustomField.deleteMany({
          where: {
            planningId: savedPlanning.id,
            id: { in: idsToDelete },
          },
        });
      }

      return tx.workPlanning.findUniqueOrThrow({
        where: { id: savedPlanning.id },
        include: {
          customFields: {
            orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          },
        },
      });
    });

    return this.toPlanningResponse(planning);
  }

  private async assertWorkOwned(workId: number, userId: number) {
    const work = await this.prisma.work.findFirst({
      where: {
        id: workId,
        userId,
      },
      select: { id: true },
    });

    if (!work) {
      throw new NotFoundException('Work not found.');
    }
  }

  private emptyPlanning(workId: number): PlanningResponse {
    return {
      id: null,
      workId,
      ...EMPTY_PLANNING_FIELDS,
      customFields: [],
      createdAt: null,
      updatedAt: null,
    };
  }

  private toPlanningResponse(planning: {
    id: number;
    workId: number;
    genre: string | null;
    subgenre: string | null;
    targetAudience: string | null;
    keywords: string | null;
    logline: string | null;
    introduction: string | null;
    createdAt: Date;
    updatedAt: Date;
    customFields: PlanningResponse['customFields'];
  }): PlanningResponse {
    return {
      id: planning.id,
      workId: planning.workId,
      genre: planning.genre ?? '',
      subgenre: planning.subgenre ?? '',
      targetAudience: planning.targetAudience ?? '',
      keywords: planning.keywords ?? '',
      logline: planning.logline ?? '',
      introduction: planning.introduction ?? '',
      customFields: planning.customFields,
      createdAt: planning.createdAt,
      updatedAt: planning.updatedAt,
    };
  }

  private parseUpdate(dto: UpdatePlanningDto): ParsedPlanningUpdate {
    if (!Array.isArray(dto?.customFields)) {
      throw new BadRequestException('customFields must be an array.');
    }

    return {
      genre: this.parseBoundedString(dto.genre, 'genre', 100),
      subgenre: this.parseBoundedString(dto.subgenre, 'subgenre', 100),
      targetAudience: this.parseBoundedString(
        dto.targetAudience,
        'targetAudience',
        200,
      ),
      keywords: this.parseBoundedString(dto.keywords, 'keywords', 500),
      logline: this.parseText(dto.logline, 'logline'),
      introduction: this.parseText(dto.introduction, 'introduction'),
      customFields: dto.customFields.map((field, index) =>
        this.parseCustomField(field, index),
      ),
    };
  }

  private parseCustomField(
    field: UpdatePlanningDto['customFields'][number],
    index: number,
  ): ParsedCustomField {
    if (field == null || typeof field !== 'object') {
      throw new BadRequestException(`customFields[${index}] is invalid.`);
    }

    const label = this.parseBoundedString(field.label, 'label', 100).trim();

    if (!label) {
      throw new BadRequestException('Custom field label is required.');
    }

    let value = '';

    if (field.value != null) {
      if (typeof field.value !== 'string') {
        throw new BadRequestException('Custom field value must be a string.');
      }

      value = field.value;
    }

    if (!Number.isInteger(field.sortOrder) || field.sortOrder < 0) {
      throw new BadRequestException(
        'Custom field sortOrder must be an integer of 0 or more.',
      );
    }

    const parsed: ParsedCustomField = {
      label,
      value,
      sortOrder: field.sortOrder,
    };

    if (field.id !== undefined && field.id !== null) {
      if (!Number.isInteger(field.id) || field.id < 1) {
        throw new BadRequestException('Invalid custom field.');
      }

      parsed.id = field.id;
    }

    return parsed;
  }

  private parseBoundedString(
    value: string | undefined,
    fieldName: string,
    maxLength: number,
  ) {
    const parsed = this.parseText(value, fieldName);

    if (parsed.length > maxLength) {
      throw new BadRequestException(
        `${fieldName} must be at most ${maxLength} characters.`,
      );
    }

    return parsed;
  }

  private parseText(value: string | undefined, fieldName: string) {
    if (value == null) {
      return '';
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} must be a string.`);
    }

    return value;
  }
}
