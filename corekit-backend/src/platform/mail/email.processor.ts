import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger, Optional } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailService } from './email.service.js';
import {
  MAIL_TEMPLATE_KEYS,
  type MailTemplateKey,
  getTenantOverride,
  renderTemplate,
} from './template-renderer.js';
import { PrismaService } from '../database/prisma.service.js';
import {
  orderConfirmationTemplate,
  orderStatusUpdateTemplate,
  OrderEmailData,
} from './templates/order.templates.js';
import {
  emailVerificationTemplate,
  otpTemplate,
  passwordResetTemplate,
} from './templates/auth.templates.js';

export interface OrderConfirmationJob {
  type: 'order-confirmation';
  to: string;
  data: OrderEmailData;
}

export interface OrderStatusJob {
  type: 'order-status-update';
  to: string;
  customerName: string;
  orderNumber: string;
  newStatus: string;
  note?: string;
}

export interface OtpJob {
  type: 'otp';
  to: string;
  code: string;
  ttlMinutes?: number;
}

export interface PasswordResetJob {
  type: 'password-reset';
  to: string;
  resetUrl: string;
  ttlMinutes?: number;
}

export interface EmailVerificationJob {
  type: 'email-verification';
  to: string;
  verifyUrl: string;
  ttlMinutes?: number;
}

export type EmailJob =
  | OrderConfirmationJob
  | OrderStatusJob
  | OtpJob
  | PasswordResetJob
  | EmailVerificationJob;

@Processor('emails')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private readonly emailService: EmailService,
    @Optional() private readonly prisma?: PrismaService,
  ) {
    super();
  }

  private async resolveOverride(
    to: string,
    key: MailTemplateKey,
  ): Promise<{ subject?: string; html?: string } | null> {
    if (!this.prisma) return null;
    try {
      // Find the recipient user to identify tenant. Fall back to any
      // tenant with a matching-email user.
      const user = await this.prisma.user.findFirst({
        where: { email: to.toLowerCase() },
        select: { tenantId: true },
      });
      if (!user) return null;
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: user.tenantId },
        select: { settings: true },
      });
      return getTenantOverride(
        tenant?.settings as Record<string, unknown> | null,
        key,
      );
    } catch {
      return null;
    }
  }

  async process(job: Job<EmailJob>): Promise<any> {
    this.logger.log(`Processing email job ${job.id}: ${job.data.type}`);

    try {
      switch (job.data.type) {
        case 'order-confirmation': {
          const { to, data } = job.data;
          const override = await this.resolveOverride(to, 'orderConfirmation');
          const defaultHtml = orderConfirmationTemplate(data);
          const vars = {
            customerName: data.customerName,
            orderNumber: data.orderNumber,
            grandTotal: data.grandTotal,
            currency: data.currency,
          };
          return this.emailService.send({
            to,
            subject:
              override?.subject
                ? renderTemplate(override.subject, vars)
                : `Order Confirmed — ${data.orderNumber}`,
            html: override?.html ? renderTemplate(override.html, vars) : defaultHtml,
            text: `Hi ${data.customerName}, your order ${data.orderNumber} has been confirmed. Total: ${data.grandTotal}`,
          });
        }

        case 'order-status-update': {
          const { to, customerName, orderNumber, newStatus, note } = job.data;
          const override = await this.resolveOverride(to, 'orderStatusUpdate');
          const defaultHtml = orderStatusUpdateTemplate(customerName, orderNumber, newStatus, note);
          const vars = {
            customerName,
            orderNumber,
            newStatus,
            note: note ?? '',
          };
          return this.emailService.send({
            to,
            subject:
              override?.subject
                ? renderTemplate(override.subject, vars)
                : `Order ${orderNumber} — ${newStatus}`,
            html: override?.html ? renderTemplate(override.html, vars) : defaultHtml,
            text: `Hi ${customerName}, your order ${orderNumber} status is now: ${newStatus}`,
          });
        }

        case 'otp': {
          const { to, code, ttlMinutes = 5 } = job.data;
          const override = await this.resolveOverride(to, 'otp');
          const defaultHtml = otpTemplate(code, ttlMinutes);
          const vars = { code, ttlMinutes: String(ttlMinutes) };
          return this.emailService.send({
            to,
            subject:
              override?.subject
                ? renderTemplate(override.subject, vars)
                : 'Your verification code',
            html: override?.html ? renderTemplate(override.html, vars) : defaultHtml,
            text: `Your verification code is ${code}. It expires in ${ttlMinutes} minutes.`,
          });
        }

        case 'password-reset': {
          const { to, resetUrl, ttlMinutes = 30 } = job.data;
          const override = await this.resolveOverride(to, 'passwordReset');
          const defaultHtml = passwordResetTemplate(resetUrl, ttlMinutes);
          const vars = { resetUrl, ttlMinutes: String(ttlMinutes) };
          return this.emailService.send({
            to,
            subject:
              override?.subject
                ? renderTemplate(override.subject, vars)
                : 'Reset your password',
            html: override?.html ? renderTemplate(override.html, vars) : defaultHtml,
            text: `Reset your password: ${resetUrl} (expires in ${ttlMinutes} minutes)`,
          });
        }

        case 'email-verification': {
          const { to, verifyUrl, ttlMinutes = 1440 } = job.data;
          const override = await this.resolveOverride(to, 'emailVerification');
          const defaultHtml = emailVerificationTemplate(verifyUrl, ttlMinutes);
          const vars = { verifyUrl, ttlMinutes: String(ttlMinutes) };
          return this.emailService.send({
            to,
            subject:
              override?.subject
                ? renderTemplate(override.subject, vars)
                : 'Verify your email',
            html: override?.html ? renderTemplate(override.html, vars) : defaultHtml,
            text: `Verify your email: ${verifyUrl}`,
          });
        }

        default:
          this.logger.warn(`Unknown email job type: ${(job.data as any).type}`);
      }
    } catch (err) {
      this.logger.error(`Failed to process email job ${job.id}:`, err);
      throw err; // BullMQ will retry
    }
  }
}
