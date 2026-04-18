import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

// --- Platform Infrastructure ---
import { PlatformModule } from './platform/platform.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { HttpExceptionFilter, TransformInterceptor, LoggingInterceptor } from './common/index.js';

// --- Core Modules ---
import { AuthModule } from './modules/core/auth/auth.module.js';
import { UsersModule } from './modules/core/users/users.module.js';

// --- Base Modules ---
import { ProductsModule } from './modules/base/catalog/products/products.module.js';
import { CategoriesModule } from './modules/base/catalog/categories/categories.module.js';
import { CartModule } from './modules/base/cart/cart.module.js';
import { AddressesModule } from './modules/base/addresses/addresses.module.js';
import { OrdersModule } from './modules/base/orders/orders.module.js';
import { PaymentsModule } from './modules/base/payments/payments.module.js';
import { ShippingModule } from './modules/base/shipping/shipping.module.js';

@Module({
  imports: [
    // Platform infrastructure (config, database, cache, queue, throttler, mail, health)
    PlatformModule,

    // Core modules
    AuthModule,
    UsersModule,

    // Base modules
    ProductsModule,
    CategoriesModule,
    CartModule,
    AddressesModule,
    OrdersModule,
    PaymentsModule,
    ShippingModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
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
