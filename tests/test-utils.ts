import 'dotenv/config';
import { hashSync } from 'bcryptjs';
import { db } from '../src/lib/db';

async function safeDeleteMany(model: {
  deleteMany: (args: Record<string, never>) => Promise<unknown>;
}) {
  try {
    await model.deleteMany({});
  } catch {
    // Table may not exist if migrations are not fully applied
  }
}

export async function clearDbData() {
  await safeDeleteMany(db.signatureRecord);
  await safeDeleteMany(db.signatory);
  await db.documentComment.deleteMany({});
  await db.documentShare.deleteMany({});
  await db.document.deleteMany({});
  await safeDeleteMany(db.templateSnapshot);
  await db.template.deleteMany({});
  await db.category.deleteMany({});
  await db.invoice.deleteMany({});
  await db.payment.deleteMany({});
  await db.subscription.deleteMany({});
  await db.plan.deleteMany({});
  await safeDeleteMany(db.processedWebhookEvent);
  await safeDeleteMany(db.importedContract);
  await safeDeleteMany(db.notification);
  await safeDeleteMany(db.auditLog);
  await safeDeleteMany(db.verificationToken);
  await safeDeleteMany(db.account);
  await safeDeleteMany(db.session);
  await safeDeleteMany(db.siteSetting);
  await safeDeleteMany(db.llmSetting);
  await db.user.deleteMany({});
}

export async function seedTestUser() {
  return db.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test Customer',
      role: 'USER',
    },
  });
}

export async function seedTestUserWithPassword(password: string = 'Test1234') {
  return db.user.create({
    data: {
      email: 'testpwd@example.com',
      name: 'Test User',
      role: 'USER',
      hashedPassword: hashSync(password, 12),
    },
  });
}

export async function seedTestAdmin(password: string = 'Admin1234') {
  return db.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Test Admin',
      role: 'ADMIN',
      hashedPassword: hashSync(password, 12),
    },
  });
}

export async function seedCategory(overrides: Record<string, unknown> = {}) {
  return db.category.create({
    data: {
      slug: 'test-category',
      nameHe: 'קטגוריה',
      nameAr: 'فئة',
      nameEn: 'Test Category',
      nameRu: 'Категория',
      ...overrides,
    },
  });
}

export async function seedTemplate(categoryId: string, overrides: Record<string, unknown> = {}) {
  return db.template.create({
    data: {
      slug: 'test-template',
      nameHe: 'תבנית',
      nameAr: 'قالب',
      nameEn: 'Test Template',
      nameRu: 'Шаблон',
      categoryId,
      definition: {
        version: 1,
        steps: [
          {
            key: 'step1',
            title: { he: 'שלב 1', ar: 'خطوة 1', en: 'Step 1', ru: 'Шаг 1' },
            fields: [
              {
                key: 'party_name',
                type: 'text',
                label: { he: 'שם', ar: 'اسم', en: 'Name', ru: 'Имя' },
                required: true,
              },
            ],
          },
        ],
        documentBody: {
          he: '<p>חוזה עבור {{party_name}}</p>',
          ar: '<p>عقد ل{{party_name}}</p>',
          en: '<p>Contract for {{party_name}}</p>',
          ru: '<p>Контракт для {{party_name}}</p>',
        },
      },
      ...overrides,
    },
  });
}

export async function seedDocument(
  userId: string,
  templateId: string,
  overrides: Record<string, unknown> = {},
) {
  return db.document.create({
    data: {
      title: 'Test Document',
      userId,
      templateId,
      templateVersion: 1,
      wizardData: { party_name: 'John Doe' },
      renderedBody: '<p>Contract for John Doe</p>',
      status: 'DRAFT',
      locale: 'en',
      ...overrides,
    },
  });
}

export async function seedPlan(overrides: Record<string, unknown> = {}) {
  return db.plan.create({
    data: {
      slug: 'test-plan',
      nameHe: 'תוכנית',
      nameAr: 'خطة',
      nameEn: 'Test Plan',
      nameRu: 'План',
      priceIls: 4900,
      features: ['basic'],
      ...overrides,
    },
  });
}
