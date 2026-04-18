import { Module } from '@nestjs/common';
import { EmailService } from './email.service.js';
import { EmailProcessor } from './email.processor.js';

@Module({
  providers: [EmailService, EmailProcessor],
  exports: [EmailService],
})
export class MailModule {}
