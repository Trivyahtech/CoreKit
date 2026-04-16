import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get<string>('redis.host'),
      port: this.configService.get<number>('redis.port'),
      password: this.configService.get<string>('redis.password'),
      maxRetriesPerRequest: null,
      retryStrategy: (times) => {
        if (times > 3) {
          this.logger.warn(
            'Redis unavailable after 3 retries — running without Redis',
          );
          return null; // Stop retrying
        }
        return Math.min(times * 500, 2000);
      },
      lazyConnect: true,
    });

    this.client.on('error', (err) => {
      this.logger.warn(`Redis connection error: ${err.message}`);
    });

    this.client.connect().catch(() => {
      this.logger.warn('Redis not available — features requiring Redis will be unavailable');
    });
  }

  getClient() {
    return this.client;
  }

  async onModuleDestroy() {
    if (this.client.status === 'ready') {
      await this.client.quit();
    }
  }
}
