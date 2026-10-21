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
import { EpisodeService } from './episode.service.js';
import { CreateEpisodeDto } from './dto/create-episode.dto/create-episode.dto.js';
import { UpdateEpisodeDto } from './dto/update-episode.dto/update-episode.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';

@Controller('episode')
@UseGuards(JwtAuthGuard)
export class EpisodeController {
  constructor(private readonly episodeService: EpisodeService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createEpisodeDto: CreateEpisodeDto,
  ) {
    return this.episodeService.create(user.id, createEpisodeDto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.episodeService.findAll(user.id);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.episodeService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateEpisodeDto: UpdateEpisodeDto,
  ) {
    return this.episodeService.update(id, user.id, updateEpisodeDto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.episodeService.remove(id, user.id);
  }
}
