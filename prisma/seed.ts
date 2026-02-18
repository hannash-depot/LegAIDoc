import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

const CATEGORIES = [
  {
    slug: "rental",
    name: {
      he: "שכירות",
      ar: "إيجار",
      en: "Rental",
      ru: "Аренда",
    },
    description: {
      he: "חוזי שכירות למגורים ומסחר",
      ar: "عقود إيجار سكنية وتجارية",
      en: "Residential and commercial rental agreements",
      ru: "Договоры аренды жилья и коммерческих помещений",
    },
    icon: "home",
    sortOrder: 1,
  },
  {
    slug: "employment",
    name: {
      he: "עבודה",
      ar: "عمل",
      en: "Employment",
      ru: "Трудоустройство",
    },
    description: {
      he: "חוזי עבודה, סודיות וקבלנות",
      ar: "عقود عمل وسرية ومقاولات",
      en: "Employment contracts, NDAs, and freelancer agreements",
      ru: "Трудовые договоры, NDA и договоры подряда",
    },
    icon: "briefcase",
    sortOrder: 2,
  },
  {
    slug: "business",
    name: {
      he: "עסקים",
      ar: "أعمال",
      en: "Business",
      ru: "Бизнес",
    },
    description: {
      he: "חוזי שותפות, שירותים ומכירה",
      ar: "عقود شراكة وخدمات ومبيعات",
      en: "Partnership, service, and sales agreements",
      ru: "Договоры партнёрства, услуг и купли-продажи",
    },
    icon: "building",
    sortOrder: 3,
  },
];

async function main() {
  console.log("Seeding database...");

  // Create categories
  for (const cat of CATEGORIES) {
    await prisma.templateCategory.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
      },
      create: cat,
    });
    console.log(`  Category: ${cat.slug}`);
  }

  // Load and create templates
  const templatesDir = path.join(process.cwd(), "templates");
  const categories = fs.readdirSync(templatesDir);

  let templateOrder = 0;

  for (const categoryDir of categories) {
    const categoryPath = path.join(templatesDir, categoryDir);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const files = fs
      .readdirSync(categoryPath)
      .filter((f) => f.endsWith(".json"));

    for (const file of files) {
      const filePath = path.join(categoryPath, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const template = JSON.parse(content);

      const category = await prisma.templateCategory.findUnique({
        where: { slug: template.category },
      });

      if (!category) {
        console.warn(`  Warning: Category ${template.category} not found for ${file}`);
        continue;
      }

      templateOrder++;

      await prisma.contractTemplate.upsert({
        where: { slug: template.slug },
        update: {
          name: template.name,
          description: template.description,
          definition: template.definition,
          version: template.version,
          sortOrder: templateOrder,
        },
        create: {
          categoryId: category.id,
          slug: template.slug,
          name: template.name,
          description: template.description,
          definition: template.definition,
          version: template.version,
          sortOrder: templateOrder,
          isActive: true,
        },
      });

      console.log(`  Template: ${template.slug}`);
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
