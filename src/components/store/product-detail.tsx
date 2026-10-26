import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export async function ProductDetail({ slug }: { slug: string }) {
  let product;
  try {
    product = await prisma.product.findFirst({
      where: { slug, status: { in: ["ACTIVE", "OUT_OF_STOCK"] }, category: { isActive: true } },
      include: { category: { select: { name: true, slug: true } }, images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }] } },
    });
  } catch {
    return <main className="store-catalog-page"><section className="store-catalog-empty" role="alert"><span>!</span><h1>تعذر تحميل المنتج</h1><p>تحقق من الاتصال ثم أعد المحاولة.</p><Link href="/products">العودة إلى المنتجات</Link></section></main>;
  }
  if (!product) notFound();
  const available = product.stockQuantity > 0 && product.status === "ACTIVE";
  return <main className="store-catalog-page store-product-detail-page">
    <nav className="store-breadcrumbs" aria-label="مسار التنقل"><Link href="/">الرئيسية</Link><span>/</span><Link href="/categories">التصنيفات</Link><span>/</span><Link href={`/categories/${product.category.slug}`}>{product.category.name}</Link><span>/</span><span aria-current="page">{product.name}</span></nav>
    <article className="store-product-detail">
      <div className="store-product-gallery">{product.images.length ? product.images.map((image, index) => <figure className={index === 0 ? "store-product-main-image" : "store-product-secondary-image"} key={image.id}><Image src={image.imageUrl} alt={image.altText || product.name} fill sizes={index === 0 ? "(max-width: 780px) 92vw, 55vw" : "160px"} unoptimized /></figure>) : <div className="store-product-detail-placeholder" aria-hidden="true">▱</div>}</div>
      <div className="store-product-detail-copy"><span className="store-catalog-kicker">{product.category.name}</span><h1>{product.name}</h1>{product.sku && <p className="store-product-sku" dir="ltr">SKU: {product.sku}</p>}
        <div className="store-detail-price"><strong>{product.price.toFixed(2)} <small>ر.ي</small></strong>{product.compareAtPrice && <del>{product.compareAtPrice.toFixed(2)} ر.ي</del>}</div>
        <p className={available ? "store-detail-availability is-available" : "store-detail-availability is-unavailable"}><i />{available ? `متوفر — ${product.stockQuantity} قطعة` : "غير متوفر حاليًا"}</p>
        {product.description ? <div className="store-product-description">{product.description.split(/\r?\n/).map((line, index) => line ? <p key={index}>{line}</p> : <br key={index} />)}</div> : <p className="store-product-description store-muted-description">لا تتوفر تفاصيل إضافية لهذا المنتج حاليًا.</p>}
        <div className="store-detail-actions"><button type="button" disabled={!available} title="تتوفر إضافة السلة في المرحلة التالية">{available ? "إضافة إلى السلة قريبًا" : "غير متوفر"}</button><Link href="/products">متابعة التسوق</Link></div>
        <p className="store-detail-next-step">تفاصيل المنتج والأسعار من كتالوج المتجر. إتمام الشراء والسلة في المرحلة التالية.</p>
      </div>
    </article>
  </main>;
}
