"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  sku: string | null;
  description: string | null;
  price: string;
  compareAtPrice: string | null;
  stockQuantity: number;
  status: "DRAFT" | "ACTIVE" | "OUT_OF_STOCK" | "ARCHIVED";
  isFeatured: boolean;
  categoryId: string;
  imageCount?: number;
};

type CategoryOption = { id: string; name: string };

const statuses = [
  { value: "DRAFT", label: "مسودة" },
  { value: "ACTIVE", label: "نشط" },
  { value: "OUT_OF_STOCK", label: "نفد المخزون" },
  { value: "ARCHIVED", label: "مؤرشف" },
] as const;

export function ProductForm({ product, categories }: { product?: ProductFormValues; categories: CategoryOption[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const nextStatus = String(data.get("status"));
    const nextStock = Number(data.get("stockQuantity"));
    if (product && (nextStatus !== product.status || nextStock !== product.stockQuantity)) {
      if (!window.confirm("سيؤثر هذا التغيير في حالة المنتج أو الكمية المتاحة. هل تريد المتابعة؟")) return;
    }
    if (!product && (nextStatus === "ACTIVE" || nextStock > 0)) {
      if (!window.confirm("سيُنشأ المنتج بالحالة والكمية المحددتين. هل تريد المتابعة؟")) return;
    }

    setPending(true);
    setError("");
    const payload = {
      name: String(data.get("name") ?? ""),
      slug: String(data.get("slug") ?? ""),
      sku: String(data.get("sku") ?? ""),
      description: String(data.get("description") ?? ""),
      price: String(data.get("price") ?? ""),
      compareAtPrice: String(data.get("compareAtPrice") ?? ""),
      stockQuantity: nextStock,
      status: nextStatus,
      isFeatured: data.get("isFeatured") === "on",
      categoryId: String(data.get("categoryId") ?? ""),
    };

    try {
      const response = await fetch(product ? `/api/admin/products/${product.id}` : "/api/admin/products", {
        method: product ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "تعذر حفظ المنتج.");
      router.push("/admin/products");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر حفظ المنتج حاليًا.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="product-form" onSubmit={submit}>
      <div className="product-form-grid">
        <label>اسم المنتج<input name="name" defaultValue={product?.name} required minLength={2} maxLength={180} /></label>
        <label>الرابط (slug)<input name="slug" defaultValue={product?.slug} required maxLength={120} dir="ltr" placeholder="gaming-monitor-24" /><small>حروف وأرقام وشرطات فقط.</small></label>
        <label>رمز SKU <span className="optional-label">اختياري</span><input name="sku" defaultValue={product?.sku ?? ""} maxLength={80} dir="ltr" /></label>
        <label>التصنيف<select name="categoryId" defaultValue={product?.categoryId ?? ""} required><option value="" disabled>اختر تصنيفًا</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label>السعر (YER)<input name="price" type="number" defaultValue={product?.price ?? "0.00"} min="0" max="9999999999.99" step="0.01" required dir="ltr" /></label>
        <label>سعر المقارنة (YER) <span className="optional-label">اختياري</span><input name="compareAtPrice" type="number" defaultValue={product?.compareAtPrice ?? ""} min="0" max="9999999999.99" step="0.01" dir="ltr" /></label>
        <label>كمية المخزون<input name="stockQuantity" type="number" defaultValue={product?.stockQuantity ?? 0} min="0" max="2147483647" step="1" required dir="ltr" /></label>
        <label>حالة المنتج<select name="status" defaultValue={product?.status ?? "DRAFT"}>{statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
      </div>
      <label className="product-description">الوصف<textarea name="description" defaultValue={product?.description ?? ""} rows={6} maxLength={10000} /></label>
      <label className="featured-toggle"><input name="isFeatured" type="checkbox" defaultChecked={product?.isFeatured ?? false} /> عرض ضمن المنتجات المميزة</label>
      {product && <section className="image-management-note"><strong>صور المنتج</strong><p>إدارة الصور متاحة أسفل هذا النموذج بعد حفظ بيانات المنتج.</p></section>}
      {!product && <section className="image-management-note"><strong>صور المنتج</strong><p>بعد إنشاء المنتج، افتح صفحة تعديله لإضافة الصور وإدارة معرضه.</p></section>}
      {error && <p className="product-form-error" role="alert">{error}</p>}
      <div className="product-form-actions"><button className="button-primary" disabled={pending} type="submit">{pending ? "جارٍ الحفظ…" : product ? "حفظ التغييرات" : "إنشاء المنتج"}</button><button className="button-secondary" type="button" onClick={() => router.push("/admin/products")}>إلغاء</button></div>
    </form>
  );
}
