import { Module } from '@nestjs/common';
import { WorkService } from './work.service.js';
import { WorkController } from './work.controller.js';

@Module({
  providers: [WorkService],
  controllers: [WorkController]
})
export class WorkModule {}
