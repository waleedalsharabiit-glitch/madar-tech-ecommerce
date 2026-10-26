"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useRef, useState } from "react";

export type ManagedProductImage = {
  id: string;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
  isManaged: boolean;
};

type SelectedImage = { file: File; previewUrl: string; altText: string };

export function ProductImageManager({
  productId,
  productName,
  initialImages,
  storageConfigured,
}: {
  productId: string;
  productName: string;
  initialImages: ManagedProductImage[];
  storageConfigured: boolean;
}) {
  const [images, setImages] = useState(initialImages);
  const [selected, setSelected] = useState<SelectedImage[]>([]);
  const [primaryUploadIndex, setPrimaryUploadIndex] = useState<number | null>(initialImages.some((image) => image.isPrimary) ? null : 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedRef = useRef<SelectedImage[]>([]);

  useEffect(() => () => {
    for (const image of selectedRef.current) URL.revokeObjectURL(image.previewUrl);
  }, []);

  function replaceSelection(files: File[]) {
    for (const image of selectedRef.current) URL.revokeObjectURL(image.previewUrl);
    const next = files.slice(0, 5).map((file) => ({ file, previewUrl: URL.createObjectURL(file), altText: productName }));
    selectedRef.current = next;
    setSelected(next);
    setPrimaryUploadIndex(images.some((image) => image.isPrimary) ? null : next.length ? 0 : null);
    setError("");
    setNotice("");
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    replaceSelection(Array.from(event.currentTarget.files ?? []));
    event.currentTarget.value = "";
  }

  async function upload() {
    if (!selected.length) return;
    if (images.length + selected.length > 12) {
      setError("يمكن أن يحتوي المنتج على 12 صورة كحد أقصى.");
      return;
    }
    const totalBytes = selected.reduce((sum, image) => sum + image.file.size, 0);
    if (totalBytes > 20 * 1024 * 1024 || selected.some((image) => image.file.size > 8 * 1024 * 1024)) {
      setError("حجم الصورة الواحدة 8 ميجابايت كحد أقصى، ومجموع الرفع 20 ميجابايت.");
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");
    const formData = new FormData();
    for (const image of selected) {
      formData.append("images", image.file);
      formData.append("altText", image.altText);
    }
    if (primaryUploadIndex !== null) formData.append("primaryIndex", String(primaryUploadIndex));

    try {
      const response = await fetch(`/api/admin/products/${productId}/images`, { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "تعذر رفع الصور.");
      setImages(result.images as ManagedProductImage[]);
      replaceSelection([]);
      setNotice("تم فحص الصور وتحسينها وحفظها في التخزين الدائم.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر رفع الصور حاليًا.");
    } finally {
      setBusy(false);
    }
  }

  async function updateImages(payload: { imageIds?: string[]; primaryImageId?: string; altTextUpdates?: { id: string; altText: string }[] }) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/products/${productId}/images`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "تعذر حفظ تغييرات الصور.");
      setImages(result.images as ManagedProductImage[]);
      setNotice("حُفظت تغييرات الصور.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر حفظ تغييرات الصور.");
    } finally {
      setBusy(false);
    }
  }

  async function removeImage(image: ManagedProductImage) {
    if (!window.confirm(`سيتم حذف صورة «${image.altText || productName}» من المنتج والتخزين. هل تريد المتابعة؟`)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/products/${productId}/images/${image.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "تعذر حذف الصورة.");
      if (Array.isArray(result.images)) setImages(result.images as ManagedProductImage[]);
      else setImages((current) => current.filter((item) => item.id !== image.id));
      setNotice(result.warning ?? "حُذفت الصورة من المنتج.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر حذف الصورة.");
    } finally {
      setBusy(false);
    }
  }

  function moveImage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target]!, next[index]!];
    void updateImages({ imageIds: next.map((image) => image.id) });
  }

  return (
    <section className="product-image-manager" aria-labelledby="product-images-title">
      <div className="product-image-heading">
        <div><span className="section-kicker">معرض المنتج</span><h2 id="product-images-title">صور المنتج <span>{images.length}/12</span></h2><p>تُفحص الصور وتُحوّل إلى WebP قبل إرسالها إلى التخزين.</p></div>
        {images.some((image) => image.isPrimary) && <span className="image-primary-status"><i /> الصورة الرئيسية محددة</span>}
      </div>

      {!storageConfigured && <div className="image-storage-alert" role="status"><strong>التخزين الدائم غير مُعد بعد</strong><p>أضف <code>S3_BUCKET</code> و<code>S3_PUBLIC_BASE_URL</code> و<code>S3_REGION</code> إلى متغيرات البيئة. استخدم مفاتيح <code>S3_ACCESS_KEY_ID</code> و<code>S3_SECRET_ACCESS_KEY</code> أو صلاحية IAM في بيئة الاستضافة. لا يُحفظ أي ملف على قرص الخادم.</p></div>}

      {images.length ? <div className="product-image-grid">{images.map((image, index) => <article className="product-image-card" key={image.id}>
        <div className="product-image-preview">{image.imageUrl ? <Image src={image.imageUrl} alt={image.altText || productName} fill sizes="(max-width: 700px) 45vw, 240px" unoptimized /> : <span aria-hidden="true">▧</span>}
          {image.isPrimary && <span className="product-image-primary-badge">الصورة الرئيسية</span>}
          {!image.isManaged && <span className="product-image-external-badge">ملف خارجي</span>}
        </div>
        <div className="product-image-card-body">
          <label>الوصف البديل<input aria-label={`الوصف البديل للصورة ${index + 1}`} defaultValue={image.altText ?? ""} maxLength={180} onBlur={(event) => { const value = event.currentTarget.value.trim(); if (value !== (image.altText ?? "")) void updateImages({ altTextUpdates: [{ id: image.id, altText: value }] }); }} /></label>
          <div className="product-image-actions">
            <button type="button" disabled={busy || index === 0} onClick={() => moveImage(index, -1)} aria-label="تحريك الصورة للأعلى">↑</button>
            <button type="button" disabled={busy || index === images.length - 1} onClick={() => moveImage(index, 1)} aria-label="تحريك الصورة للأسفل">↓</button>
            {!image.isPrimary && <button className="image-make-primary" type="button" disabled={busy} onClick={() => void updateImages({ primaryImageId: image.id })}>تعيين رئيسية</button>}
            <button className="image-delete-button" type="button" disabled={busy || !image.isManaged} onClick={() => void removeImage(image)} title={!image.isManaged ? "تعذر مطابقة ملف الصورة مع التخزين الحالي" : undefined}>حذف</button>
          </div>
        </div>
      </article>)}</div> : <div className="product-images-empty"><span aria-hidden="true">▧</span><strong>لم تُضف صور لهذا المنتج بعد</strong><p>ارفع صورًا واضحة بخلفية نظيفة لعرض المنتج بأفضل شكل.</p></div>}

      {images.length < 12 && <div className="product-image-upload-area">
        <input ref={inputRef} className="product-image-file-input" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onFileChange} aria-label="اختر صور المنتج" />
        {!selected.length ? <button type="button" className="product-image-pick" onClick={() => inputRef.current?.click()} disabled={busy || !storageConfigured}><span>＋</span><strong>اختر صورًا من جهازك</strong><small>JPEG أو PNG أو WebP · حتى 8MB للصورة · خمس صور في الدفعة</small></button> : <>
          <div className="product-image-preview-grid">{selected.map((image, index) => <article className="product-image-upload-preview" key={`${image.file.name}-${index}`}>
            <div><Image src={image.previewUrl} alt="معاينة الصورة قبل الرفع" fill sizes="160px" unoptimized /></div>
            <label className="product-image-alt-label">الوصف البديل<input value={image.altText} maxLength={180} onChange={(event) => setSelected((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, altText: event.currentTarget.value } : item))} /></label>
            <label className="product-image-radio"><input type="radio" name="primary-upload" checked={primaryUploadIndex === index} onChange={() => setPrimaryUploadIndex(index)} /> جعلها رئيسية</label>
          </article>)}</div>
          <div className="product-image-upload-actions"><button type="button" className="button-primary" disabled={busy || !storageConfigured} onClick={() => void upload()}>{busy ? "جارٍ الفحص والتحسين والرفع…" : `رفع ${selected.length} صورة`}</button><button type="button" className="button-secondary" disabled={busy} onClick={() => replaceSelection([])}>إلغاء التحديد</button></div>
        </>}
      </div>}

      {error && <p className="product-image-feedback product-image-feedback-error" role="alert">{error}</p>}
      {notice && <p className="product-image-feedback" role="status">{notice}</p>}
      <p className="product-image-security-note">نقبل الصور الثابتة فقط. نتحقق من محتوى الملف وأبعاده، ونزيل بيانات EXIF، ثم نخزن نسخة محسّنة بصيغة WebP.</p>
    </section>
  );
}
