import { Prisma } from "@/generated/prisma/client";

export type CatalogParams = Record<string, string | string[] | undefined>;

export function queryValue(params: CatalogParams, key: string) {
  const raw = params[key];
  return (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
}

function parsePrice(value: string) {
  if (!value || value.length > 14 || !/^\d+(?:\.\d{1,2})?$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 9_999_999_999.99 ? new Prisma.Decimal(parsed.toFixed(2)) : undefined;
}

export function buildCatalogQuery(params: CatalogParams, categorySlug?: string) {
  const q = queryValue(params, "q").slice(0, 100);
  const minPrice = parsePrice(queryValue(params, "minPrice"));
  const maxPrice = parsePrice(queryValue(params, "maxPrice"));
  const sortRaw = queryValue(params, "sort");
  const sort = ["newest", "price-asc", "price-desc", "name"].includes(sortRaw) ? sortRaw : "newest";
  const pageCandidate = Number.parseInt(queryValue(params, "page") || "1", 10);
  const requestedPage = Number.isFinite(pageCandidate) ? Math.max(1, Math.min(100_000, pageCandidate)) : 1;
  const inStock = queryValue(params, "inStock") === "1";

  const clauses: Prisma.ProductWhereInput[] = [
    { status: { in: ["ACTIVE", "OUT_OF_STOCK"] } },
    { category: { isActive: true, ...(categorySlug ? { slug: categorySlug } : {}) } },
  ];
  if (q) clauses.push({ OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }] });
  if (minPrice || maxPrice) clauses.push({ price: { ...(minPrice ? { gte: minPrice } : {}), ...(maxPrice ? { lte: maxPrice } : {}) } });
  if (inStock) clauses.push({ stockQuantity: { gt: 0 }, status: "ACTIVE" });

  const primaryOrder: Prisma.ProductOrderByWithRelationInput = sort === "price-asc" ? { price: "asc" }
    : sort === "price-desc" ? { price: "desc" }
      : sort === "name" ? { name: "asc" }
        : { createdAt: "desc" };
  const orderBy: Prisma.ProductOrderByWithRelationInput[] = [primaryOrder, { id: "asc" }];

  return { q, minPrice: queryValue(params, "minPrice"), maxPrice: queryValue(params, "maxPrice"), sort, inStock, requestedPage, where: { AND: clauses } satisfies Prisma.ProductWhereInput, orderBy };
}

export function catalogPageHref(path: string, params: CatalogParams, page: number) {
  const query = new URLSearchParams();
  for (const key of ["q", "minPrice", "maxPrice", "sort", "inStock"]) {
    const value = queryValue(params, key);
    if (value) query.set(key, value);
  }
  query.set("page", String(page));
  return `${path}?${query.toString()}`;
}
