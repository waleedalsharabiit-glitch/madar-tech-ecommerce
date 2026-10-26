import { Suspense } from "react";
import { ProductDetail } from "@/components/store/product-detail";

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return <Suspense fallback={<main className="store-catalog-page"><div className="store-product-detail-skeleton" aria-label="جارٍ تحميل المنتج" /></main>}><ProductPageContent params={params} /></Suspense>;
}

async function ProductPageContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductDetail slug={slug} />;
}
