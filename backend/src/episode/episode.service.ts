import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEpisodeDto } from './dto/create-episode.dto/create-episode.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateEpisodeDto } from './dto/update-episode.dto/update-episode.dto.js';

@Injectable()
export class EpisodeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, createEpisodeDto: CreateEpisodeDto) {
    const work = await this.prisma.work.findFirst({
      where: {
        id: createEpisodeDto.workId,
        userId,
      },
      select: { id: true },
    });

    if (!work) {
      throw new NotFoundException('Work not found.');
    }

    return this.prisma.episode.create({
      data: {
        workId: createEpisodeDto.workId,
        title: createEpisodeDto.title,
        content: createEpisodeDto.content,
        sortOrder: createEpisodeDto.sortOrder,
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
      data: {
        title: updateEpisodeDto.title,
        content: updateEpisodeDto.content,
        sortOrder: updateEpisodeDto.sortOrder,
      },
    });
  }

  async remove(id: number, userId: number) {
    await this.findOne(id, userId);

    return this.prisma.episode.delete({
      where: { id },
    });
  }
}
