import { Suspense } from "react";
import { CatalogBrowser } from "@/components/store/catalog-browser";
import type { CatalogParams } from "@/lib/store/catalog";

export default function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<CatalogParams> }) {
  return <Suspense fallback={<main className="store-catalog-page"><div className="store-catalog-skeleton" aria-label="جارٍ تحميل التصنيف"><i /><i /><i /><i /></div></main>}><CategoryContent params={params} searchParams={searchParams} /></Suspense>;
}

async function CategoryContent({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<CatalogParams> }) {
  const { slug } = await params;
  return <CatalogBrowser mode="category" categorySlug={slug} searchParams={searchParams} />;
}
