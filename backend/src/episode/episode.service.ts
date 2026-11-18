import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEpisodeDto } from './dto/create-episode.dto/create-episode.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateEpisodeDto } from './dto/update-episode.dto/update-episode.dto.js';

const TITLE_MAX_LENGTH = 200;

@Injectable()
export class EpisodeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, createEpisodeDto: CreateEpisodeDto) {
    const workId = this.parseWorkId(createEpisodeDto.workId);
    const title = this.parseRequiredTitle(createEpisodeDto.title);
    const content = this.parseContent(createEpisodeDto.content);
    const sortOrder = this.parseSortOrder(createEpisodeDto.sortOrder);

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

    return this.prisma.episode.create({
      data: {
        workId,
        title,
        content,
        sortOrder,
      },
    });
  }

  findAll(userId: number) {
    return this.prisma.episode.findMany({
      where: {
        work: { userId },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number, userId: number) {
    const episode = await this.prisma.episode.findFirst({
      where: {
        id,
        work: { userId },
      },
    });

    if (!episode) {
      throw new NotFoundException('Episode not found.');
    }

    return episode;
  }

  async update(
    id: number,
    userId: number,
    updateEpisodeDto: UpdateEpisodeDto,
  ) {
    await this.findOne(id, userId);

    return this.prisma.episode.update({
      where: { id },
      data: this.parseUpdate(updateEpisodeDto),
    });
  }

  async remove(id: number, userId: number) {
    await this.findOne(id, userId);

    return this.prisma.episode.delete({
      where: { id },
    });
  }

  private parseUpdate(dto: UpdateEpisodeDto) {
    const data: {
      title?: string;
      content?: string;
      sortOrder?: number;
    } = {};

    if (dto.title !== undefined) {
      data.title = this.parseRequiredTitle(dto.title);
    }

    if (dto.content !== undefined) {
      data.content = this.parseContent(dto.content);
    }

    if (dto.sortOrder !== undefined) {
      data.sortOrder = this.parseSortOrder(dto.sortOrder);
    }

    return data;
  }

  private parseWorkId(value: number) {
    if (!Number.isInteger(value) || value < 1) {
      throw new BadRequestException(
        'workId must be an integer of 1 or more.',
      );
    }

    return value;
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

  private parseContent(value: string | undefined) {
    if (typeof value !== 'string') {
      throw new BadRequestException('content must be a string.');
    }

    return value;
  }

  private parseSortOrder(value: number) {
    if (!Number.isInteger(value) || value < 0) {
      throw new BadRequestException(
        'sortOrder must be an integer of 0 or more.',
      );
    }

    return value;
  }

  private parseBoundedString(
    value: string | undefined,
    fieldName: string,
    maxLength: number,
  ) {
    if (value == null) {
      return '';
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} must be a string.`);
    }

    if (value.length > maxLength) {
      throw new BadRequestException(
        `${fieldName} must be at most ${maxLength} characters.`,
      );
    }

    return value;
  }
}
