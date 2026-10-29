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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { CreateRelationDto } from './dto/create-relation.dto.js';
import { UpdateRelationDto } from './dto/update-relation.dto.js';
import { RelationService } from './relation.service.js';

@Controller('work/:workId/relations')
@UseGuards(JwtAuthGuard)
export class RelationController {
  constructor(private readonly relationService: RelationService) {}

  @Get()
  findAll(
    @Param('workId', ParseIntPipe) workId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.relationService.findAll(workId, user.id);
  }

  @Post()
  create(
    @Param('workId', ParseIntPipe) workId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() createRelationDto: CreateRelationDto,
  ) {
    return this.relationService.create(workId, user.id, createRelationDto);
  }

  @Get(':relationId')
  findOne(
    @Param('workId', ParseIntPipe) workId: number,
    @Param('relationId', ParseIntPipe) relationId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.relationService.findOne(workId, relationId, user.id);
  }

  @Patch(':relationId')
  update(
    @Param('workId', ParseIntPipe) workId: number,
    @Param('relationId', ParseIntPipe) relationId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateRelationDto: UpdateRelationDto,
  ) {
    return this.relationService.update(
      workId,
      relationId,
      user.id,
      updateRelationDto,
    );
  }

  @Delete(':relationId')
  remove(
    @Param('workId', ParseIntPipe) workId: number,
    @Param('relationId', ParseIntPipe) relationId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.relationService.remove(workId, relationId, user.id);
  }
}
