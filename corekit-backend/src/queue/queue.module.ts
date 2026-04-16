import { Global, Module, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

const logger = new Logger('QueueModule');

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
          password: config.get<string>('redis.password'),
          maxRetriesPerRequest: null,
          retryStrategy: (times: number) => {
            if (times > 3) {
              logger.warn('BullMQ: Redis unavailable — queues will not process jobs');
              return null;
            }
            return Math.min(times * 500, 2000);
          },
        },
      }),
    }),
    BullModule.registerQueue(
      { name: 'emails' },
      { name: 'notifications' },
      { name: 'orders' },
      { name: 'payments' },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
