import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateCharacterDto } from './dto/create-character.dto.js';
import type {
  UpdateCharacterCustomFieldDto,
  UpdateCharacterDto,
  UpdateCharacterProfileDto,
} from './dto/update-character.dto.js';
import type {
  CharacterCustomFieldResponse,
  CharacterDetailResponse,
  CharacterListResponse,
  CharacterProfileResponse,
} from './character.types.js';

const CUSTOM_FIELD_VALUE_TYPE = 'text';
const DETAIL_INCLUDE = {
  profile: true,
  customFields: {
    orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }],
  },
};
const EMPTY_PROFILE: CharacterProfileResponse = {
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

interface ParsedCharacterFields {
  name: string;
  role: string;
  age: string;
  occupation: string;
  summary: string;
  goal: string;
  trauma: string;
  weakness: string;
  lack: string;
  quote: string;
}

interface ParsedCustomField {
  id?: number;
  label: string;
  value: string;
  sortOrder: number;
}

interface ParsedCharacterUpdate extends ParsedCharacterFields {
  profile?: CharacterProfileResponse;
  customFields?: ParsedCustomField[];
}

@Injectable()
export class CharacterService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    workId: number,
    userId: number,
  ): Promise<CharacterListResponse[]> {
    await this.assertWorkOwned(workId, userId);

    const characters = await this.prisma.character.findMany({
      where: { workId },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });

    return characters.map((character) => this.toListResponse(character));
  }

  async findOne(
    workId: number,
    characterId: number,
    userId: number,
  ): Promise<CharacterDetailResponse> {
    const character = await this.findOwnedCharacter(
      workId,
      characterId,
      userId,
      DETAIL_INCLUDE,
    );

    return this.toDetailResponse(character);
  }

  async create(
    workId: number,
    userId: number,
    createCharacterDto: CreateCharacterDto,
  ): Promise<CharacterListResponse> {
    await this.assertWorkOwned(workId, userId);
    const parsed = this.parseFields(createCharacterDto);

    const character = await this.prisma.$transaction(async (tx) => {
      const aggregate = await tx.character.aggregate({
        where: { workId },
        _max: { sortOrder: true },
      });
      const sortOrder = (aggregate._max.sortOrder ?? -1) + 1;

      return tx.character.create({
        data: {
          workId,
          ...parsed,
          sortOrder,
        },
      });
    });

    return this.toListResponse(character);
  }

  async update(
    workId: number,
    characterId: number,
    userId: number,
    updateCharacterDto: UpdateCharacterDto,
  ): Promise<CharacterDetailResponse> {
    await this.findOwnedCharacter(workId, characterId, userId);
    const parsed = this.parseUpdate(updateCharacterDto);

    const character = await this.prisma.$transaction(async (tx) => {
      await tx.character.update({
        where: { id: characterId },
        data: {
          name: parsed.name,
          role: parsed.role,
          age: parsed.age,
          occupation: parsed.occupation,
          summary: parsed.summary,
          goal: parsed.goal,
          trauma: parsed.trauma,
          weakness: parsed.weakness,
          lack: parsed.lack,
          quote: parsed.quote,
        },
      });

      if (parsed.profile) {
        await tx.characterProfile.upsert({
          where: { characterId },
          create: {
            characterId,
            ...parsed.profile,
          },
          update: parsed.profile,
        });
      }

      if (parsed.customFields) {
        await this.syncCustomFields(tx, characterId, parsed.customFields);
      }

      return tx.character.findFirstOrThrow({
        where: { id: characterId },
        include: DETAIL_INCLUDE,
      });
    });

    return this.toDetailResponse(character);
  }

  async remove(workId: number, characterId: number, userId: number) {
    await this.findOwnedCharacter(workId, characterId, userId);

    return this.prisma.character.delete({
      where: { id: characterId },
    });
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

  private async findOwnedCharacter(
    workId: number,
    characterId: number,
    userId: number,
    include?: typeof DETAIL_INCLUDE,
  ) {
    await this.assertWorkOwned(workId, userId);

    const character = await this.prisma.character.findFirst({
      where: {
        id: characterId,
        workId,
      },
      ...(include ? { include } : {}),
    });

    if (!character) {
      throw new NotFoundException('Character not found.');
    }

    return character;
  }

  private async syncCustomFields(
    tx: {
      characterCustomField: PrismaService['characterCustomField'];
    },
    characterId: number,
    fields: ParsedCustomField[],
  ) {
    const existingFields = await tx.characterCustomField.findMany({
      where: { characterId },
    });
    const existingById = new Map(
      existingFields.map((field) => [field.id, field]),
    );
    const keptIds = new Set<number>();

    for (const field of fields) {
      if (field.id == null) {
        await tx.characterCustomField.create({
          data: {
            characterId,
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
      await tx.characterCustomField.update({
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
      await tx.characterCustomField.deleteMany({
        where: {
          characterId,
          id: { in: idsToDelete },
        },
      });
    }
  }

  private parseUpdate(dto: UpdateCharacterDto): ParsedCharacterUpdate {
    return {
      ...this.parseFields(dto),
      profile: this.parseProfile(dto.profile),
      customFields: this.parseCustomFields(dto.customFields),
    };
  }

  private parseFields(
    dto: CreateCharacterDto | UpdateCharacterDto,
  ): ParsedCharacterFields {
    const name = this.parseBoundedString(dto.name, 'name', 100).trim();

    if (!name) {
      throw new BadRequestException('name is required.');
    }

    return {
      name,
      role: this.parseBoundedString(dto.role, 'role', 100).trim(),
      age: this.parseBoundedString(dto.age, 'age', 50).trim(),
      occupation: this.parseBoundedString(
        dto.occupation,
        'occupation',
        100,
      ).trim(),
      summary: this.parseBoundedString(dto.summary, 'summary', 300).trim(),
      goal: this.parseText(dto.goal, 'goal'),
      trauma: this.parseText(dto.trauma, 'trauma'),
      weakness: this.parseText(dto.weakness, 'weakness'),
      lack: this.parseText(dto.lack, 'lack'),
      quote: this.parseText(dto.quote, 'quote'),
    };
  }

  private parseProfile(
    profile: UpdateCharacterProfileDto | undefined,
  ): CharacterProfileResponse | undefined {
    if (profile === undefined) {
      return undefined;
    }

    if (profile == null || typeof profile !== 'object') {
      throw new BadRequestException('profile must be an object.');
    }

    return {
      height: this.parseShortProfileField(profile.height, 'height', 100),
      bodyType: this.parseShortProfileField(profile.bodyType, 'bodyType', 100),
      hair: this.parseShortProfileField(profile.hair, 'hair', 200),
      eyes: this.parseShortProfileField(profile.eyes, 'eyes', 200),
      skin: this.parseShortProfileField(profile.skin, 'skin', 100),
      fashion: this.parseShortProfileField(profile.fashion, 'fashion', 200),
      feature: this.parseShortProfileField(profile.feature, 'feature', 200),
      appearanceNote: this.parseText(profile.appearanceNote, 'appearanceNote'),
      personality: this.parseText(profile.personality, 'personality'),
      likes: this.parseText(profile.likes, 'likes'),
      dislikes: this.parseText(profile.dislikes, 'dislikes'),
      secret: this.parseText(profile.secret, 'secret'),
      habits: this.parseText(profile.habits, 'habits'),
      speechMannerism: this.parseText(
        profile.speechMannerism,
        'speechMannerism',
      ),
      signature: this.parseText(profile.signature, 'signature'),
    };
  }

  private parseCustomFields(
    customFields: UpdateCharacterCustomFieldDto[] | undefined,
  ): ParsedCustomField[] | undefined {
    if (customFields === undefined) {
      return undefined;
    }

    if (!Array.isArray(customFields)) {
      throw new BadRequestException('customFields must be an array.');
    }

    return customFields.map((field, index) =>
      this.parseCustomField(field, index),
    );
  }

  private parseCustomField(
    field: UpdateCharacterCustomFieldDto,
    index: number,
  ): ParsedCustomField {
    if (field == null || typeof field !== 'object') {
      throw new BadRequestException(`customFields[${index}] is invalid.`);
    }

    const label = this.parseBoundedString(field.label, 'label', 100).trim();

    if (!label) {
      throw new BadRequestException('Custom field label is required.');
    }

    if (field.value != null && typeof field.value !== 'string') {
      throw new BadRequestException('Custom field value must be a string.');
    }

    if (!Number.isInteger(field.sortOrder) || field.sortOrder < 0) {
      throw new BadRequestException(
        'Custom field sortOrder must be an integer of 0 or more.',
      );
    }

    const parsed: ParsedCustomField = {
      label,
      value: field.value ?? '',
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

  private toListResponse(character: {
    id: number;
    workId: number;
    name: string;
    role: string | null;
    age: string | null;
    occupation: string | null;
    summary: string | null;
    goal: string | null;
    trauma: string | null;
    weakness: string | null;
    lack: string | null;
    quote: string | null;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  }): CharacterListResponse {
    return {
      id: character.id,
      workId: character.workId,
      name: character.name,
      role: character.role ?? '',
      age: character.age ?? '',
      occupation: character.occupation ?? '',
      summary: character.summary ?? '',
      goal: character.goal ?? '',
      trauma: character.trauma ?? '',
      weakness: character.weakness ?? '',
      lack: character.lack ?? '',
      quote: character.quote ?? '',
      sortOrder: character.sortOrder,
      createdAt: character.createdAt,
      updatedAt: character.updatedAt,
    };
  }

  private toDetailResponse(character: {
    id: number;
    workId: number;
    name: string;
    role: string | null;
    age: string | null;
    occupation: string | null;
    summary: string | null;
    goal: string | null;
    trauma: string | null;
    weakness: string | null;
    lack: string | null;
    quote: string | null;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
    profile?: {
      height: string | null;
      bodyType: string | null;
      hair: string | null;
      eyes: string | null;
      skin: string | null;
      fashion: string | null;
      feature: string | null;
      appearanceNote: string | null;
      personality: string | null;
      likes: string | null;
      dislikes: string | null;
      secret: string | null;
      habits: string | null;
      speechMannerism: string | null;
      signature: string | null;
    } | null;
    customFields?: CharacterCustomFieldResponse[];
  }): CharacterDetailResponse {
    return {
      ...this.toListResponse(character),
      profile: this.toProfileResponse(character.profile),
      customFields: character.customFields ?? [],
    };
  }

  private toProfileResponse(
    profile:
      | {
          height: string | null;
          bodyType: string | null;
          hair: string | null;
          eyes: string | null;
          skin: string | null;
          fashion: string | null;
          feature: string | null;
          appearanceNote: string | null;
          personality: string | null;
          likes: string | null;
          dislikes: string | null;
          secret: string | null;
          habits: string | null;
          speechMannerism: string | null;
          signature: string | null;
        }
      | null
      | undefined,
  ): CharacterProfileResponse {
    if (!profile) {
      return { ...EMPTY_PROFILE };
    }

    return {
      height: profile.height ?? '',
      bodyType: profile.bodyType ?? '',
      hair: profile.hair ?? '',
      eyes: profile.eyes ?? '',
      skin: profile.skin ?? '',
      fashion: profile.fashion ?? '',
      feature: profile.feature ?? '',
      appearanceNote: profile.appearanceNote ?? '',
      personality: profile.personality ?? '',
      likes: profile.likes ?? '',
      dislikes: profile.dislikes ?? '',
      secret: profile.secret ?? '',
      habits: profile.habits ?? '',
      speechMannerism: profile.speechMannerism ?? '',
      signature: profile.signature ?? '',
    };
  }

  private parseShortProfileField(
    value: string | undefined,
    fieldName: string,
    maxLength: number,
  ) {
    return this.parseBoundedString(value, fieldName, maxLength).trim();
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
