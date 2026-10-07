import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateWorkDto } from './dto/create-work.dto/create-work.dto.js';
import { UpdateWorkDto } from './dto/update-work.dto/update-work.dto.js';

@Injectable()
export class WorkService {
  constructor(private readonly prisma: PrismaService) {}

  create(createWorkDto: CreateWorkDto) {
    return this.prisma.work.create({
      data: createWorkDto,
    });
  }

  findAll() {
    return this.prisma.work.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(id: number) {
    return this.prisma.work.findUnique({
      where: { id },
    });
  }

  update(id: number, updateWorkDto: UpdateWorkDto) {
    return this.prisma.work.update({
      where: { id },
      data: { ...updateWorkDto },
    });
  }

  remove(id:number) {
    return this.prisma.work.delete({
      where:{id}
    })
  }
}
