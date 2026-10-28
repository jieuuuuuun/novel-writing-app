import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateCharacterDto } from './dto/create-character.dto.js';
import type { UpdateCharacterDto } from './dto/update-character.dto.js';
import type { CharacterResponse } from './character.types.js';

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

@Injectable()
export class CharacterService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    workId: number,
    userId: number,
  ): Promise<CharacterResponse[]> {
    await this.assertWorkOwned(workId, userId);

    const characters = await this.prisma.character.findMany({
      where: { workId },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });

    return characters.map((character) => this.toCharacterResponse(character));
  }

  async findOne(
    workId: number,
    characterId: number,
    userId: number,
  ): Promise<CharacterResponse> {
    const character = await this.findOwnedCharacter(
      workId,
      characterId,
      userId,
    );
    return this.toCharacterResponse(character);
  }

  async create(
    workId: number,
    userId: number,
    createCharacterDto: CreateCharacterDto,
  ): Promise<CharacterResponse> {
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

    return this.toCharacterResponse(character);
  }

  async update(
    workId: number,
    characterId: number,
    userId: number,
    updateCharacterDto: UpdateCharacterDto,
  ): Promise<CharacterResponse> {
    await this.findOwnedCharacter(workId, characterId, userId);
    const parsed = this.parseFields(updateCharacterDto);

    const character = await this.prisma.character.update({
      where: { id: characterId },
      data: parsed,
    });

    return this.toCharacterResponse(character);
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
  ) {
    await this.assertWorkOwned(workId, userId);

    const character = await this.prisma.character.findFirst({
      where: {
        id: characterId,
        workId,
      },
    });

    if (!character) {
      throw new NotFoundException('Character not found.');
    }

    return character;
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

  private toCharacterResponse(character: {
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
  }): CharacterResponse {
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
