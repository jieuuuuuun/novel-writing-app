import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateWorkDto } from './dto/create-work.dto/create-work.dto.js';
import { UpdateWorkDto } from './dto/update-work.dto/update-work.dto.js';

const TITLE_MAX_LENGTH = 200;
const SUBTITLE_MAX_LENGTH = 500;

@Injectable()
export class WorkService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, createWorkDto: CreateWorkDto) {
    const title = this.parseRequiredTitle(createWorkDto.title);
    const subtitle = this.parseOptionalSubtitle(createWorkDto.subtitle);

    return this.prisma.work.create({
      data: {
        title,
        ...(subtitle !== undefined ? { subtitle } : {}),
        userId,
      },
    });
  }

  findAll(userId: number) {
    return this.prisma.work.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number, userId: number) {
    const work = await this.prisma.work.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!work) {
      throw new NotFoundException('Work not found.');
    }

    return work;
  }

  async update(
    id: number,
    userId: number,
    updateWorkDto: UpdateWorkDto,
  ) {
    await this.findOne(id, userId);

    return this.prisma.work.update({
      where: { id },
      data: this.parseUpdate(updateWorkDto),
    });
  }

  async remove(id: number, userId: number) {
    await this.findOne(id, userId);

    return this.prisma.$transaction(async (tx) => {
      await tx.work.update({
        where: { id },
        data: { currentSynopsisVersionId: null },
      });

      return tx.work.delete({
        where: { id },
      });
    });
  }

  private parseUpdate(dto: UpdateWorkDto) {
    const data: { title?: string; subtitle?: string | null } = {};

    if (dto.title !== undefined) {
      data.title = this.parseRequiredTitle(dto.title);
    }

    if (dto.subtitle !== undefined) {
      data.subtitle = this.parseOptionalSubtitle(dto.subtitle) ?? null;
    }

    return data;
  }

  private parseRequiredTitle(value: string | undefined) {
    const title = this.parseBoundedString(
      value,
      'title',
      TITLE_MAX_LENGTH,
    ).trim();

    if (!title) {
      throw new BadRequestException('title is required.');
    }

    return title;
  }

  private parseOptionalSubtitle(value: string | undefined) {
    if (value === undefined) {
      return undefined;
    }

    const subtitle = this.parseBoundedString(
      value,
      'subtitle',
      SUBTITLE_MAX_LENGTH,
    ).trim();

    return subtitle.length === 0 ? null : subtitle;
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
