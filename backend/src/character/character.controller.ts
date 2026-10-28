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
import { CharacterService } from './character.service.js';
import { CreateCharacterDto } from './dto/create-character.dto.js';
import { UpdateCharacterDto } from './dto/update-character.dto.js';

@Controller('work/:workId/characters')
@UseGuards(JwtAuthGuard)
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}

  @Get()
  findAll(
    @Param('workId', ParseIntPipe) workId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.characterService.findAll(workId, user.id);
  }

  @Post()
  create(
    @Param('workId', ParseIntPipe) workId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() createCharacterDto: CreateCharacterDto,
  ) {
    return this.characterService.create(workId, user.id, createCharacterDto);
  }

  @Get(':characterId')
  findOne(
    @Param('workId', ParseIntPipe) workId: number,
    @Param('characterId', ParseIntPipe) characterId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.characterService.findOne(workId, characterId, user.id);
  }

  @Patch(':characterId')
  update(
    @Param('workId', ParseIntPipe) workId: number,
    @Param('characterId', ParseIntPipe) characterId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateCharacterDto: UpdateCharacterDto,
  ) {
    return this.characterService.update(
      workId,
      characterId,
      user.id,
      updateCharacterDto,
    );
  }

  @Delete(':characterId')
  remove(
    @Param('workId', ParseIntPipe) workId: number,
    @Param('characterId', ParseIntPipe) characterId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.characterService.remove(workId, characterId, user.id);
  }
}
