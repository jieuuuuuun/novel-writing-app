import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WorkService } from './work.service.js';
import { CreateWorkDto } from './dto/create-work.dto/create-work.dto.js';
import { UpdateWorkDto } from './dto/update-work.dto/update-work.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';

@Controller('work')
@UseGuards(JwtAuthGuard)
export class WorkController {
  constructor(private readonly workService: WorkService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createWorkDto: CreateWorkDto,
  ) {
    return this.workService.create(user.id, createWorkDto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.workService.findAll(user.id);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateWorkDto: UpdateWorkDto,
  ) {
    return this.workService.update(id, user.id, updateWorkDto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workService.remove(id, user.id);
  }
}
