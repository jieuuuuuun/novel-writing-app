import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { UpdateWorldDto } from './dto/update-world.dto.js';
import type { WorldResponse } from './world.types.js';

const CUSTOM_FIELD_VALUE_TYPE = 'text';
const EMPTY_WORLD_FIELDS = {
  era: '',
  places: '',
  atmosphere: '',
} as const;
const CUSTOM_FIELD_ORDER = {
  orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }],
};

interface ParsedCustomField {
  id?: number;
  label: string;
  value: string;
  sortOrder: number;
}

interface ParsedWorldUpdate {
  era: string;
  places: string;
  atmosphere: string;
  customFields: ParsedCustomField[];
}

@Injectable()
export class WorldService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(workId: number, userId: number): Promise<WorldResponse> {
    await this.assertWorkOwned(workId, userId);

    const setting = await this.prisma.workWorldSetting.findUnique({
      where: { workId },
      include: {
        customFields: CUSTOM_FIELD_ORDER,
      },
    });

    if (!setting) {
      return this.emptyWorld(workId);
    }

    return this.toWorldResponse(setting);
  }

  async update(
    workId: number,
    userId: number,
    updateWorldDto: UpdateWorldDto,
  ): Promise<WorldResponse> {
    await this.assertWorkOwned(workId, userId);
    const parsed = this.parseUpdate(updateWorldDto);

    const setting = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.workWorldSetting.findUnique({
        where: { workId },
        include: { customFields: true },
      });

      const savedSetting = existing
        ? await tx.workWorldSetting.update({
            where: { id: existing.id },
            data: {
              era: parsed.era,
              places: parsed.places,
              atmosphere: parsed.atmosphere,
            },
          })
        : await tx.workWorldSetting.create({
            data: {
              workId,
              era: parsed.era,
              places: parsed.places,
              atmosphere: parsed.atmosphere,
            },
          });

      const existingFields = existing?.customFields ?? [];
      const existingById = new Map(
        existingFields.map((field) => [field.id, field]),
      );
      const keptIds = new Set<number>();

      for (const field of parsed.customFields) {
        if (field.id == null) {
          await tx.workWorldSettingCustomField.create({
            data: {
              settingId: savedSetting.id,
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
        await tx.workWorldSettingCustomField.update({
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
        await tx.workWorldSettingCustomField.deleteMany({
          where: {
            settingId: savedSetting.id,
            id: { in: idsToDelete },
          },
        });
      }

      return tx.workWorldSetting.findUniqueOrThrow({
        where: { id: savedSetting.id },
        include: {
          customFields: CUSTOM_FIELD_ORDER,
        },
      });
    });

    return this.toWorldResponse(setting);
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

  private emptyWorld(workId: number): WorldResponse {
    return {
      id: null,
      workId,
      ...EMPTY_WORLD_FIELDS,
      customFields: [],
      createdAt: null,
      updatedAt: null,
    };
  }

  private toWorldResponse(setting: {
    id: number;
    workId: number;
    era: string | null;
    places: string | null;
    atmosphere: string | null;
    createdAt: Date;
    updatedAt: Date;
    customFields: WorldResponse['customFields'];
  }): WorldResponse {
    return {
      id: setting.id,
      workId: setting.workId,
      era: setting.era ?? '',
      places: setting.places ?? '',
      atmosphere: setting.atmosphere ?? '',
      customFields: setting.customFields ?? [],
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
    };
  }

  private parseUpdate(dto: UpdateWorldDto): ParsedWorldUpdate {
    if (!Array.isArray(dto?.customFields)) {
      throw new BadRequestException('customFields must be an array.');
    }

    return {
      era: this.parseText(dto.era, 'era'),
      places: this.parseText(dto.places, 'places'),
      atmosphere: this.parseText(dto.atmosphere, 'atmosphere'),
      customFields: dto.customFields.map((field, index) =>
        this.parseCustomField(field, index),
      ),
    };
  }

  private parseCustomField(
    field: UpdateWorldDto['customFields'][number],
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
