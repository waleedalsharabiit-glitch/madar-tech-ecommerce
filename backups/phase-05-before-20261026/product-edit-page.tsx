import Link from "next/link";
import { notFound } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { ProductForm, ProductFormValues } from "@/components/admin/product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let product: Prisma.ProductGetPayload<{ include: { images: { select: { id: true } } } }> | null = null;
  let activeCategories: { id: string; name: string }[] = [];
  let loadError = false;
  try {
    const result = await Promise.all([
      prisma.product.findUnique({ where: { id }, include: { images: { select: { id: true } } } }),
      prisma.category.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
    ]);
    product = result[0];
    activeCategories = result[1];
  } catch {
    loadError = true;
  }

  if (loadError) return <main className="admin-products-page"><section className="products-state products-state-error"><h2>تعذر تحميل المنتج</h2><p>تحقق من اتصال قاعدة البيانات ثم أعد المحاولة.</p><Link href="/admin/products">عودة إلى المنتجات</Link></section></main>;
  if (!product) notFound();
  const categories = activeCategories.some((category) => category.id === product.categoryId)
    ? activeCategories
    : [...activeCategories, { id: product.categoryId, name: "التصنيف الحالي (غير نشط)" }];
  const formProduct: ProductFormValues = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    description: product.description,
    price: product.price.toString(),
    compareAtPrice: product.compareAtPrice?.toString() ?? null,
    stockQuantity: product.stockQuantity,
    status: product.status,
    isFeatured: product.isFeatured,
    categoryId: product.categoryId,
    imageCount: product.images.length,
  };
  return <main className="admin-products-page"><div className="admin-products-heading"><div><span className="section-kicker">إدارة الكتالوج</span><h1>تعديل المنتج</h1><p>حدّث بيانات المنتج أو حالته أو كمية مخزونه.</p></div><Link className="button-secondary" href="/admin/products">العودة للقائمة</Link></div><ProductForm product={formProduct} categories={categories} /></main>;
}
