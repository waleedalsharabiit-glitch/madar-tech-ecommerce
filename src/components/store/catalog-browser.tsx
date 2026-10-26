import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { buildCatalogQuery, catalogPageHref, type CatalogParams } from "@/lib/store/catalog";

type Props = { mode: "products" | "search" | "category"; searchParams: Promise<CatalogParams>; categorySlug?: string };
type CatalogProduct = Prisma.ProductGetPayload<{ include: { category: { select: { name: true; slug: true } }; images: { orderBy: { sortOrder: "asc" }; take: 1; select: { imageUrl: true; altText: true } } } }>;

function money(value: Prisma.Decimal) {
  return `${value.toFixed(2)} ر.ي`;
}

function ProductGrid({ products }: { products: CatalogProduct[] }) {
  return <div className="store-product-grid">{products.map((product) => <Link className="store-product-card" href={`/products/${product.slug}`} key={product.id}>
    <div className="store-product-image">{product.images[0] ? <Image src={product.images[0].imageUrl} alt={product.images[0].altText || product.name} fill sizes="(max-width: 600px) 45vw, (max-width: 950px) 30vw, 250px" unoptimized /> : <span aria-hidden="true">▱</span>}
      {product.isFeatured && <span className="store-product-badge">مميز</span>}{product.stockQuantity <= 0 && <span className="store-product-stockout">نفد المخزون</span>}
    </div>
    <div className="store-product-card-content"><span className="store-product-category">{product.category.name}</span><h2>{product.name}</h2><div className="store-product-price"><strong>{money(product.price)}</strong>{product.compareAtPrice && <del>{money(product.compareAtPrice)}</del>}</div></div>
  </Link>)}</div>;
}

function CatalogFilters({ path, q, minPrice, maxPrice, sort, inStock }: { path: string; q: string; minPrice: string; maxPrice: string; sort: string; inStock: boolean }) {
  return <form className="store-catalog-filters" action={path} method="get">
    <label className="catalog-search-field">بحث<input name="q" type="search" defaultValue={q} placeholder="اسم المنتج أو SKU" maxLength={100} /></label>
    <label>السعر من<input name="minPrice" inputMode="decimal" type="number" min="0" step="0.01" defaultValue={minPrice} placeholder="0" /></label>
    <label>إلى<input name="maxPrice" inputMode="decimal" type="number" min="0" step="0.01" defaultValue={maxPrice} placeholder="بدون حد" /></label>
    <label>الترتيب<select name="sort" defaultValue={sort}><option value="newest">الأحدث</option><option value="price-asc">السعر: الأقل أولًا</option><option value="price-desc">السعر: الأعلى أولًا</option><option value="name">الاسم</option></select></label>
    <label className="catalog-stock-filter"><input type="checkbox" name="inStock" value="1" defaultChecked={inStock} /> متوفر فقط</label>
    <div className="catalog-filter-actions"><button type="submit">تطبيق الفلاتر</button><Link href={path === "/search" ? `/search${q ? `?q=${encodeURIComponent(q)}` : ""}` : path}>مسح</Link></div>
  </form>;
}

export async function CatalogBrowser({ mode, searchParams, categorySlug }: Props) {
  const params = await searchParams;
  const options = buildCatalogQuery(params, categorySlug);
  const pageSize = 12;
  let products: CatalogProduct[] = [];
  let total = 0;
  let page = 1;
  let pageCount = 1;
  let categoryName = "";
  let failed = false;
  let categoryMissing = false;
  try {
    if (mode === "category" && categorySlug) {
      const category = await prisma.category.findFirst({ where: { slug: categorySlug, isActive: true }, select: { name: true } });
      if (!category) categoryMissing = true;
      else categoryName = category.name;
    }
    if (categoryMissing) notFound();
    total = await prisma.product.count({ where: options.where });
    pageCount = Math.max(1, Math.ceil(total / pageSize));
    page = Math.min(options.requestedPage, pageCount);
    products = await prisma.product.findMany({ where: options.where, orderBy: options.orderBy, skip: (page - 1) * pageSize, take: pageSize, include: { category: { select: { name: true, slug: true } }, images: { orderBy: { sortOrder: "asc" }, take: 1, select: { imageUrl: true, altText: true } } } });
  } catch {
    failed = true;
  }
  const title = mode === "category" ? categoryName : mode === "search" ? "نتائج البحث" : "كل المنتجات";
  const description = mode === "category" ? `تصفّح منتجات ${categoryName} المتاحة في مدار تك.` : mode === "search" ? (options.q ? `نتائج البحث عن «${options.q}».` : "ابحث في منتجات المتجر واستخدم الفلاتر للوصول لما يناسبك.") : "اكتشف منتجات مدار تك، وابحث أو صفِّ النتائج حسب السعر والتوفر.";
  const path = mode === "search" ? "/search" : mode === "category" ? `/categories/${categorySlug}` : "/products";

  return <main className="store-catalog-page">
    <nav className="store-breadcrumbs" aria-label="مسار التنقل"><Link href="/">الرئيسية</Link><span>/</span>{mode === "category" ? <><Link href="/categories">التصنيفات</Link><span>/</span></> : null}<span aria-current="page">{title}</span></nav>
    <header className="store-catalog-heading"><div><span className="store-catalog-kicker">MADAR TECH / الكتالوج</span><h1>{title}</h1><p>{description}</p></div>{!failed && <span className="store-catalog-total">{total}<small>منتج</small></span>}</header>
    <CatalogFilters path={path} q={options.q} minPrice={options.minPrice} maxPrice={options.maxPrice} sort={options.sort} inStock={options.inStock} />
    {failed ? <section className="store-catalog-empty" role="alert"><span>!</span><h2>تعذر تحميل المنتجات</h2><p>تحقق من الاتصال ثم أعد تحميل الصفحة.</p></section> : total === 0 ? <section className="store-catalog-empty"><span>⌕</span><h2>{options.q ? "لم نعثر على نتائج مطابقة" : "لا توجد منتجات متاحة هنا بعد"}</h2><p>جرّب تغيير عبارة البحث أو تعديل الفلاتر.</p><Link href={mode === "search" ? "/search" : path}>مسح الفلاتر</Link></section> : <>
      <ProductGrid products={products} />
      <nav className="store-pagination" aria-label="صفحات المنتجات"><span>عرض {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} من {total}</span><div>{page > 1 && <Link href={catalogPageHref(path, params, page - 1)}>السابق</Link>}<strong>صفحة {page} من {pageCount}</strong>{page < pageCount && <Link href={catalogPageHref(path, params, page + 1)}>التالي</Link>}</div></nav>
    </>}
  </main>;
}
