import sharp, { type Metadata } from "sharp";

export const MAX_PRODUCT_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_PRODUCT_IMAGE_BATCH_BYTES = 20 * 1024 * 1024;
export const MAX_PRODUCT_IMAGE_BATCH_COUNT = 5;
export const MAX_PRODUCT_IMAGES = 12;
const MAX_IMAGE_PIXELS = 40_000_000;
const MAX_IMAGE_EDGE = 2400;

const acceptedFormats = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

export async function prepareProductImage(file: File) {
  if (!file.size || file.size > MAX_PRODUCT_IMAGE_BYTES) throw new Error("حجم كل صورة يجب ألا يتجاوز 8 ميجابايت.");
  if (!(Object.values(acceptedFormats) as string[]).includes(file.type)) throw new Error("الصيغ المدعومة هي JPEG وPNG وWebP فقط.");

  const input = Buffer.from(await file.arrayBuffer());
  if (input.byteLength !== file.size) throw new Error("تعذر قراءة ملف الصورة كاملًا.");

  let metadata: Metadata;
  try {
    metadata = await sharp(input, { limitInputPixels: MAX_IMAGE_PIXELS, failOn: "warning", sequentialRead: true }).metadata();
  } catch {
    throw new Error("محتوى الملف ليس صورة سليمة أو تعذر فك ترميزها.");
  }

  const actualMime = metadata.format ? acceptedFormats[metadata.format as keyof typeof acceptedFormats] : undefined;
  if (!actualMime || actualMime !== file.type) throw new Error("نوع الملف لا يطابق محتوى الصورة الفعلي.");
  if (!metadata.width || !metadata.height || metadata.width * metadata.height > MAX_IMAGE_PIXELS) {
    throw new Error("أبعاد الصورة كبيرة أو غير صالحة.");
  }
  if ((metadata.pages ?? 1) !== 1) throw new Error("الصور المتحركة ومتعددة الإطارات غير مدعومة.");

  try {
    const result = await sharp(input, { limitInputPixels: MAX_IMAGE_PIXELS, failOn: "warning", sequentialRead: true })
      .rotate()
      .resize({ width: MAX_IMAGE_EDGE, height: MAX_IMAGE_EDGE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 84, effort: 5 })
      .toBuffer({ resolveWithObject: true });
    return { bytes: result.data, width: result.info.width, height: result.info.height };
  } catch {
    throw new Error("تعذر معالجة الصورة. جرّب ملفًا آخر بصيغة JPEG أو PNG أو WebP.");
  }
}
