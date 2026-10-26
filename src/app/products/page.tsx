import { Suspense } from "react";
import { CatalogBrowser } from "@/components/store/catalog-browser";
import type { CatalogParams } from "@/lib/store/catalog";

function Loading() { return <main className="store-catalog-page"><div className="store-catalog-skeleton" aria-label="جارٍ تحميل المنتجات"><i /><i /><i /><i /></div></main>; }

export default function ProductsPage({ searchParams }: { searchParams: Promise<CatalogParams> }) {
  return <Suspense fallback={<Loading />}><CatalogBrowser mode="products" searchParams={searchParams} /></Suspense>;
}
