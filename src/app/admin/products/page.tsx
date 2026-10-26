import Link from "next/link";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { ProductFilters } from "@/components/admin/product-filters";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type ProductListItem = Prisma.ProductGetPayload<{ include: { category: { select: { name: true } } } }>;

const statusLabels: Record<string, string> = { DRAFT: "مسودة", ACTIVE: "نشط", OUT_OF_STOCK: "نفد المخزون", ARCHIVED: "مؤرشف" };
const statusClass: Record<string, string> = { DRAFT: "draft", ACTIVE: "active", OUT_OF_STOCK: "out-of-stock", ARCHIVED: "archived" };

function value(params: Record<string, string | string[] | undefined>, key: string) {
  const entry = params[key];
  return typeof entry === "string" ? entry : "";
}

function pageHref(params: Record<string, string | string[] | undefined>, page: number) {
  const query = new URLSearchParams();
  for (const key of ["q", "categoryId", "status", "sort"]) {
    const entry = value(params, key);
    if (entry) query.set(key, entry);
  }
  query.set("page", String(page));
  return `/admin/products?${query.toString()}`;
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = value(params, "q").trim().slice(0, 100);
  const categoryId = value(params, "categoryId");
  const status = value(params, "status");
  const sort = value(params, "sort") || "newest";
  const page = Math.max(1, Math.min(10000, Number.parseInt(value(params, "page") || "1", 10) || 1));
  const pageSize = 20;
  const orderBy: Prisma.ProductOrderByWithRelationInput = sort === "name" ? { name: "asc" }
    : sort === "oldest" ? { createdAt: "asc" }
      : sort === "price-low" ? { price: "asc" }
        : sort === "price-high" ? { price: "desc" }
          : sort === "stock" ? { stockQuantity: "asc" }
            : { createdAt: "desc" };
  const where: Prisma.ProductWhereInput = {
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }] } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(status && ["DRAFT", "ACTIVE", "OUT_OF_STOCK", "ARCHIVED"].includes(status) ? { status: status as "DRAFT" | "ACTIVE" | "OUT_OF_STOCK" | "ARCHIVED" } : {}),
  };

  let products: ProductListItem[] = [];
  let categories: { id: string; name: string }[] = [];
  let total = 0;
  let loadError = false;
  try {
    const result = await Promise.all([
      prisma.product.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize, include: { category: { select: { name: true } } } }),
      prisma.category.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
      prisma.product.count({ where }),
    ]);
    products = result[0];
    categories = result[1];
    total = result[2];
  } catch {
    loadError = true;
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return (
    <main className="admin-products-page">
      <div className="admin-products-heading"><div><span className="section-kicker">إدارة الكتالوج</span><h1>المنتجات والمخزون</h1><p>إدارة بيانات المنتجات وأسعارها وحالتها وكمياتها.</p></div><Link className="button-primary" href="/admin/products/new">إضافة منتج <span aria-hidden="true">＋</span></Link></div>
      <ProductFilters categories={categories} values={{ q, categoryId, status, sort }} />
      {loadError ? <section className="products-state products-state-error"><h2>تعذر تحميل المنتجات</h2><p>تحقق من اتصال قاعدة البيانات ثم أعد المحاولة.</p></section> : products.length === 0 ? <section className="products-state"><h2>لا توجد منتجات مطابقة</h2><p>{total === 0 && !q && !categoryId && !status ? "لم تتم إضافة منتجات بعد." : "غيّر البحث أو الفلاتر لعرض نتائج أخرى."}</p>{total === 0 && <Link className="button-primary" href="/admin/products/new">أضف أول منتج</Link>}</section> : <>
        <div className="products-table-wrap"><table className="products-table"><thead><tr><th>المنتج</th><th>SKU</th><th>التصنيف</th><th>السعر</th><th>المخزون</th><th>الحالة</th><th>الإجراء</th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><strong>{product.name}</strong><small dir="ltr">{product.slug}</small></td><td dir="ltr">{product.sku ?? "—"}</td><td>{product.category.name}</td><td dir="ltr">{product.price.toFixed(2)} YER</td><td><span className={product.stockQuantity === 0 ? "stock-value stock-empty" : "stock-value"}>{product.stockQuantity}</span></td><td><span className={`product-status status-${statusClass[product.status]}`}>{statusLabels[product.status]}</span></td><td><Link className="product-edit-link" href={`/admin/products/${product.id}/edit`}>تعديل</Link></td></tr>)}</tbody></table></div>
        <div className="products-pagination"><span>عرض {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} من {total}</span><div>{page > 1 && <Link className="button-secondary" href={pageHref(params, page - 1)}>السابق</Link>}{page < pageCount && <Link className="button-secondary" href={pageHref(params, page + 1)}>التالي</Link>}</div></div>
      </>}
    </main>
  );
}
