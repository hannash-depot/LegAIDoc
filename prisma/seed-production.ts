/**
 * Production seed script — creates categories and contract templates
 * (no test users or passwords).
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx prisma/seed-production.ts
 *
 * Safe to run multiple times (uses upsert).
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { seedContracts } from './seed-contracts';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const rental = await prisma.category.upsert({
    where: { slug: 'rental-agreements' },
    update: { icon: 'Home' },
    create: {
      slug: 'rental-agreements',
      icon: 'Home',
      nameHe: 'הסכמי שכירות',
      nameAr: 'اتفاقيات الإيجار',
      nameEn: 'Rental Agreements',
      nameRu: 'Договоры аренды',
      descHe: 'חוזי שכירות למגורים ולמסחר',
      descAr: 'عقود الإيجار السكنية والتجارية',
      descEn: 'Residential and commercial lease contracts',
      descRu: 'Договоры аренды жилья и коммерческой недвижимости',
      sortOrder: 1,
      legalRules: {
        rules: [
          {
            type: 'deposit-cap',
            enabled: true,
            maxFractionOfTotal: 0.333,
            maxMonths: 3,
            depositFieldKey: 'securityDeposit',
            monthlyRentFieldKey: 'monthlyRent',
          },
          {
            type: 'repair-timeline',
            enabled: true,
            urgentDays: 3,
            nonUrgentDays: 30,
          },
          {
            type: 'prohibited-charges',
            enabled: true,
            prohibitedFieldKeys: ['brokerFee', 'buildingInsurance'],
          },
          {
            type: 'dispute-resolution',
            enabled: true,
            includeSulha: true,
          },
        ],
      },
    },
  });

  const employment = await prisma.category.upsert({
    where: { slug: 'employment' },
    update: { icon: 'Briefcase' },
    create: {
      slug: 'employment',
      icon: 'Briefcase',
      nameHe: 'הסכמי עבודה',
      nameAr: 'اتفاقيات العمل',
      nameEn: 'Employment Agreements',
      nameRu: 'Трудовые договоры',
      descHe: 'חוזי העסקה, הסכמי סודיות וחוזי שירות',
      descAr: 'عقود التوظيف واتفاقيات السرية وعقود الخدمات',
      descEn: 'Employment contracts, NDAs, and service agreements',
      descRu: 'Трудовые договоры, соглашения о конфиденциальности и договоры на оказание услуг',
      sortOrder: 2,
    },
  });

  const realEstate = await prisma.category.upsert({
    where: { slug: 'real-estate' },
    update: { icon: 'Building2' },
    create: {
      slug: 'real-estate',
      icon: 'Building2',
      nameHe: 'נדל״ן',
      nameAr: 'عقارات',
      nameEn: 'Real Estate',
      nameRu: 'Недвижимость',
      descHe: 'הסכמי מכר ורכישת מקרקעין',
      descAr: 'اتفاقيات بيع وشراء العقارات',
      descEn: 'Property purchase and sale agreements',
      descRu: 'Договоры купли-продажи недвижимости',
      sortOrder: 3,
    },
  });

  const powerOfAttorney = await prisma.category.upsert({
    where: { slug: 'power-of-attorney' },
    update: { icon: 'Scale' },
    create: {
      slug: 'power-of-attorney',
      icon: 'Scale',
      nameHe: 'ייפוי כוח',
      nameAr: 'توكيل',
      nameEn: 'Power of Attorney',
      nameRu: 'Доверенность',
      descHe: 'ייפויי כוח כלליים וספציפיים',
      descAr: 'توكيلات عامة وخاصة',
      descEn: 'General and specific powers of attorney',
      descRu: 'Общие и специальные доверенности',
      sortOrder: 4,
    },
  });

  const familyLaw = await prisma.category.upsert({
    where: { slug: 'family-law' },
    update: { icon: 'Heart' },
    create: {
      slug: 'family-law',
      icon: 'Heart',
      nameHe: 'צוואות וירושות',
      nameAr: 'الوصايا والمواريث',
      nameEn: 'Wills & Inheritance',
      nameRu: 'Завещания и наследство',
      descHe: 'צוואות והסכמי ממון',
      descAr: 'الوصايا واتفاقيات ما قبل الزواج',
      descEn: 'Wills, inheritance, and prenuptial agreements',
      descRu: 'Завещания, наследство и брачные контракты',
      sortOrder: 5,
    },
  });

  const vehicles = await prisma.category.upsert({
    where: { slug: 'vehicles' },
    update: { icon: 'Car' },
    create: {
      slug: 'vehicles',
      icon: 'Car',
      nameHe: 'רכב',
      nameAr: 'مركبات',
      nameEn: 'Vehicles',
      nameRu: 'Транспорт',
      descHe: 'הסכמי מכירה ורכישה של כלי רכב',
      descAr: 'اتفاقيات بيع وشراء المركبات',
      descEn: 'Vehicle sale and purchase agreements',
      descRu: 'Договоры купли-продажи транспортных средств',
      sortOrder: 6,
      legalRules: {
        rules: [
          { type: 'ownership-transfer-deadline', enabled: true, maxDays: 15 },
          { type: 'defect-disclosure', enabled: true },
        ],
      },
    },
  });

  console.log(
    'Seeded production categories:',
    [
      rental.slug,
      employment.slug,
      realEstate.slug,
      powerOfAttorney.slug,
      familyLaw.slug,
      vehicles.slug,
    ].join(', '),
  );

  const categoryMap: Record<string, string> = {
    'rental-agreements': rental.id,
    employment: employment.id,
    'real-estate': realEstate.id,
    'power-of-attorney': powerOfAttorney.id,
    'family-law': familyLaw.id,
    vehicles: vehicles.id,
  };

  let createdCount = 0;
  let updatedCount = 0;
  for (const contract of seedContracts) {
    const categoryId = categoryMap[contract.categorySlug];
    if (!categoryId) {
      console.warn(`Skipping ${contract.slug}: unknown category ${contract.categorySlug}`);
      continue;
    }
    const data = {
      slug: contract.slug,
      nameHe: contract.nameHe,
      nameAr: contract.nameAr,
      nameEn: contract.nameEn,
      nameRu: contract.nameRu,
      descHe: contract.descHe,
      descAr: contract.descAr,
      descEn: contract.descEn,
      descRu: contract.descRu,
      categoryId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      definition: contract.definition as any,
    };
    const result = await prisma.template.upsert({
      where: { slug: contract.slug },
      update: { definition: data.definition },
      create: data,
    });
    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      createdCount++;
    } else {
      updatedCount++;
    }
  }

  console.log(`Seeded templates: ${createdCount} created, ${updatedCount} updated`);
}

main()
  .catch((e) => {
    console.error('Production seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
