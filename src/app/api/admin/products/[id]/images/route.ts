import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/permissions";
import { allowAuthAttempt } from "@/lib/auth/rate-limit";
import {
  MAX_PRODUCT_IMAGE_BATCH_BYTES,
  MAX_PRODUCT_IMAGE_BATCH_COUNT,
  MAX_PRODUCT_IMAGES,
  prepareProductImage,
} from "@/lib/images/prepare-image";
import {
  createProductImageKey,
  deleteProductImageObject,
  getManagedProductImageKey,
  isObjectStorageConfigured,
  putProductImage,
} from "@/lib/storage/object-storage";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };
const productIdPattern = /^[A-Za-z0-9_-]{1,64}$/;
const altTextSchema = z.string().trim().max(180, "الوصف البديل طويل جدًا.");

class ProductNotFoundError extends Error {}
class ImageLimitError extends Error {}
class InvalidImageSelectionError extends Error {}

async function lockProductImages(transaction: Prisma.TransactionClient, productId: string) {
  await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${productId}, 0))`;
}

export async function GET(_request: NextRequest, { params }: Context) {
  const auth = await requireRole(["STORE_ADMIN", "EMPLOYEE"]);
  if (auth.response) return auth.response;
  const { id } = await params;
  if (!productIdPattern.test(id)) return Response.json({ error: "معرّف المنتج غير صالح." }, { status: 400 });
  try {
    const product = await prisma.product.findUnique({ where: { id }, select: { id: true, name: true } });
    if (!product) return Response.json({ error: "المنتج غير موجود." }, { status: 404 });
    const images = await prisma.productImage.findMany({ where: { productId: id }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
    return Response.json({ images: images.map((image) => ({ ...image, isManaged: Boolean(getManagedProductImageKey(image.imageUrl, id)) })) });
  } catch {
    return Response.json({ error: "تعذر تحميل صور المنتج حاليًا." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Context) {
  const auth = await requireRole(["STORE_ADMIN", "EMPLOYEE"]);
  if (auth.response) return auth.response;
  const { id } = await params;
  if (!productIdPattern.test(id)) return Response.json({ error: "معرّف المنتج غير صالح." }, { status: 400 });
  if (!isObjectStorageConfigured()) return Response.json({ error: "تخزين الصور غير مُعد. أضف إعدادات S3 والتخزين العام أو CDN ثم أعد المحاولة." }, { status: 503 });
  if (!allowAuthAttempt(`product-image-upload:${auth.user!.id}`)) return Response.json({ error: "محاولات رفع كثيرة. حاول بعد 15 دقيقة." }, { status: 429 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "تعذر قراءة ملفات الرفع. أعد اختيار الصور وحاول مرة أخرى." }, { status: 400 });
  }

  const entries = formData.getAll("images");
  if (!entries.length || entries.some((entry) => !(entry instanceof File))) {
    return Response.json({ error: "اختر صورة واحدة على الأقل بصيغة JPEG أو PNG أو WebP." }, { status: 400 });
  }
  const files = entries as File[];
  if (files.length > MAX_PRODUCT_IMAGE_BATCH_COUNT) return Response.json({ error: "يمكن رفع خمس صور كحد أقصى في المرة الواحدة." }, { status: 400 });
  if (files.reduce((sum, file) => sum + file.size, 0) > MAX_PRODUCT_IMAGE_BATCH_BYTES) {
    return Response.json({ error: "إجمالي حجم الصور المحددة يجب ألا يتجاوز 20 ميجابايت." }, { status: 413 });
  }
  const altTexts = formData.getAll("altText");
  if (altTexts.length && altTexts.length !== files.length) return Response.json({ error: "تعذر مطابقة الأوصاف البديلة مع الصور." }, { status: 400 });
  const parsedAltTexts = altTexts.map((altText) => altTextSchema.safeParse(String(altText)));
  const invalidAltText = parsedAltTexts.find((result) => !result.success);
  if (invalidAltText && !invalidAltText.success) return Response.json({ error: invalidAltText.error.issues[0]?.message ?? "الوصف البديل غير صالح." }, { status: 400 });

  const primaryRaw = formData.get("primaryIndex");
  let primaryIndex: number | null = null;
  if (primaryRaw !== null && primaryRaw !== "") {
    const parsedIndex = z.coerce.number().int().min(0).max(files.length - 1).safeParse(primaryRaw);
    if (!parsedIndex.success) return Response.json({ error: "اختيار الصورة الرئيسية غير صالح." }, { status: 400 });
    primaryIndex = parsedIndex.data;
  }

  let product: { id: string; name: string } | null;
  try {
    product = await prisma.product.findUnique({ where: { id }, select: { id: true, name: true } });
  } catch {
    return Response.json({ error: "تعذر الوصول إلى المنتج حاليًا." }, { status: 500 });
  }
  if (!product) return Response.json({ error: "المنتج غير موجود أو تعذر الوصول إليه." }, { status: 404 });

  const uploaded: { key: string; imageUrl: string }[] = [];
  const prepared: Awaited<ReturnType<typeof prepareProductImage>>[] = [];
  try {
    for (const file of files) prepared.push(await prepareProductImage(file));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "تعذر التحقق من ملفات الصور." }, { status: 400 });
  }

  try {
    for (const image of prepared) {
      const key = createProductImageKey(id);
      const imageUrl = await putProductImage(key, image.bytes);
      uploaded.push({ key, imageUrl });
    }

    const images = await prisma.$transaction(async (transaction) => {
      await lockProductImages(transaction, id);
      const current = await transaction.productImage.findMany({ where: { productId: id }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
      if (current.length + uploaded.length > MAX_PRODUCT_IMAGES) throw new ImageLimitError();
      const startOrder = current.reduce((largest, image) => Math.max(largest, image.sortOrder), -1) + 1;
      const shouldSetPrimary = primaryIndex !== null || !current.some((image) => image.isPrimary);
      if (shouldSetPrimary) await transaction.productImage.updateMany({ where: { productId: id, isPrimary: true }, data: { isPrimary: false } });
      const created = [];
      for (let index = 0; index < uploaded.length; index += 1) {
        const entry = uploaded[index]!;
        created.push(await transaction.productImage.create({
          data: {
            productId: id,
            imageUrl: entry.imageUrl,
            altText: (parsedAltTexts[index]?.success ? parsedAltTexts[index].data : "") || product.name,
            sortOrder: startOrder + index,
            isPrimary: shouldSetPrimary && (primaryIndex === null ? index === 0 : index === primaryIndex),
          },
        }));
      }
      return [...current, ...created].sort((left, right) => left.sortOrder - right.sortOrder);
    });
    return Response.json({ images: images.map((image) => ({ ...image, isManaged: true })) }, { status: 201 });
  } catch (error) {
    await Promise.allSettled(uploaded.map(({ key }) => deleteProductImageObject(key)));
    if (error instanceof ImageLimitError) return Response.json({ error: `لا يمكن أن يتجاوز عدد صور المنتج ${MAX_PRODUCT_IMAGES} صورة.` }, { status: 409 });
    return Response.json({ error: "تعذر رفع الصور إلى التخزين الدائم. تحقق من إعدادات التخزين ثم أعد المحاولة." }, { status: 502 });
  }
}

const updateSchema = z.object({
  imageIds: z.array(z.string().min(1).max(64)).max(MAX_PRODUCT_IMAGES).optional(),
  primaryImageId: z.string().min(1).max(64).optional(),
  altTextUpdates: z.array(z.object({ id: z.string().min(1).max(64), altText: altTextSchema })).max(MAX_PRODUCT_IMAGES).optional(),
}).refine((value) => Boolean(value.imageIds || value.primaryImageId || value.altTextUpdates?.length), "لا توجد تغييرات لحفظها.");

export async function PATCH(request: NextRequest, { params }: Context) {
  const auth = await requireRole(["STORE_ADMIN", "EMPLOYEE"]);
  if (auth.response) return auth.response;
  const { id } = await params;
  if (!productIdPattern.test(id)) return Response.json({ error: "معرّف المنتج غير صالح." }, { status: 400 });
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "بيانات الصور غير صالحة." }, { status: 400 });

  try {
    const images = await prisma.$transaction(async (transaction) => {
      await lockProductImages(transaction, id);
      const current = await transaction.productImage.findMany({ where: { productId: id }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
      if (!current.length) throw new ProductNotFoundError();
      const currentIds = new Set(current.map((image) => image.id));
      if (parsed.data.imageIds) {
        const ids = parsed.data.imageIds;
        if (new Set(ids).size !== ids.length || ids.length !== current.length || ids.some((imageId) => !currentIds.has(imageId))) throw new InvalidImageSelectionError();
        for (let index = 0; index < ids.length; index += 1) await transaction.productImage.update({ where: { id: ids[index] }, data: { sortOrder: index } });
      }
      if (parsed.data.primaryImageId) {
        if (!currentIds.has(parsed.data.primaryImageId)) throw new InvalidImageSelectionError();
        await transaction.productImage.updateMany({ where: { productId: id, isPrimary: true }, data: { isPrimary: false } });
        await transaction.productImage.update({ where: { id: parsed.data.primaryImageId }, data: { isPrimary: true } });
      }
      if (parsed.data.altTextUpdates) {
        const seen = new Set<string>();
        for (const update of parsed.data.altTextUpdates) {
          if (!currentIds.has(update.id) || seen.has(update.id)) throw new InvalidImageSelectionError();
          seen.add(update.id);
          await transaction.productImage.update({ where: { id: update.id }, data: { altText: update.altText || null } });
        }
      }
      return transaction.productImage.findMany({ where: { productId: id }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
    });
    return Response.json({ images: images.map((image) => ({ ...image, isManaged: Boolean(getManagedProductImageKey(image.imageUrl, id)) })) });
  } catch (error) {
    if (error instanceof InvalidImageSelectionError) return Response.json({ error: "قائمة الصور تغيرت. حدّث الصفحة ثم أعد المحاولة." }, { status: 409 });
    if (error instanceof ProductNotFoundError) return Response.json({ error: "لا توجد صور لهذا المنتج." }, { status: 404 });
    return Response.json({ error: "تعذر حفظ ترتيب الصور أو أوصافها." }, { status: 500 });
  }
}
