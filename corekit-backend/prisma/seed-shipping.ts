import { PrismaClient, ShippingMethod, ShippingZoneType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// A reasonable "metros + state capitals" list for demo.
// Any pincode outside this list will fall back to the catch-all zone.
const METRO_PINCODES = [
  // Mumbai
  '400001','400002','400003','400020','400050','400070','400080',
  // Delhi
  '110001','110002','110003','110016','110017','110019','110024','110030',
  // Bengaluru
  '560001','560002','560008','560034','560068','560076',
  // Chennai
  '600001','600002','600004','600020','600028','600042',
  // Kolkata
  '700001','700002','700012','700019','700032',
  // Hyderabad
  '500001','500032','500034','500081',
  // Ahmedabad
  '380001','380009','380015',
  // Pune
  '411001','411004','411038',
  // Jaipur
  '302001','302004',
  // Lucknow
  '226001','226010',
  // Chandigarh
  '160001','160017',
  // Bhopal
  '462001','462016',
];

// Pan-India catch-all: any pincode 3-digit prefixes we want to cover.
// We'll store the exact metro list plus common prefixes expanded below.
// To keep the demo simple, we add a second zone "Rest of India" with a
// fallback pincode list so most Indian pincodes at least match *something*.
const REST_OF_INDIA_PREFIXES = Array.from({ length: 900 }, (_, i) => {
  // generate one sample pincode per 3-digit prefix from 100-999 that ends in 001
  const p = (100 + i).toString().padStart(3, '0');
  return `${p}001`;
});

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: 'corekit' } });
  if (!tenant) throw new Error('Tenant not found — run seed-ncc first.');

  // Metro Zone
  let metro = await prisma.shippingZone.findFirst({
    where: { tenantId: tenant.id, name: 'Metro Cities' },
  });
  const metroPayload = {
    tenantId: tenant.id,
    name: 'Metro Cities',
    type: ShippingZoneType.PINCODE,
    pincodes: METRO_PINCODES,
    isActive: true,
  };
  metro = metro
    ? await prisma.shippingZone.update({ where: { id: metro.id }, data: metroPayload })
    : await prisma.shippingZone.create({ data: metroPayload });

  // Rest of India
  let rest = await prisma.shippingZone.findFirst({
    where: { tenantId: tenant.id, name: 'Rest of India' },
  });
  const restPayload = {
    tenantId: tenant.id,
    name: 'Rest of India',
    type: ShippingZoneType.PINCODE,
    pincodes: REST_OF_INDIA_PREFIXES,
    isActive: true,
  };
  rest = rest
    ? await prisma.shippingZone.update({ where: { id: rest.id }, data: restPayload })
    : await prisma.shippingZone.create({ data: restPayload });

  // Rules — idempotent by (zoneId, name)
  const rules = [
    { zoneId: metro.id, name: 'Standard (3-5 days)', method: ShippingMethod.STANDARD, flatRate: 49, isCodAllowed: true,  minOrderValue: null,  order: 1 },
    { zoneId: metro.id, name: 'Express (1-2 days)',  method: ShippingMethod.EXPRESS,  flatRate: 149, isCodAllowed: false, minOrderValue: null, order: 2 },
    { zoneId: metro.id, name: 'Free shipping',       method: ShippingMethod.STANDARD, flatRate: 0,   isCodAllowed: true,  minOrderValue: 999,   order: 0 },
    { zoneId: rest.id,  name: 'Standard (5-7 days)', method: ShippingMethod.STANDARD, flatRate: 79,  isCodAllowed: true,  minOrderValue: null, order: 1 },
    { zoneId: rest.id,  name: 'Free shipping',       method: ShippingMethod.STANDARD, flatRate: 0,   isCodAllowed: true,  minOrderValue: 1499,  order: 0 },
  ];

  for (const r of rules) {
    const existing = await prisma.shippingRule.findFirst({
      where: { zoneId: r.zoneId, name: r.name },
    });
    const data = {
      zoneId: r.zoneId,
      name: r.name,
      method: r.method,
      flatRate: r.flatRate,
      ratePerKg: 0,
      minOrderValue: r.minOrderValue ?? null,
      isCodAllowed: r.isCodAllowed,
      isActive: true,
    };
    if (existing) {
      await prisma.shippingRule.update({ where: { id: existing.id }, data });
    } else {
      await prisma.shippingRule.create({ data });
    }
  }

  console.log(`✅ Shipping zones: 2 (${METRO_PINCODES.length} metro pincodes + ${REST_OF_INDIA_PREFIXES.length} fallback)`);
  console.log(`✅ Rules: ${rules.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Shipping seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
