import { PrismaClient, UserRole, UserStatus, TenantStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'corekit' },
    update: {},
    create: {
      name: 'CoreKit Store',
      slug: 'corekit',
      status: TenantStatus.ACTIVE,
      currencyCode: 'INR',
      defaultCountry: 'IN',
      timezone: 'Asia/Kolkata',
      settings: {
        allowGuestCheckout: false,
        requireEmailVerification: false,
      },
    },
  });
  console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`);

  // 2. Create TenantDomain
  const domain = await prisma.tenantDomain.upsert({
    where: { host: 'localhost:3000' },
    update: {},
    create: {
      tenantId: tenant.id,
      host: 'localhost:3000',
      isPrimary: true,
    },
  });
  console.log(`✅ Domain: ${domain.host}`);

  // 3. Create Admin User
  const passwordHash = await bcrypt.hash('Admin@123', 10);

  const admin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'admin@corekit.dev',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@corekit.dev',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
  console.log(`✅ Admin: ${admin.email} (password: Admin@123)`);

  console.log('\n🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
