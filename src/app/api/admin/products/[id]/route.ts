import { NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/permissions";
import { productInputSchema } from "@/lib/products/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireRole(["STORE_ADMIN", "EMPLOYEE"]);
  if (auth.response) return auth.response;
  const { id } = await params;
  try {
    const product = await prisma.product.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: "asc" } }, category: true } });
    if (!product) return Response.json({ error: "المنتج غير موجود." }, { status: 404 });
    return Response.json({ product: { ...product, price: product.price.toString(), compareAtPrice: product.compareAtPrice?.toString() ?? null } });
  } catch {
    return Response.json({ error: "تعذر تحميل المنتج حاليًا." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireRole(["STORE_ADMIN", "EMPLOYEE"]);
  if (auth.response) return auth.response;
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "تحقق من بيانات المنتج." }, { status: 400 });

  try {
    const category = await prisma.category.findFirst({ where: { id: parsed.data.categoryId, isActive: true }, select: { id: true } });
    if (!category) return Response.json({ error: "التصنيف المحدد غير موجود أو غير نشط." }, { status: 400 });
    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...parsed.data,
        price: new Prisma.Decimal(parsed.data.price),
        compareAtPrice: parsed.data.compareAtPrice ? new Prisma.Decimal(parsed.data.compareAtPrice) : null,
      },
      select: { id: true, slug: true, status: true, stockQuantity: true },
    });
    return Response.json({ product: updated });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = String(error.meta?.target ?? "");
      return Response.json({ error: target.includes("sku") ? "رمز SKU مستخدم في منتج آخر." : "رابط المنتج مستخدم بالفعل." }, { status: 409 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return Response.json({ error: "المنتج غير موجود." }, { status: 404 });
    return Response.json({ error: "تعذر تعديل المنتج حاليًا." }, { status: 500 });
  }
}
