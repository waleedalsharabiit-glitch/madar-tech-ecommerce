import { NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/permissions";
import { productInputSchema } from "@/lib/products/validation";

export const runtime = "nodejs";

function publicProduct(product: { price: Prisma.Decimal; compareAtPrice: Prisma.Decimal | null; [key: string]: unknown }) {
  return { ...product, price: product.price.toString(), compareAtPrice: product.compareAtPrice?.toString() ?? null };
}

export async function GET(request: NextRequest) {
  const auth = await requireRole(["STORE_ADMIN", "EMPLOYEE"]);
  if (auth.response) return auth.response;

  const params = request.nextUrl.searchParams;
  const q = (params.get("q") ?? "").trim().slice(0, 100);
  const categoryId = params.get("categoryId") ?? "";
  const status = params.get("status") ?? "";
  const page = Math.max(1, Math.min(10000, Number.parseInt(params.get("page") ?? "1", 10) || 1));
  const pageSize = 20;
  const sort = params.get("sort");
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

  try {
    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize, include: { category: { select: { id: true, name: true, isActive: true } }, _count: { select: { images: true } } } }),
      prisma.product.count({ where }),
    ]);
    return Response.json({ items: items.map(publicProduct), total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) });
  } catch {
    return Response.json({ error: "تعذر تحميل المنتجات حاليًا." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(["STORE_ADMIN", "EMPLOYEE"]);
  if (auth.response) return auth.response;
  const body = await request.json().catch(() => null);
  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "تحقق من بيانات المنتج." }, { status: 400 });

  try {
    const category = await prisma.category.findFirst({ where: { id: parsed.data.categoryId, isActive: true }, select: { id: true } });
    if (!category) return Response.json({ error: "التصنيف المحدد غير موجود أو غير نشط." }, { status: 400 });
    const created = await prisma.product.create({
      data: {
        ...parsed.data,
        price: new Prisma.Decimal(parsed.data.price),
        compareAtPrice: parsed.data.compareAtPrice ? new Prisma.Decimal(parsed.data.compareAtPrice) : null,
      },
      select: { id: true, slug: true },
    });
    return Response.json({ product: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = String(error.meta?.target ?? "");
      return Response.json({ error: target.includes("sku") ? "رمز SKU مستخدم في منتج آخر." : "رابط المنتج مستخدم بالفعل." }, { status: 409 });
    }
    return Response.json({ error: "تعذر حفظ المنتج حاليًا. تحقق من البيانات وحاول مرة أخرى." }, { status: 500 });
  }
}
