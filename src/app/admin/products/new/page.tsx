import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  let categories: { id: string; name: string }[] = [];
  let failed = false;
  try {
    categories = await prisma.category.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } });
  } catch {
    failed = true;
  }
  return <main className="admin-products-page"><div className="admin-products-heading"><div><span className="section-kicker">إدارة الكتالوج</span><h1>إضافة منتج</h1><p>أدخل بيانات المنتج ومخزونه.</p></div><Link className="button-secondary" href="/admin/products">العودة للقائمة</Link></div>{failed ? <section className="products-state products-state-error"><h2>تعذر تحميل التصنيفات</h2><p>تحقق من اتصال قاعدة البيانات وحاول مرة أخرى.</p></section> : categories.length === 0 ? <section className="products-state"><h2>لا توجد تصنيفات نشطة</h2><p>أضف تصنيفًا وفعّله قبل إنشاء المنتجات.</p></section> : <ProductForm categories={categories} />}</main>;
}
