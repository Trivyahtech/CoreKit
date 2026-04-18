import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { appConfig, databaseConfig, authConfig, redisConfig, mailConfig, validateEnv } from './config/index.js';
import { PrismaModule } from './database/index.js';
import { CacheModule } from './cache/index.js';
import { QueueModule } from './queue/index.js';
import { MailModule } from './mail/mail.module.js';
import { HealthModule } from './health/health.module.js';
import { StorageModule } from './storage/index.js';
import { SearchModule } from './search/index.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig, databaseConfig, authConfig, redisConfig, mailConfig],
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 60 }],
    }),
    PrismaModule,
    CacheModule,
    QueueModule,
    MailModule,
    HealthModule,
    StorageModule,
    SearchModule,
  ],
  exports: [PrismaModule, CacheModule, QueueModule, MailModule, StorageModule, SearchModule],
})
export class PlatformModule {}
