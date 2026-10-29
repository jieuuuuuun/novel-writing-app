import { Module } from '@nestjs/common';
import { RelationController } from './relation.controller.js';
import { RelationService } from './relation.service.js';

@Module({
  controllers: [RelationController],
  providers: [RelationService],
})
export class RelationModule {}
