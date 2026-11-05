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
import { CreateSynopsisDto } from './dto/create-synopsis.dto.js';
import { UpdateSynopsisDto } from './dto/update-synopsis.dto.js';
import { SynopsisService } from './synopsis.service.js';

@Controller('work/:workId/synopses')
@UseGuards(JwtAuthGuard)
export class SynopsisController {
  constructor(private readonly synopsisService: SynopsisService) {}

  @Get()
  findAll(
    @Param('workId', ParseIntPipe) workId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.synopsisService.findAll(workId, user.id);
  }

  @Post()
  create(
    @Param('workId', ParseIntPipe) workId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() createSynopsisDto: CreateSynopsisDto,
  ) {
    return this.synopsisService.create(workId, user.id, createSynopsisDto);
  }

  @Get('current')
  findCurrent(
    @Param('workId', ParseIntPipe) workId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.synopsisService.findCurrent(workId, user.id);
  }

  @Get(':synopsisId')
  findOne(
    @Param('workId', ParseIntPipe) workId: number,
    @Param('synopsisId', ParseIntPipe) synopsisId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.synopsisService.findOne(workId, synopsisId, user.id);
  }

  @Patch(':synopsisId')
  update(
    @Param('workId', ParseIntPipe) workId: number,
    @Param('synopsisId', ParseIntPipe) synopsisId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateSynopsisDto: UpdateSynopsisDto,
  ) {
    return this.synopsisService.update(
      workId,
      synopsisId,
      user.id,
      updateSynopsisDto,
    );
  }

  @Delete(':synopsisId')
  remove(
    @Param('workId', ParseIntPipe) workId: number,
    @Param('synopsisId', ParseIntPipe) synopsisId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.synopsisService.remove(workId, synopsisId, user.id);
  }

  @Post(':synopsisId/duplicate')
  duplicate(
    @Param('workId', ParseIntPipe) workId: number,
    @Param('synopsisId', ParseIntPipe) synopsisId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() createSynopsisDto: CreateSynopsisDto,
  ) {
    return this.synopsisService.duplicate(
      workId,
      synopsisId,
      user.id,
      createSynopsisDto,
    );
  }

  @Post(':synopsisId/current')
  setCurrent(
    @Param('workId', ParseIntPipe) workId: number,
    @Param('synopsisId', ParseIntPipe) synopsisId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.synopsisService.setCurrent(workId, synopsisId, user.id);
  }
}
