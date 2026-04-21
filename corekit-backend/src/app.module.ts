import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

// --- Platform Infrastructure ---
import { PlatformModule } from './platform/platform.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { PermissionsGuard } from './common/guards/permissions.guard.js';
import { HttpExceptionFilter, TransformInterceptor, LoggingInterceptor } from './common/index.js';

// --- Core Modules ---
import { AuthModule } from './modules/core/auth/auth.module.js';
import { UsersModule } from './modules/core/users/users.module.js';
import { TenantsModule } from './modules/core/tenants/tenants.module.js';

// --- Base Modules ---
import { ProductsModule } from './modules/base/catalog/products/products.module.js';
import { CategoriesModule } from './modules/base/catalog/categories/categories.module.js';
import { CartModule } from './modules/base/cart/cart.module.js';
import { AddressesModule } from './modules/base/addresses/addresses.module.js';
import { OrdersModule } from './modules/base/orders/orders.module.js';
import { PaymentsModule } from './modules/base/payments/payments.module.js';
import { ShippingModule } from './modules/base/shipping/shipping.module.js';
import { ReviewsModule } from './modules/base/reviews/reviews.module.js';
import { CouponsModule } from './modules/base/coupons/coupons.module.js';
import { InventoryModule } from './modules/base/inventory/inventory.module.js';
import { PurchaseOrdersModule } from './modules/base/purchase-orders/purchase-orders.module.js';
import { CustomersModule } from './modules/core/customers/customers.module.js';
import { AdminDataModule } from './modules/core/admin/admin.module.js';

@Module({
  imports: [
    // Platform infrastructure (config, database, cache, queue, throttler, mail, health)
    PlatformModule,

    // Core modules
    TenantsModule,
    AuthModule,
    UsersModule,
    CustomersModule,

    // Base modules — InventoryModule first so its @Global provider resolves elsewhere
    InventoryModule,
    ProductsModule,
    CategoriesModule,
    CartModule,
    AddressesModule,
    OrdersModule,
    PaymentsModule,
    ShippingModule,
    ReviewsModule,
    CouponsModule,
    PurchaseOrdersModule,
    AdminDataModule,
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
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
