import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateWorkDto } from './dto/create-work.dto/create-work.dto.js';
import { UpdateWorkDto } from './dto/update-work.dto/update-work.dto.js';

@Injectable()
export class WorkService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: number, createWorkDto: CreateWorkDto) {
    return this.prisma.work.create({
      data: {
        title: createWorkDto.title,
        subtitle: createWorkDto.subtitle,
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
      data: {
        title: updateWorkDto.title,
        subtitle: updateWorkDto.subtitle,
      },
    });
  }

  async remove(id: number, userId: number) {
    await this.findOne(id, userId);

    return this.prisma.work.delete({
      where: { id },
    });
  }
}
