import { z } from "zod";

const decimal = z.string().trim().regex(/^\d{1,10}(?:\.\d{1,2})?$/, "أدخل مبلغًا موجبًا أو صفرًا بدقتين عشريتين كحد أقصى.");

function compareDecimal(left: string, right: string) {
  const [leftWholeRaw, leftFraction = ""] = left.split(".");
  const [rightWholeRaw, rightFraction = ""] = right.split(".");
  const leftWhole = leftWholeRaw.replace(/^0+/, "") || "0";
  const rightWhole = rightWholeRaw.replace(/^0+/, "") || "0";
  if (leftWhole.length !== rightWhole.length) return leftWhole.length > rightWhole.length ? 1 : -1;
  if (leftWhole !== rightWhole) return leftWhole > rightWhole ? 1 : -1;
  const leftCents = leftFraction.padEnd(2, "0");
  const rightCents = rightFraction.padEnd(2, "0");
  return leftCents === rightCents ? 0 : leftCents > rightCents ? 1 : -1;
}

export const productInputSchema = z.object({
  name: z.string().trim().min(2, "اسم المنتج قصير جدًا.").max(180),
  slug: z.string().trim().min(2).max(120).regex(/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u, "الرابط يقبل الحروف والأرقام والشرطات فقط."),
  sku: z.string().trim().max(80).transform((value) => value || null),
  description: z.string().trim().max(10000).transform((value) => value || null),
  price: decimal,
  compareAtPrice: z.union([decimal, z.literal("")]).transform((value) => value || null),
  stockQuantity: z.number().int("الكمية يجب أن تكون عددًا صحيحًا.").min(0, "المخزون لا يقبل قيمة سالبة.").max(2147483647),
  status: z.enum(["DRAFT", "ACTIVE", "OUT_OF_STOCK", "ARCHIVED"]),
  isFeatured: z.boolean(),
  categoryId: z.string().min(1, "اختر تصنيفًا.").max(64),
}).superRefine((value, context) => {
  if (value.compareAtPrice && compareDecimal(value.compareAtPrice, value.price) <= 0) {
    context.addIssue({ code: "custom", path: ["compareAtPrice"], message: "سعر المقارنة يجب أن يكون أعلى من سعر البيع." });
  }
  if (value.status === "ACTIVE" && value.stockQuantity === 0) {
    context.addIssue({ code: "custom", path: ["stockQuantity"], message: "المنتج بلا مخزون؛ اختر حالة نفد المخزون أو أضف كمية." });
  }
});

export type ProductInput = z.infer<typeof productInputSchema>;
