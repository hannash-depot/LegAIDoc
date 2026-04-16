import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashSync } from 'bcryptjs';
import { seedContracts } from './seed-contracts';

if (process.env.NODE_ENV === 'production') {
  throw new Error(
    'Seed script must not run in production. Set NODE_ENV to "development" or "test" to seed.',
  );
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@legaidoc.com' },
    update: { role: 'ADMIN' },
    create: {
      name: 'Admin',
      email: 'admin@legaidoc.com',
      hashedPassword: hashSync('admin123', 12),
      role: 'ADMIN',
      preferredLocale: 'he',
    },
  });

  console.log('Seeded admin user:', admin.email);

  // Create additional test admin accounts
  const testAdmin1 = await prisma.user.upsert({
    where: { email: 'admin2@legaidoc.com' },
    update: {},
    create: {
      name: 'Test Admin (HE)',
      email: 'admin2@legaidoc.com',
      hashedPassword: hashSync('admin123', 12),
      role: 'ADMIN',
      preferredLocale: 'he',
      companyName: 'דוגמה בע"מ',
      phone: '050-1234567',
    },
  });

  const testAdmin2 = await prisma.user.upsert({
    where: { email: 'admin3@legaidoc.com' },
    update: {},
    create: {
      name: 'Test Admin (AR)',
      email: 'admin3@legaidoc.com',
      hashedPassword: hashSync('admin123', 12),
      role: 'ADMIN',
      preferredLocale: 'ar',
      companyName: 'شركة اختبار',
      phone: '052-9876543',
    },
  });

  const testAdmin3 = await prisma.user.upsert({
    where: { email: 'admin4@legaidoc.com' },
    update: {},
    create: {
      name: 'Test Admin (EN)',
      email: 'admin4@legaidoc.com',
      hashedPassword: hashSync('admin123', 12),
      role: 'ADMIN',
      preferredLocale: 'en',
      companyName: 'Test Corp Ltd.',
      phone: '054-5551234',
    },
  });

  // Create a regular (non-admin) test user for comparison testing
  const testUser = await prisma.user.upsert({
    where: { email: 'user@legaidoc.com' },
    update: {},
    create: {
      name: 'Test User',
      email: 'user@legaidoc.com',
      hashedPassword: hashSync('user123', 12),
      role: 'USER',
      preferredLocale: 'he',
    },
  });

  console.log('Seeded test admins:', testAdmin1.email, testAdmin2.email, testAdmin3.email);
  console.log('Seeded test user:', testUser.email);

  // Create sample categories
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

  console.log('Seeded categories:', rental.slug, employment.slug);

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
    'Seeded additional categories:',
    realEstate.slug,
    powerOfAttorney.slug,
    familyLaw.slug,
    vehicles.slug,
  );

  const categoryMap = {
    'rental-agreements': rental.id,
    employment: employment.id,
    'real-estate': realEstate.id,
    'power-of-attorney': powerOfAttorney.id,
    'family-law': familyLaw.id,
    vehicles: vehicles.id,
  };

  // Create sample Residential Lease template — based on "חוזה עירוני מומלץ - עדכון 2023"
  const leaseDefinition = {
    version: 2,
    steps: [
      // Step 1: Landlord Details
      {
        key: 'landlord',
        title: {
          he: 'פרטי בעל הדירה',
          ar: 'بيانات المؤجر',
          en: 'Landlord Details',
          ru: 'Данные арендодателя',
        },
        description: {
          he: 'הזן את פרטי בעל הנכס ופרטי ההתקשרות',
          ar: 'أدخل بيانات مالك العقار ومعلومات الاتصال',
          en: "Enter the property owner's personal and contact information",
          ru: 'Введите личные и контактные данные арендодателя',
        },
        fields: [
          {
            key: 'landlordName',
            type: 'text',
            label: { he: 'שם מלא', ar: 'الاسم الكامل', en: 'Full Name', ru: 'Полное имя' },
            required: true,
            width: 'full',
            validation: { minLength: 2, maxLength: 100 },
          },
          {
            key: 'landlordId',
            type: 'id-number',
            label: {
              he: 'תעודת זהות',
              ar: 'رقم الهوية',
              en: 'ID Number',
              ru: 'Номер удостоверения',
            },
            required: true,
            width: 'half',
          },
          {
            key: 'landlordAddress',
            type: 'text',
            label: {
              he: 'כתובת מגורים',
              ar: 'عنوان السكن',
              en: 'Home Address',
              ru: 'Домашний адрес',
            },
            required: true,
            width: 'full',
          },
          {
            key: 'landlordPhone',
            type: 'phone',
            label: { he: 'טלפון', ar: 'الهاتف', en: 'Phone', ru: 'Телефон' },
            required: true,
            width: 'half',
          },
          {
            key: 'landlordEmail',
            type: 'email',
            label: { he: 'דוא"ל', ar: 'البريد الإلكتروني', en: 'Email', ru: 'Эл. почта' },
            required: false,
            width: 'half',
          },
        ],
      },
      // Step 2: Tenant Details
      {
        key: 'tenant',
        title: {
          he: 'פרטי השוכר',
          ar: 'بيانات المستأجر',
          en: 'Tenant Details',
          ru: 'Данные арендатора',
        },
        description: {
          he: 'הזן את פרטי השוכר. ניתן להוסיף שוכר נוסף במידת הצורך',
          ar: 'أدخل بيانات المستأجر. يمكنك إضافة مستأجر ثانٍ إذا لزم الأمر',
          en: "Enter the tenant's details. Add a second tenant if applicable",
          ru: 'Введите данные арендатора. При необходимости добавьте второго арендатора',
        },
        fields: [
          {
            key: 'tenantName',
            type: 'text',
            label: {
              he: 'שם מלא (שוכר 1)',
              ar: 'الاسم الكامل (مستأجر 1)',
              en: 'Full Name (Tenant 1)',
              ru: 'Полное имя (Арендатор 1)',
            },
            required: true,
            width: 'full',
            validation: { minLength: 2, maxLength: 100 },
          },
          {
            key: 'tenantId',
            type: 'id-number',
            label: {
              he: 'תעודת זהות',
              ar: 'رقم الهوية',
              en: 'ID Number',
              ru: 'Номер удостоверения',
            },
            required: true,
            width: 'half',
          },
          {
            key: 'tenant2Name',
            type: 'text',
            label: {
              he: 'שם מלא (שוכר 2 - לא חובה)',
              ar: 'الاسم الكامل (مستأجر 2 - اختياري)',
              en: 'Full Name (Tenant 2 - Optional)',
              ru: 'Полное имя (Арендатор 2 - необязательно)',
            },
            required: false,
            width: 'full',
          },
          {
            key: 'tenant2Id',
            type: 'id-number',
            label: {
              he: 'ת.ז. שוכר 2',
              ar: 'هوية المستأجر 2',
              en: 'Tenant 2 ID',
              ru: 'ID Арендатора 2',
            },
            required: false,
            width: 'half',
            condition: { field: 'tenant2Name', operator: 'is_truthy' },
          },
          {
            key: 'tenantAddress',
            type: 'text',
            label: {
              he: 'כתובת נוכחית',
              ar: 'العنوان الحالي',
              en: 'Current Address',
              ru: 'Текущий адрес',
            },
            required: true,
            width: 'full',
          },
          {
            key: 'tenantPhone',
            type: 'phone',
            label: { he: 'טלפון', ar: 'الهاتف', en: 'Phone', ru: 'Телефон' },
            required: true,
            width: 'half',
          },
        ],
      },
      // Step 3: Property Details
      {
        key: 'property',
        title: {
          he: 'פרטי הדירה',
          ar: 'بيانات الشقة',
          en: 'Property Details',
          ru: 'Данные о квартире',
        },
        description: {
          he: 'תאר את הנכס המושכר והמתקנים הנלווים',
          ar: 'صف العقار المؤجر ومرافقه',
          en: 'Describe the rental property and its amenities',
          ru: 'Опишите арендуемую недвижимость и её удобства',
        },
        fields: [
          {
            key: 'propertyCity',
            type: 'text',
            label: { he: 'עיר', ar: 'المدينة', en: 'City', ru: 'Город' },
            required: true,
            width: 'half',
          },
          {
            key: 'propertyAddress',
            type: 'text',
            label: {
              he: 'רחוב ומספר',
              ar: 'الشارع والرقم',
              en: 'Street & Number',
              ru: 'Улица и номер',
            },
            required: true,
            width: 'full',
          },
          {
            key: 'propertyRooms',
            type: 'number',
            label: {
              he: 'מספר חדרים',
              ar: 'عدد الغرف',
              en: 'Number of Rooms',
              ru: 'Количество комнат',
            },
            required: true,
            width: 'half',
            validation: { min: 1, max: 20 },
          },
          {
            key: 'propertyFloor',
            type: 'number',
            label: { he: 'קומה', ar: 'الطابق', en: 'Floor', ru: 'Этаж' },
            required: false,
            width: 'half',
            validation: { min: -2, max: 50 },
          },
          {
            key: 'hasParking',
            type: 'checkbox',
            label: {
              he: 'כולל חניה',
              ar: 'يشمل موقف سيارات',
              en: 'Includes Parking',
              ru: 'Включает парковку',
            },
            required: false,
            width: 'half',
          },
          {
            key: 'hasStorage',
            type: 'checkbox',
            label: {
              he: 'כולל מחסן',
              ar: 'يشمل مخزن',
              en: 'Includes Storage',
              ru: 'Включает кладовку',
            },
            required: false,
            width: 'half',
          },
          {
            key: 'hasBalcony',
            type: 'checkbox',
            label: {
              he: 'כולל מרפסת',
              ar: 'يشمل شرفة',
              en: 'Includes Balcony',
              ru: 'Включает балкон',
            },
            required: false,
            width: 'half',
          },
        ],
      },
      // Step 4: Lease Period
      {
        key: 'leasePeriod',
        title: { he: 'תקופת השכירות', ar: 'فترة الإيجار', en: 'Lease Period', ru: 'Срок аренды' },
        description: {
          he: 'הגדר את תאריכי תחילה וסיום השכירות',
          ar: 'حدد تواريخ بدء وانتهاء الإيجار',
          en: 'Define the lease start and end dates',
          ru: 'Укажите даты начала и окончания аренды',
        },
        fields: [
          {
            key: 'leaseDurationMonths',
            type: 'number',
            label: {
              he: 'משך השכירות (חודשים)',
              ar: 'مدة الإيجار (أشهر)',
              en: 'Lease Duration (months)',
              ru: 'Срок аренды (месяцев)',
            },
            required: true,
            width: 'half',
            validation: { min: 1, max: 60 },
          },
          {
            key: 'startDate',
            type: 'date',
            label: { he: 'תאריך תחילה', ar: 'تاريخ البدء', en: 'Start Date', ru: 'Дата начала' },
            required: true,
            width: 'half',
          },
          {
            key: 'endDate',
            type: 'date',
            label: { he: 'תאריך סיום', ar: 'تاريخ الانتهاء', en: 'End Date', ru: 'Дата окончания' },
            required: true,
            width: 'half',
          },
        ],
      },
      // Step 5: Rent & Payment
      {
        key: 'rent',
        title: {
          he: 'דמי השכירות',
          ar: 'الإيجار الشهري',
          en: 'Rent & Payment',
          ru: 'Арендная плата',
        },
        description: {
          he: 'הגדר את סכום השכירות החודשי ואמצעי התשלום',
          ar: 'حدد مبلغ الإيجار الشهري وطريقة الدفع',
          en: 'Set the monthly rent amount and payment method',
          ru: 'Укажите сумму ежемесячной арендной платы и способ оплаты',
        },
        fields: [
          {
            key: 'monthlyRent',
            type: 'currency',
            label: {
              he: 'דמי שכירות חודשיים (₪)',
              ar: 'الإيجار الشهري (₪)',
              en: 'Monthly Rent (₪)',
              ru: 'Ежемесячная плата (₪)',
            },
            required: true,
            width: 'half',
          },
          {
            key: 'paymentDay',
            type: 'number',
            label: {
              he: 'יום תשלום בחודש',
              ar: 'يوم الدفع في الشهر',
              en: 'Payment Day of Month',
              ru: 'День оплаты в месяце',
            },
            required: true,
            width: 'half',
            validation: { min: 1, max: 28 },
          },
          {
            key: 'paymentMethod',
            type: 'select',
            label: {
              he: 'אמצעי תשלום',
              ar: 'طريقة الدفع',
              en: 'Payment Method',
              ru: 'Способ оплаты',
            },
            required: true,
            width: 'full',
            options: [
              {
                value: 'bank_transfer',
                label: {
                  he: 'העברה בנקאית',
                  ar: 'تحويل بنكي',
                  en: 'Bank Transfer',
                  ru: 'Банковский перевод',
                },
              },
              {
                value: 'checks',
                label: { he: "המחאות (צ'קים)", ar: 'شيكات', en: 'Checks', ru: 'Чеки' },
              },
            ],
          },
          {
            key: 'bankName',
            type: 'text',
            label: { he: 'שם הבנק', ar: 'اسم البنك', en: 'Bank Name', ru: 'Название банка' },
            required: false,
            width: 'half',
            condition: { field: 'paymentMethod', operator: 'equals', value: 'bank_transfer' },
          },
          {
            key: 'bankBranch',
            type: 'text',
            label: { he: 'סניף', ar: 'الفرع', en: 'Branch', ru: 'Филиал' },
            required: false,
            width: 'half',
            condition: { field: 'paymentMethod', operator: 'equals', value: 'bank_transfer' },
          },
          {
            key: 'bankAccount',
            type: 'text',
            label: { he: 'מספר חשבון', ar: 'رقم الحساب', en: 'Account Number', ru: 'Номер счёта' },
            required: false,
            width: 'half',
            condition: { field: 'paymentMethod', operator: 'equals', value: 'bank_transfer' },
          },
        ],
      },
      // Step 6: Option Period
      {
        key: 'option',
        title: { he: 'תקופת אופציה', ar: 'فترة الخيار', en: 'Option Period', ru: 'Период опциона' },
        description: {
          he: 'הגדר אם יש אופציה להארכת תקופת השכירות',
          ar: 'حدد ما إذا كان هناك خيار لتمديد الإيجار',
          en: "Define if there's an option to extend the lease",
          ru: 'Укажите, есть ли опцион на продление аренды',
        },
        fields: [
          {
            key: 'hasOption',
            type: 'checkbox',
            label: {
              he: 'יש אופציה להארכת השכירות',
              ar: 'يوجد خيار لتمديد الإيجار',
              en: 'Has Renewal Option',
              ru: 'Есть опцион на продление',
            },
            required: false,
            width: 'full',
          },
          {
            key: 'optionMonths',
            type: 'number',
            label: {
              he: 'משך האופציה (חודשים)',
              ar: 'مدة الخيار (أشهر)',
              en: 'Option Duration (months)',
              ru: 'Срок опциона (месяцев)',
            },
            required: false,
            width: 'half',
            validation: { min: 1, max: 24 },
            condition: { field: 'hasOption', operator: 'is_truthy' },
          },
          {
            key: 'maxRentIncrease',
            type: 'number',
            label: {
              he: 'העלאת שכ"ד מקסימלית (%)',
              ar: 'الحد الأقصى لزيادة الإيجار (%)',
              en: 'Max Rent Increase (%)',
              ru: 'Макс. повышение аренды (%)',
            },
            required: false,
            width: 'half',
            validation: { min: 0, max: 10 },
            condition: { field: 'hasOption', operator: 'is_truthy' },
          },
        ],
      },
      // Step 7: Payments & Utilities
      {
        key: 'utilities',
        title: {
          he: 'תשלומים שוטפים',
          ar: 'المدفوعات الجارية',
          en: 'Payments & Utilities',
          ru: 'Коммунальные платежи',
        },
        description: {
          he: 'הגדר את חלוקת התשלומים השוטפים ביניכם',
          ar: 'حدد توزيع المدفوعات الجارية بينكم',
          en: 'Define how recurring payments are split between parties',
          ru: 'Определите распределение коммунальных платежей',
        },
        fields: [
          {
            key: 'utilityTransferDays',
            type: 'number',
            label: {
              he: 'ימים להעברת חשבונות על שם השוכר',
              ar: 'أيام لنقل الحسابات لاسم المستأجر',
              en: 'Days to Transfer Utilities',
              ru: 'Дней на перевод счетов',
            },
            required: true,
            width: 'half',
            validation: { min: 7, max: 60 },
          },
          {
            key: 'includesArnona',
            type: 'checkbox',
            label: {
              he: 'השוכר משלם ארנונה',
              ar: 'المستأجر يدفع الأرنونا',
              en: 'Tenant Pays Arnona (Municipal Tax)',
              ru: 'Арендатор платит арнону',
            },
            required: false,
            width: 'full',
          },
          {
            key: 'includesVaadBayit',
            type: 'checkbox',
            label: {
              he: 'השוכר משלם ועד בית',
              ar: 'المستأجر يدفع لجنة البناء',
              en: 'Tenant Pays Building Maintenance',
              ru: 'Арендатор платит домовой комитет',
            },
            required: false,
            width: 'full',
          },
        ],
      },
      // Step 8: Security Deposit
      {
        key: 'security',
        title: { he: 'ביטחונות', ar: 'الضمانات', en: 'Security Deposit', ru: 'Обеспечение' },
        description: {
          he: 'הגדר את סוג הביטחון וסכומו',
          ar: 'حدد نوع الضمان ومبلغه',
          en: 'Define the security deposit type and amount',
          ru: 'Укажите тип и сумму обеспечения',
        },
        fields: [
          {
            key: 'securityType',
            type: 'select',
            label: {
              he: 'סוג ביטחון',
              ar: 'نوع الضمان',
              en: 'Security Type',
              ru: 'Тип обеспечения',
            },
            required: true,
            width: 'full',
            options: [
              {
                value: 'promissory_note',
                label: {
                  he: 'שטר חוב + ערב',
                  ar: 'سند إذني + كفيل',
                  en: 'Promissory Note + Guarantor',
                  ru: 'Вексель + поручитель',
                },
              },
              {
                value: 'bank_guarantee',
                label: {
                  he: 'ערבות בנקאית / פיקדון כספי',
                  ar: 'ضمان بنكي / وديعة نقدية',
                  en: 'Bank Guarantee / Cash Deposit',
                  ru: 'Банковская гарантия / депозит',
                },
              },
            ],
          },
          {
            key: 'securityAmount',
            type: 'currency',
            label: {
              he: 'סכום הביטחון (₪)',
              ar: 'مبلغ الضمان (₪)',
              en: 'Security Amount (₪)',
              ru: 'Сумма обеспечения (₪)',
            },
            required: true,
            width: 'half',
          },
          {
            key: 'guarantorName',
            type: 'text',
            label: { he: 'שם הערב', ar: 'اسم الكفيل', en: 'Guarantor Name', ru: 'Имя поручителя' },
            required: false,
            width: 'half',
            condition: { field: 'securityType', operator: 'equals', value: 'promissory_note' },
          },
          {
            key: 'guarantorId',
            type: 'id-number',
            label: { he: 'ת.ז. הערב', ar: 'هوية الكفيل', en: 'Guarantor ID', ru: 'ID поручителя' },
            required: false,
            width: 'half',
            condition: { field: 'securityType', operator: 'equals', value: 'promissory_note' },
          },
        ],
      },
    ],
    sections: [
      // Section 1: Parties
      {
        title: {
          he: 'הצדדים לחוזה',
          ar: 'أطراف العقد',
          en: 'Parties to the Agreement',
          ru: 'Стороны договора',
        },
        body: {
          he: '<p>שנערך ונחתם ב-{{propertyCity}}</p><p><strong>בין</strong></p><p>{{landlordName}}, ת.ז. מס\' {{landlordId}}, מרחוב {{landlordAddress}} (להלן: "<strong>בעל הדירה</strong>") — מצד אחד</p><p><strong>לבין</strong></p><p>{{tenantName}}, ת.ז. מס\' {{tenantId}}, מרחוב {{tenantAddress}} (להלן: "<strong>השוכר</strong>") — מצד שני</p>',
          ar: '<p>تم تحريره وتوقيعه في {{propertyCity}}</p><p><strong>بين</strong></p><p>{{landlordName}}، هوية رقم {{landlordId}}، من {{landlordAddress}} (يُشار إليه فيما يلي: "<strong>المؤجر</strong>") — من جهة</p><p><strong>وبين</strong></p><p>{{tenantName}}، هوية رقم {{tenantId}}، من {{tenantAddress}} (يُشار إليه فيما يلي: "<strong>المستأجر</strong>") — من جهة أخرى</p>',
          en: '<p>Drawn and signed in {{propertyCity}}</p><p><strong>Between</strong></p><p>{{landlordName}}, ID No. {{landlordId}}, of {{landlordAddress}} (hereinafter: "<strong>the Landlord</strong>") — on one hand</p><p><strong>And</strong></p><p>{{tenantName}}, ID No. {{tenantId}}, of {{tenantAddress}} (hereinafter: "<strong>the Tenant</strong>") — on the other hand</p>',
          ru: '<p>Составлено и подписано в {{propertyCity}}</p><p><strong>Между</strong></p><p>{{landlordName}}, удостоверение личности {{landlordId}}, проживающий по адресу {{landlordAddress}} (далее: «<strong>Арендодатель</strong>») — с одной стороны</p><p><strong>И</strong></p><p>{{tenantName}}, удостоверение личности {{tenantId}}, проживающий по адресу {{tenantAddress}} (далее: «<strong>Арендатор</strong>») — с другой стороны</p>',
        },
        sortOrder: 1,
        parameters: [
          { placeholder: 'propertyCity', fieldKey: 'propertyCity', type: 'text' },
          { placeholder: 'landlordName', fieldKey: 'landlordName', type: 'text' },
          { placeholder: 'landlordId', fieldKey: 'landlordId', type: 'id-number' },
          { placeholder: 'landlordAddress', fieldKey: 'landlordAddress', type: 'text' },
          { placeholder: 'tenantName', fieldKey: 'tenantName', type: 'text' },
          { placeholder: 'tenantId', fieldKey: 'tenantId', type: 'id-number' },
          { placeholder: 'tenantAddress', fieldKey: 'tenantAddress', type: 'text' },
        ],
      },
      // Section 2: Preamble & Declarations
      {
        title: {
          he: 'מבוא והצהרות הצדדים',
          ar: 'المقدمة وإقرارات الأطراف',
          en: 'Preamble & Declarations',
          ru: 'Преамбула и заявления сторон',
        },
        body: {
          he: '<p>בעל הדירה הינו בעל הזכויות של דירה בת <strong>{{propertyRooms}}</strong> חדרים, ברחוב <strong>{{propertyAddress}}</strong> ב-{{propertyCity}} (להלן: "הדירה").</p><p>בעל הדירה מעוניין להשכיר את הדירה לשוכר, והשוכר מעוניין לשכור את הדירה מבעל הדירה בשכירות בלתי מוגנת.</p><h3>בעל הדירה מצהיר:</h3><ul><li>כי לא העניק לצד שלישי זכות חזקה נוגדת על הדירה וכי אין כל מניעה חוקית לשימוש בדירה לצרכי מגורים.</li><li>כי הדירה ראויה למגורים וכי הדירה נמסרת לשוכר כשהיא ריקה מכל אדם וחפץ, מלבד הפריטים המפורטים ברשימת התכולה.</li><li>כי לא ידוע לו על כוונה לפתוח בעבודות חיזוק לפי תמ"א 38 או בעבודות שיפוצים בבניין במהלך תקופת השכירות.</li></ul><h3>השוכר מצהיר:</h3><ul><li>כי קרא והבין את הוראות חוזה זה וכי ראה ובדק את מצבה הפיזי של הדירה ומצא אותה במצב תקין וראוי לשימוש.</li></ul>',
          ar: '<p>المؤجر هو صاحب حقوق الشقة المكونة من <strong>{{propertyRooms}}</strong> غرف، في شارع <strong>{{propertyAddress}}</strong> في {{propertyCity}} (يُشار إليها فيما يلي: "الشقة").</p><p>يرغب المؤجر في تأجير الشقة للمستأجر، ويرغب المستأجر في استئجارها بإيجار غير محمي.</p><h3>يُقر المؤجر:</h3><ul><li>أنه لم يمنح أي طرف ثالث حق حيازة معارض على الشقة وأنه لا يوجد مانع قانوني لاستخدام الشقة لأغراض السكن.</li><li>أن الشقة صالحة للسكن وتُسلم خالية من أي شخص أو متاع.</li><li>أنه لا يعلم بنية إجراء أعمال تعزيز أو تجديد في المبنى خلال فترة الإيجار.</li></ul><h3>يُقر المستأجر:</h3><ul><li>أنه قرأ وفهم أحكام هذا العقد وأنه فحص حالة الشقة ووجدها في حالة سليمة وصالحة للاستخدام.</li></ul>',
          en: '<p>The Landlord is the rights holder of an apartment of <strong>{{propertyRooms}}</strong> rooms, at <strong>{{propertyAddress}}</strong>, {{propertyCity}} (hereinafter: "the Apartment").</p><p>The Landlord wishes to lease the Apartment to the Tenant, and the Tenant wishes to rent it under an unprotected tenancy.</p><h3>The Landlord declares:</h3><ul><li>That no third party has been granted conflicting possession rights, and there is no legal impediment to using the Apartment for residential purposes.</li><li>That the Apartment is fit for habitation and is delivered vacant of any person or belongings, except items listed in the inventory.</li><li>That there is no known intention to commence TAMA 38 reinforcement or renovation works in the building during the lease period.</li></ul><h3>The Tenant declares:</h3><ul><li>That they have read and understood this agreement, inspected the physical condition of the Apartment, and found it in proper and usable condition.</li></ul>',
          ru: '<p>Арендодатель является правообладателем квартиры из <strong>{{propertyRooms}}</strong> комнат по адресу <strong>{{propertyAddress}}</strong>, {{propertyCity}} (далее: «Квартира»).</p><p>Арендодатель желает сдать Квартиру в аренду, а Арендатор — арендовать её на условиях незащищённой аренды.</p><h3>Арендодатель заявляет:</h3><ul><li>Что третьим лицам не было предоставлено право владения, и нет юридических препятствий для использования Квартиры в жилых целях.</li><li>Что Квартира пригодна для проживания и передаётся свободной от посторонних лиц и имущества.</li><li>Что ему не известно о планах проведения работ по укреплению или реконструкции здания в период аренды.</li></ul><h3>Арендатор заявляет:</h3><ul><li>Что он прочитал и понял условия настоящего договора, осмотрел Квартиру и нашёл её в надлежащем состоянии.</li></ul>',
        },
        sortOrder: 2,
        parameters: [
          { placeholder: 'propertyRooms', fieldKey: 'propertyRooms', type: 'number' },
          { placeholder: 'propertyAddress', fieldKey: 'propertyAddress', type: 'text' },
          { placeholder: 'propertyCity', fieldKey: 'propertyCity', type: 'text' },
        ],
      },
      // Section 3: Property Description
      {
        title: {
          he: 'תיאור הדירה',
          ar: 'وصف الشقة',
          en: 'Property Description',
          ru: 'Описание квартиры',
        },
        body: {
          he: '<p>הדירה נמצאת ברחוב <strong>{{propertyAddress}}</strong>, {{propertyCity}}, בת <strong>{{propertyRooms}}</strong> חדרים, קומה {{propertyFloor}}.</p><p><strong>הצמדות:</strong></p><ul><li>חניה: {{hasParking}}</li><li>מחסן: {{hasStorage}}</li><li>מרפסת: {{hasBalcony}}</li></ul>',
          ar: '<p>تقع الشقة في شارع <strong>{{propertyAddress}}</strong>، {{propertyCity}}، وتتكون من <strong>{{propertyRooms}}</strong> غرف، الطابق {{propertyFloor}}.</p><p><strong>المرافق:</strong></p><ul><li>موقف سيارات: {{hasParking}}</li><li>مخزن: {{hasStorage}}</li><li>شرفة: {{hasBalcony}}</li></ul>',
          en: '<p>The apartment is located at <strong>{{propertyAddress}}</strong>, {{propertyCity}}, comprising <strong>{{propertyRooms}}</strong> rooms, floor {{propertyFloor}}.</p><p><strong>Attachments:</strong></p><ul><li>Parking: {{hasParking}}</li><li>Storage: {{hasStorage}}</li><li>Balcony: {{hasBalcony}}</li></ul>',
          ru: '<p>Квартира расположена по адресу <strong>{{propertyAddress}}</strong>, {{propertyCity}}, состоит из <strong>{{propertyRooms}}</strong> комнат, этаж {{propertyFloor}}.</p><p><strong>Дополнения:</strong></p><ul><li>Парковка: {{hasParking}}</li><li>Кладовка: {{hasStorage}}</li><li>Балкон: {{hasBalcony}}</li></ul>',
        },
        sortOrder: 3,
        parameters: [
          { placeholder: 'propertyAddress', fieldKey: 'propertyAddress', type: 'text' },
          { placeholder: 'propertyCity', fieldKey: 'propertyCity', type: 'text' },
          { placeholder: 'propertyRooms', fieldKey: 'propertyRooms', type: 'number' },
          { placeholder: 'propertyFloor', fieldKey: 'propertyFloor', type: 'number' },
          { placeholder: 'hasParking', fieldKey: 'hasParking', type: 'checkbox' },
          { placeholder: 'hasStorage', fieldKey: 'hasStorage', type: 'checkbox' },
          { placeholder: 'hasBalcony', fieldKey: 'hasBalcony', type: 'checkbox' },
        ],
      },
      // Section 4: Purpose of Lease
      {
        title: { he: 'מטרת השכירות', ar: 'غرض الإيجار', en: 'Purpose of Lease', ru: 'Цель аренды' },
        body: {
          he: '<p>השוכר מתחייב כי בכל תקופת השכירות, השימוש אשר ייעשה בדירה (על כל חלקיה) יהיה <strong>למטרת מגורים בלבד</strong>.</p>',
          ar: '<p>يتعهد المستأجر بأن استخدام الشقة (بجميع أجزائها) خلال كامل فترة الإيجار سيكون <strong>لأغراض السكن فقط</strong>.</p>',
          en: '<p>The Tenant undertakes that throughout the lease period, the Apartment (and all its parts) shall be used <strong>for residential purposes only</strong>.</p>',
          ru: '<p>Арендатор обязуется, что в течение всего срока аренды Квартира (и все её части) будет использоваться <strong>исключительно для проживания</strong>.</p>',
        },
        sortOrder: 4,
        parameters: [],
      },
      // Section 5: Lease Period
      {
        title: { he: 'תקופת השכירות', ar: 'فترة الإيجار', en: 'Lease Period', ru: 'Срок аренды' },
        body: {
          he: '<p>תקופת השכירות בדירה תהיה בת <strong>{{leaseDurationMonths}}</strong> חודשים, כך שתחל ביום <strong>{{startDate}}</strong> ותסתיים ביום <strong>{{endDate}}</strong> (להלן: "תקופת השכירות").</p>',
          ar: '<p>فترة الإيجار هي <strong>{{leaseDurationMonths}}</strong> شهرًا، تبدأ في <strong>{{startDate}}</strong> وتنتهي في <strong>{{endDate}}</strong> (يُشار إليها فيما يلي: "فترة الإيجار").</p>',
          en: '<p>The lease period shall be <strong>{{leaseDurationMonths}}</strong> months, commencing on <strong>{{startDate}}</strong> and ending on <strong>{{endDate}}</strong> (hereinafter: "the Lease Period").</p>',
          ru: '<p>Срок аренды составляет <strong>{{leaseDurationMonths}}</strong> месяцев, начинается <strong>{{startDate}}</strong> и заканчивается <strong>{{endDate}}</strong> (далее: «Срок аренды»).</p>',
        },
        sortOrder: 5,
        parameters: [
          { placeholder: 'leaseDurationMonths', fieldKey: 'leaseDurationMonths', type: 'number' },
          { placeholder: 'startDate', fieldKey: 'startDate', type: 'date' },
          { placeholder: 'endDate', fieldKey: 'endDate', type: 'date' },
        ],
      },
      // Section 6: Rent
      {
        title: { he: 'דמי השכירות', ar: 'الإيجار الشهري', en: 'Rent', ru: 'Арендная плата' },
        body: {
          he: '<p>עבור שכירת הדירה ישלם השוכר לבעל הדירה דמי שכירות בסך <strong>₪{{monthlyRent}}</strong> לחודש. דמי השכירות ישולמו כל <strong>{{paymentDay}}</strong> לחודש.</p><p>השוכר ישלם את דמי השכירות עבור כל תקופת השכירות אף אם לא השתמש בדירה.</p>',
          ar: '<p>يدفع المستأجر للمؤجر إيجارًا شهريًا قدره <strong>₪{{monthlyRent}}</strong>. يُدفع الإيجار في اليوم <strong>{{paymentDay}}</strong> من كل شهر.</p><p>يدفع المستأجر الإيجار عن كامل فترة الإيجار حتى لو لم يستخدم الشقة.</p>',
          en: '<p>The Tenant shall pay the Landlord a monthly rent of <strong>₪{{monthlyRent}}</strong>. Rent is payable on the <strong>{{paymentDay}}</strong> of each month.</p><p>The Tenant shall pay rent for the entire lease period even if the Apartment is not used.</p>',
          ru: '<p>Арендатор обязуется выплачивать Арендодателю ежемесячную арендную плату в размере <strong>₪{{monthlyRent}}</strong>. Оплата производится <strong>{{paymentDay}}</strong>-го числа каждого месяца.</p><p>Арендатор обязан оплачивать аренду за весь срок, даже если Квартира не используется.</p>',
        },
        sortOrder: 6,
        parameters: [
          { placeholder: 'monthlyRent', fieldKey: 'monthlyRent', type: 'currency' },
          { placeholder: 'paymentDay', fieldKey: 'paymentDay', type: 'number' },
        ],
      },
      // Section 7: Option Period
      {
        title: {
          he: 'תקופת האופציה',
          ar: 'فترة الخيار',
          en: 'Option Period',
          ru: 'Период опциона',
        },
        body: {
          he: '<p>ניתנת בזאת לשוכר אופציה להאריך את תקופת השכירות לתקופה נוספת בת <strong>{{optionMonths}}</strong> חודשים.</p><p>בעל הדירה רשאי להודיע על התייקרות של עד <strong>{{maxRentIncrease}}%</strong> בדמי השכירות בתקופת האופציה, בהודעה בכתב לא יאוחר מ-60 ימים לפני תום תקופת השכירות.</p><p>מימוש האופציה כפוף לכך שהשוכר ישלח הודעה בכתב לא יאוחר מ-45 ימים לפני תום תקופת השכירות, ושלא ביצע הפרה יסודית של חוזה זה.</p><p>תקופת השכירות, לרבות תקופת האופציה, לא תעלה על 36 חודשים.</p>',
          ar: '<p>يُمنح المستأجر خيار تمديد فترة الإيجار لفترة إضافية مدتها <strong>{{optionMonths}}</strong> شهرًا.</p><p>يحق للمؤجر إبلاغ المستأجر بزيادة لا تتجاوز <strong>{{maxRentIncrease}}%</strong> في الإيجار خلال فترة الخيار، بإشعار خطي قبل 60 يومًا من انتهاء فترة الإيجار.</p><p>ممارسة الخيار مشروطة بإرسال المستأجر إشعارًا خطيًا قبل 45 يومًا من انتهاء فترة الإيجار، وعدم ارتكابه أي مخالفة جوهرية.</p>',
          en: '<p>The Tenant is hereby granted an option to extend the lease for an additional period of <strong>{{optionMonths}}</strong> months.</p><p>The Landlord may notify of a rent increase of up to <strong>{{maxRentIncrease}}%</strong> during the option period, by written notice no later than 60 days before the end of the lease period.</p><p>Exercise of the option is subject to the Tenant sending written notice no later than 45 days before the end of the lease period, and not having committed a fundamental breach of this agreement.</p><p>The total lease period, including the option, shall not exceed 36 months.</p>',
          ru: '<p>Арендатору предоставляется опцион на продление аренды на дополнительный период в <strong>{{optionMonths}}</strong> месяцев.</p><p>Арендодатель вправе уведомить о повышении арендной платы не более чем на <strong>{{maxRentIncrease}}%</strong> в период опциона, письменным уведомлением не позднее чем за 60 дней до окончания срока аренды.</p><p>Реализация опциона возможна при условии направления Арендатором письменного уведомления не позднее чем за 45 дней до окончания срока аренды и отсутствия существенных нарушений.</p>',
        },
        sortOrder: 7,
        parameters: [
          { placeholder: 'optionMonths', fieldKey: 'optionMonths', type: 'number' },
          { placeholder: 'maxRentIncrease', fieldKey: 'maxRentIncrease', type: 'number' },
        ],
        condition: { field: 'hasOption', operator: 'is_truthy' },
      },
      // Section 8: Payments & Utilities
      {
        title: {
          he: 'מיסים ותשלומים שוטפים',
          ar: 'الضرائب والمدفوعات الجارية',
          en: 'Taxes & Utilities',
          ru: 'Налоги и коммунальные платежи',
        },
        body: {
          he: '<p>בנוסף על דמי השכירות, השוכר מתחייב לשאת בכל התשלומים השוטפים הנובעים משימוש שוטף בדירה, הכוללים: חשמל, מים, גז, ארנונה וועד בית.</p><p>בתוך <strong>{{utilityTransferDays}}</strong> ימים ממועד חתימת חוזה זה, יעביר השוכר על שמו את חשבונות התשלומים השוטפים.</p><p>בעל הדירה רשאי, אחרי התראה בכתב של 14 ימים, לשלם במקום השוכר כל תשלום שוטף שלא שולם במועד. השוכר מתחייב להחזיר סכום זה תוך זמן סביר.</p><p>בעל הדירה ישא בתשלום כל המיסים, האגרות וההיטלים החלים על פי דין על בעלי דירות. תשלומים חריגים של ועד הבית לתחזוקת הבניין יחולו על בעל הדירה.</p>',
          ar: '<p>بالإضافة إلى الإيجار، يتعهد المستأجر بتحمل جميع المدفوعات الجارية الناتجة عن الاستخدام المعتاد للشقة، بما في ذلك: الكهرباء والمياه والغاز والأرنونا ولجنة البناء.</p><p>خلال <strong>{{utilityTransferDays}}</strong> يومًا من توقيع هذا العقد، ينقل المستأجر حسابات المرافق إلى اسمه.</p><p>يحق للمؤجر، بعد إنذار خطي مدته 14 يومًا، دفع أي مبلغ لم يدفعه المستأجر. يتعهد المستأجر برد المبلغ خلال فترة معقولة.</p><p>يتحمل المؤجر جميع الضرائب والرسوم المفروضة قانونًا على أصحاب العقارات.</p>',
          en: "<p>In addition to rent, the Tenant shall bear all recurring utility payments including: electricity, water, gas, municipal tax (arnona), and building maintenance (vaad bayit).</p><p>Within <strong>{{utilityTransferDays}}</strong> days of signing, the Tenant shall transfer all utility accounts to their name.</p><p>The Landlord may, after 14 days written notice, pay any overdue utility on the Tenant's behalf. The Tenant shall reimburse such amounts within a reasonable time.</p><p>The Landlord shall bear all taxes, levies, and fees imposed by law on property owners. Extraordinary building maintenance charges shall be borne by the Landlord.</p>",
          ru: '<p>Помимо арендной платы, Арендатор обязуется оплачивать все текущие коммунальные платежи: электричество, воду, газ, муниципальный налог (арнона) и домовой комитет.</p><p>В течение <strong>{{utilityTransferDays}}</strong> дней с момента подписания Арендатор переоформит коммунальные счета на своё имя.</p><p>Арендодатель вправе, после письменного уведомления за 14 дней, оплатить просроченные коммунальные платежи за Арендатора. Арендатор обязуется возместить эти суммы в разумный срок.</p><p>Арендодатель несёт все налоги и сборы, возложенные законом на собственников недвижимости.</p>',
        },
        sortOrder: 8,
        parameters: [
          { placeholder: 'utilityTransferDays', fieldKey: 'utilityTransferDays', type: 'number' },
        ],
      },
      // Section 9: Repairs & Maintenance
      {
        title: {
          he: 'תיקונים ושמירה על הדירה',
          ar: 'الإصلاحات وصيانة الشقة',
          en: 'Repairs & Maintenance',
          ru: 'Ремонт и содержание',
        },
        body: {
          he: '<p>השוכר מתחייב לשמור על הדירה במצב תקין, בכפוף לבלאי סביר.</p><p>בעל הדירה מתחייב לתקן כל קלקול שנגרם כתוצאה מבלאי סביר (מערכות חשמל, אינסטלציה, דוד מים, מזגנים, קירות, חלונות ודלתות) — לא יאוחר מ-<strong>30 ימים</strong> ממועד הודעת השוכר.</p><p>במקרה של תקלה דחופה שאינה מאפשרת מגורים סבירים — מתחייב בעל הדירה לתקנה תוך <strong>3 ימים</strong> לכל היותר.</p><p>השוכר מתחייב לתקן כל תקלה שנגרמה כתוצאה משימוש לא סביר או רשלני מצדו.</p>',
          ar: '<p>يتعهد المستأجر بالحفاظ على الشقة في حالة جيدة، مع مراعاة البلى المعقول.</p><p>يتعهد المؤجر بإصلاح أي عطل ناتج عن البلى المعقول (أنظمة الكهرباء والسباكة والسخان والمكيفات والجدران والنوافذ والأبواب) — خلال <strong>30 يومًا</strong> من إبلاغ المستأجر.</p><p>في حالة عطل عاجل يمنع السكن المعقول — يتعهد المؤجر بإصلاحه خلال <strong>3 أيام</strong> كحد أقصى.</p><p>يتعهد المستأجر بإصلاح أي عطل ناتج عن استخدام غير معقول أو إهمال من جانبه.</p>',
          en: '<p>The Tenant shall maintain the Apartment in proper condition, subject to reasonable wear and tear.</p><p>The Landlord shall repair any defect caused by reasonable wear and tear (electrical, plumbing, water heater, air conditioning, walls, windows, and doors) — within <strong>30 days</strong> of notification by the Tenant.</p><p>For urgent defects that prevent reasonable habitation — the Landlord shall repair them within <strong>3 days</strong> at most.</p><p>The Tenant shall repair any damage caused by unreasonable or negligent use.</p>',
          ru: '<p>Арендатор обязуется поддерживать Квартиру в надлежащем состоянии с учётом нормального износа.</p><p>Арендодатель обязуется устранять любые неисправности, вызванные нормальным износом (электрика, сантехника, бойлер, кондиционеры, стены, окна, двери) — в течение <strong>30 дней</strong> с момента уведомления Арендатором.</p><p>При срочных неисправностях, препятствующих нормальному проживанию — Арендодатель обязуется устранить их в течение <strong>3 дней</strong>.</p><p>Арендатор обязуется устранять любые повреждения, вызванные ненадлежащим или небрежным использованием.</p>',
        },
        sortOrder: 9,
        parameters: [],
      },
      // Section 10: Changes to Property
      {
        title: {
          he: 'שינויים בדירה',
          ar: 'تعديلات على الشقة',
          en: 'Modifications to the Apartment',
          ru: 'Изменения в квартире',
        },
        body: {
          he: '<p>השוכר מתחייב שלא לבצע כל שינוי פנימי או חיצוני בדירה, שלא להוסיף עליה כל תוספת, ושלא להרוס כל חלק מהדירה או ממתקניה — אלא באישור מראש ובכתב של בעל הדירה.</p><p>במקרה של שינוי ללא אישור, בעל הדירה רשאי לדרוש החזרת המצב לקדמותו על חשבון השוכר, או להותיר את השינויים כרכושו ללא תשלום.</p>',
          ar: '<p>يتعهد المستأجر بعدم إجراء أي تعديل داخلي أو خارجي على الشقة، وعدم إضافة أي إضافات، وعدم هدم أي جزء منها — إلا بموافقة مسبقة وخطية من المؤجر.</p><p>في حالة إجراء تعديل بدون إذن، يحق للمؤجر المطالبة بإعادة الحالة الأصلية على حساب المستأجر، أو الاحتفاظ بالتعديلات كملكية له دون دفع مقابل.</p>',
          en: "<p>The Tenant shall not make any internal or external changes, additions, or demolitions to the Apartment — unless with prior written consent of the Landlord.</p><p>If unauthorized changes are made, the Landlord may demand restoration at the Tenant's expense, or retain the modifications as their property without compensation.</p>",
          ru: '<p>Арендатор обязуется не производить никаких внутренних или внешних изменений, дополнений или сносов в Квартире — без предварительного письменного согласия Арендодателя.</p><p>В случае несанкционированных изменений Арендодатель вправе потребовать восстановления за счёт Арендатора или оставить изменения как свою собственность без компенсации.</p>',
        },
        sortOrder: 10,
        parameters: [],
      },
      // Section 11: Insurance
      {
        title: { he: 'ביטוח', ar: 'التأمين', en: 'Insurance', ru: 'Страхование' },
        body: {
          he: "<p>בעל הדירה יערוך וישא בעלויות פוליסת ביטוח למבנה הבניין וכל מערכותיו למשך כל תקופת השכירות. הפוליסה תכלול סעיף ויתור על זכות תחלוף (שיבוב) כלפי השוכר.</p><p>האחריות לעריכת ביטוח תכולה וצד ג' תחול על השוכר בלבד ולשיקול דעתו.</p>",
          ar: '<p>يقوم المؤجر بإعداد وتحمل تكاليف بوليصة تأمين لمبنى العمارة وأنظمته طوال فترة الإيجار. تتضمن البوليصة بند التنازل عن حق الحلول تجاه المستأجر.</p><p>مسؤولية تأمين المحتويات والطرف الثالث تقع على المستأجر وحده.</p>',
          en: '<p>The Landlord shall arrange and bear the costs of a building insurance policy covering the structure and all systems for the entire lease period. The policy shall include a waiver of subrogation against the Tenant.</p><p>Contents and third-party insurance shall be the sole responsibility of the Tenant.</p>',
          ru: '<p>Арендодатель обязуется оформить и оплатить страховой полис на здание и все его системы на весь срок аренды. Полис должен содержать отказ от права суброгации в отношении Арендатора.</p><p>Страхование содержимого и ответственности перед третьими лицами является обязанностью Арендатора.</p>',
        },
        sortOrder: 11,
        parameters: [],
      },
      // Section 12: Transfer of Rights
      {
        title: {
          he: 'העברת זכות השכירות',
          ar: 'نقل حق الإيجار',
          en: 'Transfer of Tenancy Rights',
          ru: 'Передача прав аренды',
        },
        body: {
          he: '<p>זכות השכירות של השוכר הינה אישית. השוכר מתחייב לא להעביר, לשעבד או למסור לאחר את זכויותיו לפי חוזה זה.</p><p>בכפוף להסכמת בעל הדירה מראש ובכתב, רשאי השוכר להעביר את זכות השכירות לשוכר חלופי אשר ייכנס לנעליו ויקבל על עצמו את כל ההתחייבויות. בעל הדירה רשאי לסרב מנימוקים סבירים.</p>',
          ar: '<p>حق الإيجار شخصي للمستأجر. يتعهد المستأجر بعدم نقل أو رهن أو تسليم حقوقه بموجب هذا العقد لأي شخص آخر.</p><p>بموافقة المؤجر المسبقة والخطية، يجوز للمستأجر نقل حق الإيجار لمستأجر بديل يحل محله ويتحمل جميع الالتزامات. يحق للمؤجر الرفض لأسباب معقولة.</p>',
          en: "<p>The Tenant's tenancy right is personal. The Tenant shall not transfer, pledge, or assign their rights under this agreement to any third party.</p><p>With prior written consent of the Landlord, the Tenant may transfer tenancy rights to a replacement tenant who shall assume all obligations. The Landlord may refuse for reasonable grounds.</p>",
          ru: '<p>Право аренды является личным. Арендатор обязуется не передавать, не закладывать и не уступать свои права по настоящему договору.</p><p>С предварительного письменного согласия Арендодателя Арендатор может передать право аренды замещающему арендатору, который принимает на себя все обязательства. Арендодатель вправе отказать по обоснованным причинам.</p>',
        },
        sortOrder: 12,
        parameters: [],
      },
      // Section 13: Return of Property
      {
        title: {
          he: 'החזרת הדירה',
          ar: 'إعادة الشقة',
          en: 'Return of the Apartment',
          ru: 'Возврат квартиры',
        },
        body: {
          he: '<p>בתום תקופת השכירות, יהיה השוכר חייב למסור לבעל הדירה את הדירה כשהיא פנויה מכל אדם וחפץ שאינו חלק מהתכולה, במצבה כפי שנמסרה, בכפוף לבלאי סביר.</p><p>במידה שהשוכר לא יפנה את הדירה במועד, יהיה חייב לשלם לבעל הדירה <strong>פיצוי מוסכם בסך פי-שלושה מדמי השכירות היומיים</strong> עבור כל יום עיכוב.</p>',
          ar: '<p>عند انتهاء فترة الإيجار، يلتزم المستأجر بتسليم الشقة خالية من أي شخص أو متاع غير مدرج في قائمة المحتويات، بالحالة التي تسلمها بها، مع مراعاة البلى المعقول.</p><p>إذا لم يُخلِ المستأجر الشقة في الموعد، يلتزم بدفع <strong>تعويض متفق عليه يساوي ثلاثة أضعاف الإيجار اليومي</strong> عن كل يوم تأخير.</p>',
          en: '<p>At the end of the lease period, the Tenant shall deliver the Apartment vacant and free of any person or belongings not part of the inventory, in its original condition subject to reasonable wear and tear.</p><p>If the Tenant fails to vacate on time, they shall pay the Landlord <strong>an agreed penalty of three times the daily rent</strong> for each day of delay.</p>',
          ru: '<p>По окончании срока аренды Арендатор обязуется передать Квартиру свободной от посторонних лиц и имущества, в первоначальном состоянии с учётом нормального износа.</p><p>В случае несвоевременного освобождения Арендатор обязуется выплатить <strong>согласованную неустойку в размере тройной дневной арендной платы</strong> за каждый день просрочки.</p>',
        },
        sortOrder: 13,
        parameters: [],
      },
      // Section 14: Breach of Contract
      {
        title: {
          he: 'הפרת החוזה',
          ar: 'مخالفة العقد',
          en: 'Breach of Contract',
          ru: 'Нарушение договора',
        },
        body: {
          he: '<p>הוראות חוק החוזים (תרופות בשל הפרת חוזה), תשל"א-1970 יחולו על חוזה זה.</p><p>ההפרות שלהלן יהוו הפרה יסודית:</p><ul><li>עיכוב של מעל ל-7 ימים בתשלום דמי השכירות במלואם.</li><li>אי פינוי הדירה בתום תקופת השכירות.</li></ul><p>במקרה של הפרה יסודית שלא תוקנה תוך 7 ימים מדרישה בכתב, תהיה לבעל הדירה זכות לבטל את החוזה ולדרוש פינוי מיידי של הדירה.</p>',
          ar: '<p>تسري أحكام قانون العقود (التعويضات عن مخالفة العقد) لعام 1970 على هذا العقد.</p><p>تُعتبر المخالفات التالية مخالفة جوهرية:</p><ul><li>تأخير أكثر من 7 أيام في دفع الإيجار كاملاً.</li><li>عدم إخلاء الشقة عند انتهاء فترة الإيجار.</li></ul><p>في حالة مخالفة جوهرية لم تُصحح خلال 7 أيام من الإنذار الخطي، يحق للمؤجر إلغاء العقد والمطالبة بإخلاء فوري.</p>',
          en: '<p>The provisions of the Contracts (Remedies for Breach) Law, 1970 shall apply to this agreement.</p><p>The following constitute a fundamental breach:</p><ul><li>Delay of more than 7 days in paying the full rent.</li><li>Failure to vacate the Apartment at the end of the lease period.</li></ul><p>In case of a fundamental breach not remedied within 7 days of written demand, the Landlord shall have the right to terminate the agreement and demand immediate vacating.</p>',
          ru: '<p>К настоящему договору применяются положения Закона о договорах (средства защиты при нарушении) 1970 года.</p><p>Следующие нарушения являются существенными:</p><ul><li>Задержка более 7 дней в оплате аренды в полном объёме.</li><li>Неосвобождение Квартиры по окончании срока аренды.</li></ul><p>В случае существенного нарушения, не устранённого в течение 7 дней после письменного требования, Арендодатель вправе расторгнуть договор и потребовать немедленного освобождения.</p>',
        },
        sortOrder: 14,
        parameters: [],
      },
      // Section 15: Security Deposit
      {
        title: { he: 'ביטחונות', ar: 'الضمانات', en: 'Security Deposit', ru: 'Обеспечение' },
        body: {
          he: '<p>השוכר מפקיד בידי בעל הדירה ביטחון בסך <strong>₪{{securityAmount}}</strong>.</p><p>בעל הדירה יהיה רשאי לעשות שימוש בביטחונות במקרה של הפרה יסודית, בכפוף להתראה של 14 ימים בכתב.</p><p>בעל הדירה ישיב לשוכר את הביטחונות לא יאוחר מ-30 ימים מתום תקופת השכירות, בכפוף להצגת אישורים על היעדר חובות.</p>',
          ar: '<p>يودع المستأجر لدى المؤجر ضمانًا بمبلغ <strong>₪{{securityAmount}}</strong>.</p><p>يحق للمؤجر استخدام الضمانات في حالة مخالفة جوهرية، بشرط إنذار خطي مدته 14 يومًا.</p><p>يُعيد المؤجر الضمانات خلال 30 يومًا من انتهاء فترة الإيجار، بشرط تقديم إثبات عدم وجود ديون.</p>',
          en: '<p>The Tenant shall deposit with the Landlord security in the amount of <strong>₪{{securityAmount}}</strong>.</p><p>The Landlord may use the security in case of a fundamental breach, subject to 14 days written notice.</p><p>The Landlord shall return the security within 30 days of the end of the lease period, subject to proof of no outstanding debts.</p>',
          ru: '<p>Арендатор вносит обеспечение в размере <strong>₪{{securityAmount}}</strong>.</p><p>Арендодатель вправе использовать обеспечение в случае существенного нарушения, при условии письменного уведомления за 14 дней.</p><p>Арендодатель обязуется вернуть обеспечение в течение 30 дней после окончания срока аренды при отсутствии задолженностей.</p>',
        },
        sortOrder: 15,
        parameters: [
          { placeholder: 'securityAmount', fieldKey: 'securityAmount', type: 'currency' },
        ],
      },
      // Section 16: Non-Applicability of Tenant Protection
      {
        title: {
          he: 'אי-תחולת דיני הגנת הדייר',
          ar: 'عدم سريان قانون حماية المستأجر',
          en: 'Non-Applicability of Tenant Protection',
          ru: 'Неприменимость закона о защите арендаторов',
        },
        body: {
          he: '<p>השוכר מצהיר כי ידוע לו שהדירה הינה בגדר דירה פנויה ולכן לא יחולו על שכירות זו הוראות חוק הגנת הדייר (נוסח משולב) תשל"ב-1972.</p><p>השוכר מצהיר כי לא שילם דמי מפתח או כל תמורה אחרת בגין השכירות, ולא יהיה זכאי לדמי מפתח לצורך פינוי הדירה.</p>',
          ar: '<p>يُقر المستأجر بعلمه أن الشقة خالية وبالتالي لا تسري أحكام قانون حماية المستأجر لعام 1972.</p><p>يُقر المستأجر بأنه لم يدفع أي رسوم مفتاح أو أي مقابل آخر مقابل الإيجار، ولن يكون مستحقًا لأي تعويض عند الإخلاء.</p>',
          en: '<p>The Tenant acknowledges that the Apartment is a vacant property and therefore the Tenant Protection Law (Consolidated Version), 1972 shall not apply to this tenancy.</p><p>The Tenant declares that no key money or other consideration was paid for this tenancy, and they shall not be entitled to key money upon vacating.</p>',
          ru: '<p>Арендатор подтверждает, что Квартира является свободной, и положения Закона о защите арендаторов 1972 года не применяются к данной аренде.</p><p>Арендатор заявляет, что не уплачивал ключевых денег или иного вознаграждения за аренду и не имеет права на ключевые деньги при освобождении.</p>',
        },
        sortOrder: 16,
        parameters: [],
      },
      // Section 17: General Provisions
      {
        title: {
          he: 'הוראות כלליות',
          ar: 'أحكام عامة',
          en: 'General Provisions',
          ru: 'Общие положения',
        },
        body: {
          he: '<p>בעל הדירה רשאי למכור את זכויותיו בדירה ללא הסכמת השוכר, בתנאי שתישמרנה כל זכויות השוכר. על המכירה יודיע בעל הדירה בכתב לשוכר.</p><p>השוכר יאפשר לבעל הדירה, בתיאום מראש ובתדירות סבירה, להיכנס אל הדירה לבדיקת מצבה, לביצוע תיקונים ולהצגתה לרוכשים או שוכרים פוטנציאליים.</p><p>חוזה זה משקף במלואו את ההסכמות בין הצדדים. כל שינוי לחוזה יהיה בר תוקף רק אם נעשה בכתב ונחתם על ידי שני הצדדים.</p><p>כותרות סעיפי חוזה זה הוספו למען הנוחות בלבד ואין לתת להן משמעות פרשנית.</p>',
          ar: '<p>يحق للمؤجر بيع حقوقه في الشقة دون موافقة المستأجر، بشرط الحفاظ على جميع حقوق المستأجر. يُبلغ المؤجر المستأجر خطيًا بأي عملية بيع.</p><p>يسمح المستأجر للمؤجر، بالتنسيق المسبق وبتكرار معقول، بدخول الشقة لفحص حالتها وإجراء الإصلاحات وعرضها على مشترين أو مستأجرين محتملين.</p><p>يُمثل هذا العقد كامل الاتفاق بين الطرفين. أي تعديل يكون ساريًا فقط إذا تم كتابيًا ووقعه الطرفان.</p>',
          en: "<p>The Landlord may sell their rights in the Apartment without the Tenant's consent, provided all Tenant rights are preserved. The Landlord shall notify the Tenant in writing of any sale.</p><p>The Tenant shall allow the Landlord, with prior coordination and reasonable frequency, to enter the Apartment for inspection, repairs, and showing to potential buyers or tenants.</p><p>This agreement constitutes the entire agreement between the parties. Any amendment shall be valid only if made in writing and signed by both parties.</p><p>The headings of sections in this agreement are for convenience only and shall not be given interpretive significance.</p>",
          ru: '<p>Арендодатель вправе продать свои права на Квартиру без согласия Арендатора при сохранении всех прав Арендатора. О продаже Арендодатель обязан уведомить Арендатора письменно.</p><p>Арендатор обязуется предоставлять Арендодателю доступ в Квартиру по предварительной договорённости для осмотра, ремонта и показа потенциальным покупателям или арендаторам.</p><p>Настоящий договор представляет собой полное соглашение сторон. Любые изменения действительны только в письменной форме, подписанной обеими сторонами.</p>',
        },
        sortOrder: 17,
        parameters: [],
      },
      // Section 18: Signatures
      {
        title: { he: 'חתימות', ar: 'التوقيعات', en: 'Signatures', ru: 'Подписи' },
        body: {
          he: '<p>ולראיה באו הצדדים על החתום:</p><div class="signature-block"><div class="signature-party"><p><strong>בעל הדירה:</strong> {{landlordName}}</p><span class="signature-line"></span><span class="signature-label">חתימה</span></div><div class="signature-party"><p><strong>השוכר:</strong> {{tenantName}}</p><span class="signature-line"></span><span class="signature-label">חתימה</span></div></div>',
          ar: '<p>وإثباتًا لما تقدم، وقّع الطرفان:</p><div class="signature-block"><div class="signature-party"><p><strong>المؤجر:</strong> {{landlordName}}</p><span class="signature-line"></span><span class="signature-label">التوقيع</span></div><div class="signature-party"><p><strong>المستأجر:</strong> {{tenantName}}</p><span class="signature-line"></span><span class="signature-label">التوقيع</span></div></div>',
          en: '<p>In witness whereof, the parties have signed:</p><div class="signature-block"><div class="signature-party"><p><strong>Landlord:</strong> {{landlordName}}</p><span class="signature-line"></span><span class="signature-label">Signature</span></div><div class="signature-party"><p><strong>Tenant:</strong> {{tenantName}}</p><span class="signature-line"></span><span class="signature-label">Signature</span></div></div>',
          ru: '<p>В подтверждение вышеизложенного стороны подписали:</p><div class="signature-block"><div class="signature-party"><p><strong>Арендодатель:</strong> {{landlordName}}</p><span class="signature-line"></span><span class="signature-label">Подпись</span></div><div class="signature-party"><p><strong>Арендатор:</strong> {{tenantName}}</p><span class="signature-line"></span><span class="signature-label">Подпись</span></div></div>',
        },
        sortOrder: 18,
        parameters: [
          { placeholder: 'landlordName', fieldKey: 'landlordName', type: 'text' },
          { placeholder: 'tenantName', fieldKey: 'tenantName', type: 'text' },
        ],
      },
    ],
  };

  // Upsert residential lease template (update definition if it already exists)
  const template = await prisma.template.upsert({
    where: { slug: 'residential-lease' },
    update: {
      definition: JSON.parse(JSON.stringify(leaseDefinition)),
    },
    create: {
      slug: 'residential-lease',
      nameHe: 'חוזה שכירות למגורים',
      nameAr: 'عقد إيجار سكني',
      nameEn: 'Residential Lease Agreement',
      nameRu: 'Договор аренды жилья',
      descHe: 'חוזה שכירות סטנדרטי למגורים בהתאם לחוק השכירות ההוגנת',
      descAr: 'عقد إيجار سكني قياسي وفقاً لقانون الإيجار العادل',
      descEn: 'Standard residential lease agreement compliant with Fair Rent Law',
      descRu: 'Стандартный договор аренды жилья в соответствии с законом о справедливой аренде',
      categoryId: rental.id,
      definition: JSON.parse(JSON.stringify(leaseDefinition)),
    },
  });
  console.log('Seeded/updated template:', template.slug);

  // Seed new contracts from seed-contracts.ts
  for (const contract of seedContracts) {
    const existing = await prisma.template.findUnique({
      where: { slug: contract.slug },
    });

    if (!existing) {
      await prisma.template.create({
        data: {
          slug: contract.slug,
          nameHe: contract.nameHe,
          nameAr: contract.nameAr,
          nameEn: contract.nameEn,
          nameRu: contract.nameRu,
          descHe: contract.descHe,
          descAr: contract.descAr,
          descEn: contract.descEn,
          descRu: contract.descRu,
          categoryId: categoryMap[contract.categorySlug as keyof typeof categoryMap],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          definition: contract.definition as any,
        },
      });
      console.log('Seeded template:', contract.slug);
    } else {
      console.log('Template already exists:', existing.slug);
    }
  }

  // Seed pricing plans (PAYM)
  const plans = [
    {
      slug: 'free',
      nameHe: 'חינם',
      nameAr: 'مجاني',
      nameEn: 'Free',
      nameRu: 'Бесплатный',
      priceIls: 0,
      features: ['3 documents/month', 'Basic templates', 'PDF download'],
      sortOrder: 1,
    },
    {
      slug: 'professional',
      nameHe: 'מקצועי',
      nameAr: 'احترافي',
      nameEn: 'Professional',
      nameRu: 'Профессиональный',
      priceIls: 9900, // 99 NIS
      features: ['Unlimited documents', 'All templates', 'E-signatures', 'Priority support'],
      sortOrder: 2,
    },
    {
      slug: 'enterprise',
      nameHe: 'ארגוני',
      nameAr: 'مؤسسي',
      nameEn: 'Enterprise',
      nameRu: 'Корпоративный',
      priceIls: 29900, // 299 NIS
      features: [
        'Everything in Professional',
        'AI Import',
        'ITA Invoicing',
        'Custom branding',
        'API access',
      ],
      sortOrder: 3,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {},
      create: plan,
    });
  }
  console.log('Seeded pricing plans');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
