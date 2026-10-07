import { Module } from '@nestjs/common';
import { EpisodeService } from './episode.service.js';
import { EpisodeController } from './episode.controller.js';

@Module({
  providers: [EpisodeService],
  controllers: [EpisodeController]
})
export class EpisodeModule {}
