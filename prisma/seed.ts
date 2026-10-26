import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const parentCategories = [
  { name: "أجهزة الكمبيوتر واللابتوبات", slug: "computers-laptops", sortOrder: 1 },
  { name: "قطع الكمبيوتر", slug: "computer-components", sortOrder: 2 },
  { name: "التخزين", slug: "storage", sortOrder: 3 },
  { name: "الشاشات", slug: "monitors", sortOrder: 4 },
  { name: "الشبكات والإنترنت", slug: "networking", sortOrder: 5 },
  { name: "الإكسسوارات", slug: "accessories", sortOrder: 6 },
  { name: "الطابعات والماسحات", slug: "printers-scanners", sortOrder: 7 },
  { name: "الطاقة والحماية", slug: "power-ups", sortOrder: 8 },
] as const;

const childCategories = [
  { name: "لابتوبات", slug: "laptops", parentSlug: "computers-laptops", sortOrder: 1 },
  { name: "أجهزة كمبيوتر مكتبية", slug: "desktop-computers", parentSlug: "computers-laptops", sortOrder: 2 },

  { name: "المعالجات", slug: "processors", parentSlug: "computer-components", sortOrder: 1 },
  { name: "بطاقات الرسوميات", slug: "graphics-cards", parentSlug: "computer-components", sortOrder: 2 },
  { name: "اللوحات الأم", slug: "motherboards", parentSlug: "computer-components", sortOrder: 3 },
  { name: "ذاكرة RAM", slug: "ram", parentSlug: "computer-components", sortOrder: 4 },

  { name: "أقراص SSD", slug: "ssds", parentSlug: "storage", sortOrder: 1 },
  { name: "الأقراص الصلبة", slug: "hard-drives", parentSlug: "storage", sortOrder: 2 },
  { name: "وحدات التخزين الخارجية", slug: "external-storage", parentSlug: "storage", sortOrder: 3 },

  { name: "شاشات الألعاب", slug: "gaming-monitors", parentSlug: "monitors", sortOrder: 1 },

  { name: "أجهزة الراوتر", slug: "routers", parentSlug: "networking", sortOrder: 1 },
  { name: "أجهزة MikroTik", slug: "mikrotik", parentSlug: "networking", sortOrder: 2 },
  { name: "محولات الشبكة", slug: "network-switches", parentSlug: "networking", sortOrder: 3 },

  { name: "لوحات المفاتيح والفأرات", slug: "keyboards-mice", parentSlug: "accessories", sortOrder: 1 },
  { name: "سماعات الرأس", slug: "headsets", parentSlug: "accessories", sortOrder: 2 },
  { name: "الكابلات والمحولات", slug: "cables-adapters", parentSlug: "accessories", sortOrder: 3 },

  { name: "الطابعات", slug: "printers", parentSlug: "printers-scanners", sortOrder: 1 },
  { name: "الماسحات الضوئية", slug: "scanners", parentSlug: "printers-scanners", sortOrder: 2 },

  { name: "أجهزة UPS", slug: "ups", parentSlug: "power-ups", sortOrder: 1 },
] as const;

async function main() {
  const parentIds = new Map<string, string>();

  for (const category of parentCategories) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        sortOrder: category.sortOrder,
        isActive: true,
        parentId: null,
      },
      create: {
        name: category.name,
        slug: category.slug,
        sortOrder: category.sortOrder,
        isActive: true,
      },
    });

    parentIds.set(category.slug, saved.id);
  }

  for (const category of childCategories) {
    const parentId = parentIds.get(category.parentSlug);

    if (!parentId) {
      throw new Error(`Parent category not found: ${category.parentSlug}`);
    }

    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        sortOrder: category.sortOrder,
        parentId,
        isActive: true,
      },
      create: {
        name: category.name,
        slug: category.slug,
        sortOrder: category.sortOrder,
        parentId,
        isActive: true,
      },
    });
  }

  await prisma.storeSettings.upsert({
    where: { id: "default" },
    update: {
      storeName: "مدار تك",
      storeNameEnglish: "MADAR TECH",
      primaryColor: "#0284C7",
      secondaryColor: "#38BDF8",
      backgroundColor: "#F8FAFC",
      textColor: "#0F172A",
      currency: "YER",
      pickupEnabled: true,
      deliveryEnabled: false,
    },
    create: {
      id: "default",
      storeName: "مدار تك",
      storeNameEnglish: "MADAR TECH",
      primaryColor: "#0284C7",
      secondaryColor: "#38BDF8",
      backgroundColor: "#F8FAFC",
      textColor: "#0F172A",
      currency: "YER",
      pickupEnabled: true,
      deliveryEnabled: false,
    },
  });

  const totalCategories = await prisma.category.count();
  const topLevelCategories = await prisma.category.count({
    where: { parentId: null },
  });
  const childCount = await prisma.category.count({
    where: { parentId: { not: null } },
  });
  const settingsCount = await prisma.storeSettings.count();

  console.log("Seed completed successfully.");
  console.log(`Total categories in database: ${totalCategories}`);
  console.log(`Top-level categories: ${topLevelCategories}`);
  console.log(`Child categories: ${childCount}`);
  console.log(`Store settings records: ${settingsCount}`);
  console.log("No products were created.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });