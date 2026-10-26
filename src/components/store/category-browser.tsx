import Image from "next/image";
import Link from "next/link";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export async function CategoryBrowser() {
  let categories: Prisma.CategoryGetPayload<{ include: { _count: { select: { products: true } } } }>[] = [];
  let failed = false;
  try {
    categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: { where: { status: { in: ["ACTIVE", "OUT_OF_STOCK"] } } } } } },
    });
  } catch {
    failed = true;
  }
  return <main className="store-catalog-page">
    <nav className="store-breadcrumbs" aria-label="مسار التنقل"><Link href="/">الرئيسية</Link><span>/</span><span aria-current="page">التصنيفات</span></nav>
    <header className="store-catalog-heading"><div><span className="store-catalog-kicker">MADAR TECH / الأقسام</span><h1>تصفّح حسب التصنيف</h1><p>أقسام واضحة لتصل بسرعة إلى المنتجات التي تبحث عنها.</p></div></header>
    {failed ? <section className="store-catalog-empty" role="alert"><span>!</span><h2>تعذر تحميل التصنيفات</h2><p>تحقق من الاتصال ثم حاول مرة أخرى.</p></section> : categories.length === 0 ? <section className="store-catalog-empty"><span>⌁</span><h2>التصنيفات قيد التجهيز</h2><p>ستظهر الأقسام هنا عند تفعيلها في المتجر.</p></section> : <div className="store-category-grid">{categories.map((category, index) => <Link className="store-category-card" href={`/categories/${category.slug}`} key={category.id}>
      <div className="store-category-art">{category.imageUrl ? <Image src={category.imageUrl} alt="" fill sizes="(max-width: 640px) 90vw, 360px" unoptimized /> : <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>}</div>
      <div className="store-category-card-copy"><div><h2>{category.name}</h2><p>{category.description || "اكتشف المنتجات المتاحة ضمن هذا القسم."}</p></div><span>{category._count.products} منتج</span></div>
    </Link>)}</div>}
  </main>;
}
