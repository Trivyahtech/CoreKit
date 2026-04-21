import { Module } from '@nestjs/common';
import { AdminDataController } from './admin.controller.js';
import { AdminDataService } from './data.service.js';

@Module({
  controllers: [AdminDataController],
  providers: [AdminDataService],
})
export class AdminDataModule {}
