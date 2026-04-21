import {
  PrismaClient,
  ProductStatus,
  VariantStatus,
  TenantStatus,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const TENANT_SLUG = 'corekit';

type Cat = { slug: string; name: string; description?: string };
type CatTree = Cat & { children?: Cat[] };

const CATEGORIES: CatTree[] = [
  {
    slug: 'ncc-apparel',
    name: 'NCC Apparel',
    description: 'Official-style uniforms, tees, tracksuits and outerwear for NCC cadets.',
    children: [
      {
        slug: 'ncc-t-shirts',
        name: 'NCC T-shirts',
        description: 'NCC-branded cotton tees in multiple colours and sizes.',
      },
      {
        slug: 'army-t-shirts',
        name: 'Army T-shirts',
        description: 'Army-style cadet tees, round and V-neck.',
      },
      {
        slug: 'ncc-tracksuits',
        name: 'NCC Tracksuits',
        description: 'Performance tracksuits for parade and training.',
      },
      {
        slug: 'ncc-caps-topas',
        name: 'Caps & Topas',
        description: 'NCC caps, topas and peak caps.',
      },
    ],
  },
  {
    slug: 'ncc-insignia',
    name: 'NCC Insignia',
    description: 'Ranks, camp badges, medals and identity cards.',
    children: [
      {
        slug: 'ncc-ranks',
        name: 'Ranks',
        description: 'Cadet and officer ranks — JUO, SUO, SGT, CPL, L/CPL.',
      },
      {
        slug: 'ncc-camp-badges',
        name: 'Camp Badges',
        description: 'AITC, EBSB, SNIC, LRDC, Army-Attachment and more.',
      },
      {
        slug: 'ncc-badges-medals',
        name: 'Badges & Medals',
        description: 'Proficiency badges and commemorative medals.',
      },
      {
        slug: 'ncc-id-cards',
        name: 'ID Cards',
        description: 'NCC identity card blanks and holders.',
      },
    ],
  },
  {
    slug: 'ncc-accessories',
    name: 'NCC Accessories',
    description: 'T-flags, Kamarbands, Jhallars, whistles & more.',
    children: [
      {
        slug: 'ncc-t-flags',
        name: 'T-Flags',
        description: 'Premium NCC T-flags for camps, parades and competitions.',
      },
      {
        slug: 'ncc-kamarband',
        name: 'Kamarband & Jhallar',
        description: 'Ceremonial kamarbands and jhallars in gold and standard finish.',
      },
      {
        slug: 'ncc-general-accessories',
        name: 'General Accessories',
        description: 'Whistles, lanyards, shoelaces and small-kit items.',
      },
    ],
  },
  {
    slug: 'books-study',
    name: 'Books & Study Material',
    description: 'NCC handbooks, revision guides and certificate exam prep.',
  },
];

type ProductSeed = {
  slug: string;
  name: string;
  short: string;
  description: string;
  brand?: string;
  categorySlugs: string[];
  taxRate?: number;
  variants: Array<{
    sku: string;
    title: string;
    price: number;
    compareAtPrice?: number;
    stockOnHand: number;
    attributes: Record<string, string>;
    weightGrams?: number;
  }>;
};

const sizeVariants = (
  baseSku: string,
  price: number,
  compareAt?: number,
  stock = 40,
): ProductSeed['variants'] =>
  ['S', 'M', 'L', 'XL', 'XXL'].map((size) => ({
    sku: `${baseSku}-${size}`,
    title: size,
    price,
    compareAtPrice: compareAt,
    stockOnHand: stock,
    attributes: { size },
    weightGrams: 200,
  }));

const PRODUCTS: ProductSeed[] = [
  // ---------------- NCC T-Shirts ----------------
  {
    slug: 'ncc-cross-flag-tshirt',
    name: 'NCC Cross Flag T-shirt',
    short: '100% cotton round-neck tee printed with the NCC crossed flags.',
    description:
      'Premium bio-washed cotton tee for NCC cadets. Features the crossed-flags emblem on the chest, breathable knit, and regular fit for parade and classroom wear.',
    brand: 'Mission NCC',
    categorySlugs: ['ncc-apparel', 'ncc-t-shirts'],
    taxRate: 5,
    variants: sizeVariants('TS-CF', 299),
  },
  {
    slug: 'ncc-future-force-tshirt',
    name: 'NCC Future Force T-shirt',
    short: 'Round-neck tee with the “Future Force” NCC slogan.',
    description:
      'Inspired by the NCC motto, this tee features a bold chest print and extra-comfort shoulder tape. Ideal for cadet camps and school activities.',
    brand: 'Mission NCC',
    categorySlugs: ['ncc-apparel', 'ncc-t-shirts'],
    variants: sizeVariants('TS-FF', 319),
  },
  {
    slug: 'mission-ncc-white-tshirt',
    name: 'Mission NCC White T-shirt',
    short: 'Classic white tee with the Mission NCC wordmark.',
    description:
      'Crisp white cotton tee, ring-spun for durability, with a subtle Mission NCC wordmark print. Pairs perfectly under uniform jackets.',
    brand: 'Mission NCC',
    categorySlugs: ['ncc-apparel', 'ncc-t-shirts'],
    variants: sizeVariants('TS-MW', 299),
  },
  {
    slug: 'ncc-light-blue-logo-tshirt',
    name: 'NCC Light Blue Logo T-shirt',
    short: 'Light-blue cotton tee with embroidered NCC logo.',
    description:
      'Sky-blue bio-washed tee with a chest-left NCC emblem. Minimal, clean and parade-ready.',
    brand: 'Mission NCC',
    categorySlugs: ['ncc-apparel', 'ncc-t-shirts'],
    variants: sizeVariants('TS-LB', 299),
  },
  {
    slug: 'ncc-red-logo-tshirt',
    name: 'NCC Red Logo T-shirt',
    short: 'NCC red round-neck tee with chest emblem.',
    description:
      'Red cotton tee, colour-fast and softly brushed for comfort. Emblazoned with the NCC emblem.',
    brand: 'Mission NCC',
    categorySlugs: ['ncc-apparel', 'ncc-t-shirts'],
    variants: sizeVariants('TS-RD', 299),
  },
  {
    slug: 'ncc-white-logo-tshirt',
    name: 'NCC White Logo T-shirt',
    short: 'White cotton tee with the standard NCC emblem.',
    description:
      '100% cotton white tee with printed emblem. Classroom + parade friendly.',
    brand: 'Mission NCC',
    categorySlugs: ['ncc-apparel', 'ncc-t-shirts'],
    variants: sizeVariants('TS-WH', 299),
  },
  {
    slug: 'army-combat-round-tshirt',
    name: 'Army Combat Round-Neck T-shirt',
    short: 'Olive-green Army-style tee for cadets.',
    description:
      'Heavy-weight combed cotton tee in combat-olive, reinforced neck tape and shoulder stitching. Built for drill-hall abuse.',
    brand: 'Mission NCC',
    categorySlugs: ['ncc-apparel', 'army-t-shirts'],
    variants: sizeVariants('TS-AR', 349),
  },

  // ---------------- Sweaters / Outerwear ----------------
  {
    slug: 'mission-ncc-sweater',
    name: 'Mission NCC Sweater',
    short: 'Warm pullover sweater with NCC emblem.',
    description:
      'Woollen-blend V-neck sweater in deep navy with a subtle NCC emblem on the chest. Works over a shirt or tee in cold-camp conditions.',
    brand: 'Mission NCC',
    categorySlugs: ['ncc-apparel'],
    variants: sizeVariants('SW-MN', 645, 1299, 25),
  },
  {
    slug: 'ncc-round-neck-full-sleeve',
    name: 'NCC Full-Sleeve Round Neck',
    short: 'Mid-weight cotton pullover for cool mornings.',
    description:
      'Thermal-feel cotton pullover with ribbed cuffs. Subtle NCC branding on the sleeve.',
    brand: 'Mission NCC',
    categorySlugs: ['ncc-apparel'],
    variants: sizeVariants('SW-FS', 449, undefined, 30),
  },

  // ---------------- Tracksuits ----------------
  {
    slug: 'ncc-tracksuit-boys',
    name: 'NCC Tracksuit — Boys',
    short: 'Two-piece performance tracksuit for cadets.',
    description:
      'Breathable poly-cotton tracksuit with an NCC emblem on the chest and side-striping. Includes jacket and pants.',
    brand: 'Mission NCC',
    categorySlugs: ['ncc-apparel', 'ncc-tracksuits'],
    variants: sizeVariants('TK-B', 1499, 1799, 20),
  },
  {
    slug: 'ncc-tracksuit-girls',
    name: 'NCC Tracksuit — Girls',
    short: 'Two-piece performance tracksuit for cadets.',
    description:
      'Breathable poly-cotton tracksuit tailored for girl cadets, with an NCC emblem and side-striping. Includes jacket and pants.',
    brand: 'Mission NCC',
    categorySlugs: ['ncc-apparel', 'ncc-tracksuits'],
    variants: sizeVariants('TK-G', 1499, 1799, 20),
  },

  // ---------------- Caps & Topas ----------------
  {
    slug: 'ncc-cap-with-logo',
    name: 'NCC Cap with Logo',
    short: 'Cotton NCC cap with adjustable strap.',
    description:
      'Six-panel structured cap with embroidered NCC emblem. Curved brim, mesh-lined sweatband, adjustable back strap.',
    brand: 'Mission NCC',
    categorySlugs: ['ncc-apparel', 'ncc-caps-topas'],
    variants: [
      {
        sku: 'CAP-LOGO-ONESIZE',
        title: 'One size',
        price: 249,
        stockOnHand: 120,
        attributes: { size: 'One size' },
        weightGrams: 120,
      },
    ],
  },
  {
    slug: 'ncc-topa',
    name: 'NCC Topa',
    short: 'Classic NCC cadet topa for drill and parade.',
    description:
      'Traditional NCC topa, cotton drill, parade-ready. Supplied in standard cadet sizing.',
    brand: 'Mission NCC',
    categorySlugs: ['ncc-apparel', 'ncc-caps-topas'],
    variants: [
      { sku: 'TP-56', title: '56', price: 199, stockOnHand: 60, attributes: { size: '56' }, weightGrams: 90 },
      { sku: 'TP-58', title: '58', price: 199, stockOnHand: 60, attributes: { size: '58' }, weightGrams: 90 },
      { sku: 'TP-60', title: '60', price: 199, stockOnHand: 60, attributes: { size: '60' }, weightGrams: 90 },
    ],
  },
  {
    slug: 'ncc-peak-cap-officer',
    name: 'NCC Peak Cap (Officer Style)',
    short: 'Officer-style peak cap for senior cadets.',
    description:
      'Structured peak cap with reinforced crown and polished peak. Worn by SUOs and senior officials at ceremonial parades.',
    brand: 'Mission NCC',
    categorySlugs: ['ncc-apparel', 'ncc-caps-topas'],
    variants: [
      { sku: 'PKC-56', title: '56', price: 499, stockOnHand: 30, attributes: { size: '56' }, weightGrams: 180 },
      { sku: 'PKC-58', title: '58', price: 499, stockOnHand: 30, attributes: { size: '58' }, weightGrams: 180 },
      { sku: 'PKC-60', title: '60', price: 499, stockOnHand: 30, attributes: { size: '60' }, weightGrams: 180 },
    ],
  },

  // ---------------- Camp Badges ----------------
  ...[
    { slug: 'aitc-namchi', name: 'All India Trekking Camp — Namchi Trek' },
    { slug: 'aitc-amarkantak', name: 'All India Trekking Camp — Amarkantak' },
    { slug: 'aitc-alwar', name: 'All India Trekking Camp — Alwar' },
    { slug: 'aitc-guntur', name: 'All India Trekking Camp — Guntur' },
    { slug: 'ebsb-delhi', name: 'EBSB Badge — Delhi Directorate' },
    { slug: 'ebsb-varanasi', name: 'EBSB Badge — Varanasi' },
    { slug: 'ebsb-jhansi', name: 'EBSB Badge — Jhansi' },
  ].map<ProductSeed>((b) => ({
    slug: b.slug,
    name: b.name,
    short: 'Embroidered camp badge, iron-on or sew-on.',
    description: `${b.name} — embroidered commemorative badge (approx. 60 × 80 mm). Iron-on backing; can be hand-stitched for parade uniforms.`,
    brand: 'Mission NCC',
    categorySlugs: ['ncc-insignia', 'ncc-camp-badges'],
    variants: [
      {
        sku: `BDG-${b.slug.toUpperCase()}`,
        title: 'Standard',
        price: 199,
        stockOnHand: 200,
        attributes: { kind: 'camp-badge' },
        weightGrams: 15,
      },
    ],
  })),
  {
    slug: 'ncc-army-attachment-badge',
    name: 'NCC Army Attachment Badge',
    short: 'Commemorative camp attachment badge.',
    description:
      'Army-attachment camp commemorative badge. Embroidered, iron-on backing.',
    brand: 'Mission NCC',
    categorySlugs: ['ncc-insignia', 'ncc-camp-badges'],
    variants: [
      { sku: 'BDG-ARMY-ATT', title: 'Standard', price: 199, stockOnHand: 150, attributes: { kind: 'camp-badge' }, weightGrams: 15 },
    ],
  },
  {
    slug: 'ncc-snic-badge',
    name: 'SNIC — Special National Integration Camp Badge',
    short: 'SNIC camp commemorative badge.',
    description:
      'Embroidered Special National Integration Camp badge, national-level commemorative insignia.',
    brand: 'Mission NCC',
    categorySlugs: ['ncc-insignia', 'ncc-camp-badges'],
    variants: [
      { sku: 'BDG-SNIC', title: 'Standard', price: 249, stockOnHand: 120, attributes: { kind: 'camp-badge' }, weightGrams: 15 },
    ],
  },
  {
    slug: 'ncc-lrdc-badge',
    name: 'LRDC — Local Republic Day Camp Badge',
    short: 'Local Republic Day Camp commemorative badge.',
    description:
      'LRDC camp commemorative badge — embroidered, iron-on backing.',
    brand: 'Mission NCC',
    categorySlugs: ['ncc-insignia', 'ncc-camp-badges'],
    variants: [
      { sku: 'BDG-LRDC', title: 'Standard', price: 249, stockOnHand: 120, attributes: { kind: 'camp-badge' }, weightGrams: 15 },
    ],
  },

  // ---------------- Ranks ----------------
  {
    slug: 'ncc-rank-suo',
    name: 'NCC Rank — SUO (Senior Under Officer)',
    short: 'Embroidered SUO rank insignia, pair.',
    description:
      'Pair of embroidered SUO rank insignia for the senior-most cadet rank. Supplied per pair.',
    brand: 'Mission NCC',
    categorySlugs: ['ncc-insignia', 'ncc-ranks'],
    variants: [
      { sku: 'RNK-SUO', title: 'Pair', price: 179, stockOnHand: 80, attributes: { kind: 'rank' }, weightGrams: 12 },
    ],
  },
  {
    slug: 'ncc-rank-juo',
    name: 'NCC Rank — JUO (Junior Under Officer)',
    short: 'Embroidered JUO rank insignia, pair.',
    description:
      'Pair of embroidered JUO rank insignia. Supplied per pair.',
    brand: 'Mission NCC',
    categorySlugs: ['ncc-insignia', 'ncc-ranks'],
    variants: [
      { sku: 'RNK-JUO', title: 'Pair', price: 149, stockOnHand: 100, attributes: { kind: 'rank' }, weightGrams: 12 },
    ],
  },
  {
    slug: 'ncc-rank-sergeant',
    name: 'NCC Rank — Sergeant',
    short: 'Embroidered Sergeant rank stripes.',
    description:
      'Pair of embroidered Sergeant rank stripes. Parade-grade finish.',
    brand: 'Mission NCC',
    categorySlugs: ['ncc-insignia', 'ncc-ranks'],
    variants: [
      { sku: 'RNK-SGT', title: 'Pair', price: 129, stockOnHand: 120, attributes: { kind: 'rank' }, weightGrams: 10 },
    ],
  },
  {
    slug: 'ncc-rank-corporal',
    name: 'NCC Rank — Corporal',
    short: 'Embroidered Corporal rank stripes.',
    description:
      'Pair of embroidered Corporal rank stripes.',
    brand: 'Mission NCC',
    categorySlugs: ['ncc-insignia', 'ncc-ranks'],
    variants: [
      { sku: 'RNK-CPL', title: 'Pair', price: 109, stockOnHand: 140, attributes: { kind: 'rank' }, weightGrams: 10 },
    ],
  },
  {
    slug: 'ncc-rank-lance-corporal',
    name: 'NCC Rank — Lance Corporal',
    short: 'Embroidered Lance Corporal stripe.',
    description:
      'Pair of embroidered Lance Corporal stripes.',
    brand: 'Mission NCC',
    categorySlugs: ['ncc-insignia', 'ncc-ranks'],
    variants: [
      { sku: 'RNK-LCPL', title: 'Pair', price: 99, stockOnHand: 180, attributes: { kind: 'rank' }, weightGrams: 10 },
    ],
  },

  // ---------------- Accessories ----------------
  {
    slug: 'ncc-t-flag-premium',
    name: 'NCC Best-Quality T-Flag',
    short: 'Heavy-cotton NCC T-flag with wooden staff.',
    description:
      'Premium NCC T-flag — heavy-weave cotton, hand-stitched borders, wooden staff with brass cap. Ideal for camp parade and inter-school competitions.',
    brand: 'Mission NCC',
    categorySlugs: ['ncc-accessories', 'ncc-t-flags'],
    variants: [
      { sku: 'TFLAG-STD', title: 'Standard', price: 1299, compareAtPrice: 2200, stockOnHand: 15, attributes: { variant: 'standard' }, weightGrams: 1200 },
      { sku: 'TFLAG-LRG', title: 'Large', price: 1899, compareAtPrice: 2600, stockOnHand: 10, attributes: { variant: 'large' }, weightGrams: 1600 },
      { sku: 'TFLAG-XL', title: 'XL (Parade)', price: 2200, compareAtPrice: 2900, stockOnHand: 6, attributes: { variant: 'xl' }, weightGrams: 1900 },
    ],
  },
  {
    slug: 'ncc-kamarband-jhallar-golden',
    name: 'NCC Kamarband + Jhallar — Golden',
    short: 'Golden ceremonial kamarband with jhallar.',
    description:
      'Ceremonial kamarband (waist sash) with golden jhallar tassels. Fits most cadet sizes via adjustable buckle.',
    brand: 'Mission NCC',
    categorySlugs: ['ncc-accessories', 'ncc-kamarband'],
    variants: [
      { sku: 'KMB-GLD', title: 'Golden', price: 160, stockOnHand: 60, attributes: { finish: 'golden' }, weightGrams: 140 },
    ],
  },
  {
    slug: 'ncc-kamarband-jhallar-standard',
    name: 'NCC Kamarband + Jhallar — Standard',
    short: 'Standard ceremonial kamarband with jhallar.',
    description:
      'Ceremonial kamarband with standard-finish jhallar tassels. Ideal for day-to-day parade use.',
    brand: 'Mission NCC',
    categorySlugs: ['ncc-accessories', 'ncc-kamarband'],
    variants: [
      { sku: 'KMB-STD', title: 'Standard', price: 140, stockOnHand: 80, attributes: { finish: 'standard' }, weightGrams: 140 },
    ],
  },
  {
    slug: 'ncc-whistle-lanyard',
    name: 'NCC Metal Whistle with Lanyard',
    short: 'Brass whistle with braided lanyard.',
    description:
      'Solid brass pea-less whistle with a braided lanyard and breakaway clip. Trusted by drill instructors.',
    brand: 'Mission NCC',
    categorySlugs: ['ncc-accessories', 'ncc-general-accessories'],
    variants: [
      { sku: 'WHS-LAN', title: 'Standard', price: 79, stockOnHand: 200, attributes: { kind: 'whistle' }, weightGrams: 40 },
    ],
  },

  // ---------------- Books ----------------
  {
    slug: 'ncc-handbook-vol1',
    name: 'NCC Handbook — Volume 1 (A Certificate)',
    short: 'A-Certificate prep, drill, weapon training & map reading.',
    description:
      'Volume 1 of the Mission NCC Handbook series — covers A-Certificate syllabus, drill commands, weapon training, map reading and social service.',
    brand: 'Mission NCC',
    categorySlugs: ['books-study'],
    variants: [
      { sku: 'BK-HB-V1', title: 'Paperback', price: 499, stockOnHand: 80, attributes: { format: 'paperback' }, weightGrams: 500 },
    ],
  },
  {
    slug: 'ncc-handbook-vol2',
    name: 'NCC Handbook — Volume 2 (B Certificate)',
    short: 'B-Certificate prep with worked examples and practice papers.',
    description:
      'Volume 2 — B-Certificate syllabus, field craft, leadership, social service and community development. Includes sample papers.',
    brand: 'Mission NCC',
    categorySlugs: ['books-study'],
    variants: [
      { sku: 'BK-HB-V2', title: 'Paperback', price: 499, stockOnHand: 80, attributes: { format: 'paperback' }, weightGrams: 500 },
    ],
  },
  {
    slug: 'ncc-handbook-vol3',
    name: 'NCC Handbook — Volume 3 (C Certificate)',
    short: 'C-Certificate prep: advanced drill, weapon systems, management.',
    description:
      'Volume 3 — C-Certificate advanced syllabus, armed-forces knowledge, leadership and management. Essential for UPSC-NDA aspirants.',
    brand: 'Mission NCC',
    categorySlugs: ['books-study'],
    variants: [
      { sku: 'BK-HB-V3', title: 'Paperback', price: 599, stockOnHand: 60, attributes: { format: 'paperback' }, weightGrams: 550 },
    ],
  },
  {
    slug: 'mission-ncc-revision-guide',
    name: 'Mission NCC — Quick Revision Guide',
    short: 'Compact last-minute revision notes for A/B/C cadets.',
    description:
      'High-density revision notes covering every pan-Indian NCC certificate paper. Designed for the last two weeks before the exam.',
    brand: 'Mission NCC',
    categorySlugs: ['books-study'],
    variants: [
      { sku: 'BK-REV-GD', title: 'Paperback', price: 399, stockOnHand: 100, attributes: { format: 'paperback' }, weightGrams: 350 },
    ],
  },
];

async function main() {
  console.log('🎖️  Seeding NCC catalog…');

  const tenant = await prisma.tenant.upsert({
    where: { slug: TENANT_SLUG },
    update: { name: 'Mission NCC Store' },
    create: {
      slug: TENANT_SLUG,
      name: 'Mission NCC Store',
      status: TenantStatus.ACTIVE,
      currencyCode: 'INR',
      defaultCountry: 'IN',
      timezone: 'Asia/Kolkata',
    },
  });
  console.log(`✅ Tenant: ${tenant.name}`);

  // 1. Categories (top-level first)
  const idBySlug = new Map<string, string>();
  for (const c of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: c.slug } },
      update: { name: c.name, description: c.description },
      create: {
        tenantId: tenant.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        isActive: true,
      },
    });
    idBySlug.set(c.slug, cat.id);
  }
  // 2. Subcategories
  for (const c of CATEGORIES) {
    if (!c.children) continue;
    const parentId = idBySlug.get(c.slug)!;
    for (const sub of c.children) {
      const cat = await prisma.category.upsert({
        where: { tenantId_slug: { tenantId: tenant.id, slug: sub.slug } },
        update: {
          name: sub.name,
          description: sub.description,
          parentId,
        },
        create: {
          tenantId: tenant.id,
          slug: sub.slug,
          name: sub.name,
          description: sub.description,
          parentId,
          isActive: true,
        },
      });
      idBySlug.set(sub.slug, cat.id);
    }
  }
  console.log(`✅ Categories: ${idBySlug.size}`);

  // 3. Products + variants + category links
  for (const p of PRODUCTS) {
    const product = await prisma.product.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: p.slug } } as any,
      update: {
        name: p.name,
        shortDescription: p.short,
        description: p.description,
        brand: p.brand,
        status: ProductStatus.ACTIVE,
        isPublished: true,
        taxRate: p.taxRate ?? 0,
      },
      create: {
        tenantId: tenant.id,
        slug: p.slug,
        name: p.name,
        shortDescription: p.short,
        description: p.description,
        brand: p.brand,
        status: ProductStatus.ACTIVE,
        isPublished: true,
        taxRate: p.taxRate ?? 0,
      },
    });

    for (const v of p.variants) {
      await prisma.productVariant.upsert({
        where: { tenantId_sku: { tenantId: tenant.id, sku: v.sku } },
        update: {
          title: v.title,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          stockOnHand: v.stockOnHand,
          attributes: v.attributes,
          weightGrams: v.weightGrams,
          status: VariantStatus.ACTIVE,
        },
        create: {
          tenantId: tenant.id,
          productId: product.id,
          sku: v.sku,
          title: v.title,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          stockOnHand: v.stockOnHand,
          attributes: v.attributes,
          weightGrams: v.weightGrams,
          status: VariantStatus.ACTIVE,
        },
      });
    }

    for (const slug of p.categorySlugs) {
      const categoryId = idBySlug.get(slug);
      if (!categoryId) continue;
      await prisma.productCategory.upsert({
        where: {
          productId_categoryId: { productId: product.id, categoryId },
        },
        update: {},
        create: { productId: product.id, categoryId },
      });
    }
  }
  console.log(`✅ Products: ${PRODUCTS.length}`);
  console.log('\n🎖️  NCC seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ NCC seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
