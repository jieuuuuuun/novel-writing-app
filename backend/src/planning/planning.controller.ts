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
import { UpdatePlanningDto } from './dto/update-planning.dto.js';
import { PlanningService } from './planning.service.js';

@Controller('work/:workId/planning')
@UseGuards(JwtAuthGuard)
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Get()
  findOne(
    @Param('workId', ParseIntPipe) workId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.planningService.findOne(workId, user.id);
  }

  @Patch()
  update(
    @Param('workId', ParseIntPipe) workId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() updatePlanningDto: UpdatePlanningDto,
  ) {
    return this.planningService.update(workId, user.id, updatePlanningDto);
  }
}
