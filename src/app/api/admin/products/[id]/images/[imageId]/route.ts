import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/permissions";
import { allowAuthAttempt } from "@/lib/auth/rate-limit";
import { deleteProductImageObject, getManagedProductImageKey } from "@/lib/storage/object-storage";

type Context = { params: Promise<{ id: string; imageId: string }> };
const productIdPattern = /^[A-Za-z0-9_-]{1,64}$/;

export async function DELETE(_request: NextRequest, { params }: Context) {
  const auth = await requireRole(["STORE_ADMIN", "EMPLOYEE"]);
  if (auth.response) return auth.response;
  const { id, imageId } = await params;
  if (!productIdPattern.test(id) || imageId.length > 64) return Response.json({ error: "معرّف الصورة أو المنتج غير صالح." }, { status: 400 });
  if (!allowAuthAttempt(`product-image-delete:${auth.user!.id}`)) return Response.json({ error: "محاولات حذف كثيرة. حاول بعد 15 دقيقة." }, { status: 429 });

  try {
    const image = await prisma.productImage.findFirst({ where: { id: imageId, productId: id } });
    if (!image) return Response.json({ error: "الصورة غير موجودة." }, { status: 404 });
    const key = getManagedProductImageKey(image.imageUrl, id);
    if (!key) return Response.json({ error: "لا يمكن حذف هذه الصورة لأن مسار تخزينها لا يطابق إعدادات التخزين الحالية." }, { status: 409 });

    await prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${id}, 0))`;
      await transaction.productImage.delete({ where: { id: image.id } });
      if (image.isPrimary) {
        const replacement = await transaction.productImage.findFirst({ where: { productId: id }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
        if (replacement) await transaction.productImage.update({ where: { id: replacement.id }, data: { isPrimary: true } });
      }
    });

    try {
      await deleteProductImageObject(key);
      const images = await prisma.productImage.findMany({ where: { productId: id }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
      return Response.json({ ok: true, images: images.map((entry) => ({ ...entry, isManaged: Boolean(getManagedProductImageKey(entry.imageUrl, id)) })) });
    } catch {
      const images = await prisma.productImage.findMany({ where: { productId: id }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }).catch(() => []);
      return Response.json({ ok: true, warning: "حُذفت الصورة من المنتج، لكن تعذر تنظيف الملف من التخزين. راجع سجل التخزين.", images: images.map((entry) => ({ ...entry, isManaged: Boolean(getManagedProductImageKey(entry.imageUrl, id)) })) });
    }
  } catch {
    return Response.json({ error: "تعذر حذف الصورة حاليًا." }, { status: 500 });
  }
}
