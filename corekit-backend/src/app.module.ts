import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import configuration from './config/configuration.js';
import { validateEnv } from './config/env.validation.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RedisModule } from './redis/redis.module.js';
import { QueueModule } from './queue/queue.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ProductsModule } from './modules/products/products.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { CartModule } from './modules/cart/cart.module.js';
import { AddressesModule } from './modules/addresses/addresses.module.js';
import { OrdersModule } from './modules/orders/orders.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { ShippingModule } from './modules/shipping/shipping.module.js';
import { EmailModule } from './modules/email/email.module.js';

import { UsersModule } from './modules/users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 60 }],
    }),
    PrismaModule,
    RedisModule,
    QueueModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    CartModule,
    AddressesModule,
    OrdersModule,
    PaymentsModule,
    ShippingModule,
    EmailModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
