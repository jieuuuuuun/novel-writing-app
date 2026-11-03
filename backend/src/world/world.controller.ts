import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { UpdateWorldDto } from './dto/update-world.dto.js';
import { WorldService } from './world.service.js';

@Controller('work/:workId/world')
@UseGuards(JwtAuthGuard)
export class WorldController {
  constructor(private readonly worldService: WorldService) {}

  @Get()
  findOne(
    @Param('workId', ParseIntPipe) workId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.worldService.findOne(workId, user.id);
  }

  @Patch()
  update(
    @Param('workId', ParseIntPipe) workId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateWorldDto: UpdateWorldDto,
  ) {
    return this.worldService.update(workId, user.id, updateWorldDto);
  }
}
