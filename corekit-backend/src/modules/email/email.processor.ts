import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailService } from './email.service.js';
import {
  orderConfirmationTemplate,
  orderStatusUpdateTemplate,
  OrderEmailData,
} from './templates/order.templates.js';

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

export type EmailJob = OrderConfirmationJob | OrderStatusJob;

@Processor('emails')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<EmailJob>): Promise<any> {
    this.logger.log(`Processing email job ${job.id}: ${job.data.type}`);

    try {
      switch (job.data.type) {
        case 'order-confirmation': {
          const { to, data } = job.data;
          const html = orderConfirmationTemplate(data);
          return this.emailService.send({
            to,
            subject: `Order Confirmed — ${data.orderNumber}`,
            html,
            text: `Hi ${data.customerName}, your order ${data.orderNumber} has been confirmed. Total: ${data.grandTotal}`,
          });
        }

        case 'order-status-update': {
          const { to, customerName, orderNumber, newStatus, note } = job.data;
          const html = orderStatusUpdateTemplate(customerName, orderNumber, newStatus, note);
          return this.emailService.send({
            to,
            subject: `Order ${orderNumber} — ${newStatus}`,
            html,
            text: `Hi ${customerName}, your order ${orderNumber} status is now: ${newStatus}`,
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
