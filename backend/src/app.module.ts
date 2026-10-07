import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { WorkModule } from './work/work.module.js';
import { EpisodeModule } from './episode/episode.module.js';

@Module({
  imports: [PrismaModule, WorkModule, EpisodeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
