import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { WorkModule } from './work/work.module.js';
import { EpisodeModule } from './episode/episode.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [PrismaModule, WorkModule, EpisodeModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
