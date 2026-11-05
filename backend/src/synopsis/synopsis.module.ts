import { Module } from '@nestjs/common';
import { SynopsisController } from './synopsis.controller.js';
import { SynopsisService } from './synopsis.service.js';

@Module({
  controllers: [SynopsisController],
  providers: [SynopsisService],
})
export class SynopsisModule {}
