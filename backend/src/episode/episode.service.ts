import { Injectable } from '@nestjs/common';
import { CreateEpisodeDto } from './dto/create-episode.dto/create-episode.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateEpisodeDto } from './dto/update-episode.dto/update-episode.dto.js';

@Injectable()
export class EpisodeService {
  constructor(private readonly prisma: PrismaService) {}

  create(createEpisodeDto: CreateEpisodeDto) {
    return this.prisma.episode.create({
      data: createEpisodeDto,
    });
  }

  findAll() {
    return this.prisma.episode.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(id: number) {
    return this.prisma.episode.findUnique({
      where: { id },
    });
  }

  update(id: number, updateEpisodeDto: UpdateEpisodeDto) {
    return this.prisma.episode.update({
      where: { id },
      data: {
        ...updateEpisodeDto,
      },
    });
  }

  remove(id: number) {
    return this.prisma.episode.delete({
      where: { id },
    });
  }
}
