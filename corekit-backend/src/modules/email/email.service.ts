import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);
  private isReady = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const host = this.config.get<string>('mail.host');

    if (!host) {
      // Auto-create Ethereal test account for development
      this.logger.log('No SMTP configured — creating Ethereal test account...');
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      this.logger.log(`📧 Ethereal test email: ${testAccount.user}`);
      this.logger.log(`📧 View sent mails at: https://ethereal.email/login`);
    } else {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('mail.port'),
        secure: this.config.get<boolean>('mail.secure'),
        auth: {
          user: this.config.get<string>('mail.user'),
          pass: this.config.get<string>('mail.pass'),
        },
      });
    }

    this.isReady = true;
  }

  async send(payload: EmailPayload): Promise<{ messageId: string; previewUrl?: string | false }> {
    if (!this.isReady) {
      this.logger.warn('Email transport not ready, skipping...');
      return { messageId: 'skipped' };
    }

    const from = this.config.get<string>('mail.from') || '"CoreKit" <noreply@corekit.dev>';

    const info = await this.transporter.sendMail({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      this.logger.log(`📧 Preview: ${previewUrl}`);
    }

    this.logger.log(`📧 Sent "${payload.subject}" to ${payload.to} [${info.messageId}]`);

    return { messageId: info.messageId, previewUrl };
  }
}
