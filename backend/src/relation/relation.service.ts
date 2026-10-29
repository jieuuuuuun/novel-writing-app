import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { canonicalizeRelationInput } from './relation.canonicalize.js';
import type { CreateRelationDto } from './dto/create-relation.dto.js';
import type { UpdateRelationDto } from './dto/update-relation.dto.js';
import type { RelationResponse } from './relation.types.js';

const relationCharacterSelect = {
  id: true,
  name: true,
  role: true,
} as const;

const relationInclude = {
  characterA: { select: relationCharacterSelect },
  characterB: { select: relationCharacterSelect },
} as const;

type RelationRecord = Prisma.CharacterRelationGetPayload<{
  include: typeof relationInclude;
}>;

@Injectable()
export class RelationService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(workId: number, userId: number): Promise<RelationResponse[]> {
    await this.assertWorkOwned(workId, userId);

    const relations = await this.prisma.characterRelation.findMany({
      where: { workId },
      include: relationInclude,
      orderBy: { id: 'asc' },
    });

    return relations.map((relation) => this.toRelationResponse(relation));
  }

  async findOne(
    workId: number,
    relationId: number,
    userId: number,
  ): Promise<RelationResponse> {
    const relation = await this.findOwnedRelation(workId, relationId, userId);
    return this.toRelationResponse(relation);
  }

  async create(
    workId: number,
    userId: number,
    createRelationDto: CreateRelationDto,
  ): Promise<RelationResponse> {
    await this.assertWorkOwned(workId, userId);

    const parsed = this.parseFields(createRelationDto);
    await this.assertCharactersInWork(
      workId,
      parsed.characterAId,
      parsed.characterBId,
    );
    await this.assertUniquePair(workId, parsed.characterAId, parsed.characterBId);

    try {
      const relation = await this.prisma.characterRelation.create({
        data: {
          workId,
          ...parsed,
        },
        include: relationInclude,
      });

      return this.toRelationResponse(relation);
    } catch (error) {
      this.rethrowUniqueConstraint(error);
    }
  }

  async update(
    workId: number,
    relationId: number,
    userId: number,
    updateRelationDto: UpdateRelationDto,
  ): Promise<RelationResponse> {
    const existing = await this.findOwnedRelation(workId, relationId, userId);
    const parsed = this.parseFields(updateRelationDto, existing);

    await this.assertCharactersInWork(
      workId,
      parsed.characterAId,
      parsed.characterBId,
    );
    await this.assertUniquePair(
      workId,
      parsed.characterAId,
      parsed.characterBId,
      relationId,
    );

    try {
      const relation = await this.prisma.characterRelation.update({
        where: { id: relationId },
        data: parsed,
        include: relationInclude,
      });

      return this.toRelationResponse(relation);
    } catch (error) {
      this.rethrowUniqueConstraint(error);
    }
  }

  async remove(workId: number, relationId: number, userId: number) {
    const relation = await this.findOwnedRelation(workId, relationId, userId);

    return this.prisma.characterRelation.delete({
      where: { id: relation.id },
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

  private async findOwnedRelation(
    workId: number,
    relationId: number,
    userId: number,
  ) {
    await this.assertWorkOwned(workId, userId);

    const relation = await this.prisma.characterRelation.findFirst({
      where: {
        id: relationId,
        workId,
      },
      include: relationInclude,
    });

    if (!relation) {
      throw new NotFoundException('Relation not found.');
    }

    return relation;
  }

  private async assertCharactersInWork(
    workId: number,
    characterAId: number,
    characterBId: number,
  ) {
    const characters = await this.prisma.character.findMany({
      where: {
        workId,
        id: { in: [characterAId, characterBId] },
      },
      select: { id: true },
    });

    if (characters.length !== 2) {
      throw new NotFoundException('Character not found.');
    }
  }

  private async assertUniquePair(
    workId: number,
    characterAId: number,
    characterBId: number,
    excludeRelationId?: number,
  ) {
    const existing = await this.prisma.characterRelation.findFirst({
      where: {
        workId,
        characterAId,
        characterBId,
        ...(excludeRelationId != null ? { NOT: { id: excludeRelationId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('Relation already exists.');
    }
  }

  private parseFields(
    dto: CreateRelationDto | UpdateRelationDto,
    fallback?: {
      characterAId: number;
      characterBId: number;
    },
  ) {
    const characterAId = this.parsePositiveInt(
      dto.characterAId,
      'characterAId',
      fallback?.characterAId,
    );
    const characterBId = this.parsePositiveInt(
      dto.characterBId,
      'characterBId',
      fallback?.characterBId,
    );

    if (characterAId === characterBId) {
      throw new BadRequestException(
        'A character cannot have a relation with itself.',
      );
    }

    const canonical = canonicalizeRelationInput({
      characterAId,
      characterBId,
      aToBLabel: this.parseBoundedString(dto.aToBLabel, 'aToBLabel', 50).trim(),
      aToBNote: this.parseText(dto.aToBNote, 'aToBNote'),
      bToALabel: this.parseBoundedString(dto.bToALabel, 'bToALabel', 50).trim(),
      bToANote: this.parseText(dto.bToANote, 'bToANote'),
    });

    return {
      ...canonical,
      type: this.parseBoundedString(dto.type, 'type', 50).trim(),
      summary: this.parseBoundedString(dto.summary, 'summary', 300).trim(),
    };
  }

  private parsePositiveInt(
    value: number | undefined,
    fieldName: string,
    fallback?: number,
  ) {
    if (value === undefined) {
      if (fallback != null) {
        return fallback;
      }

      throw new BadRequestException(`${fieldName} is required.`);
    }

    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(
        `${fieldName} must be a positive integer.`,
      );
    }

    return value;
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

  private toRelationResponse(relation: RelationRecord): RelationResponse {
    return {
      id: relation.id,
      workId: relation.workId,
      type: relation.type ?? '',
      summary: relation.summary ?? '',
      characterA: {
        id: relation.characterA.id,
        name: relation.characterA.name,
        role: relation.characterA.role ?? '',
      },
      characterB: {
        id: relation.characterB.id,
        name: relation.characterB.name,
        role: relation.characterB.role ?? '',
      },
      aToBLabel: relation.aToBLabel ?? '',
      aToBNote: relation.aToBNote ?? '',
      bToALabel: relation.bToALabel ?? '',
      bToANote: relation.bToANote ?? '',
      createdAt: relation.createdAt,
      updatedAt: relation.updatedAt,
    };
  }

  private rethrowUniqueConstraint(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new BadRequestException('Relation already exists.');
    }

    throw error;
  }
}
