import { Suspense } from "react";
import { CatalogBrowser } from "@/components/store/catalog-browser";
import type { CatalogParams } from "@/lib/store/catalog";

export default function SearchPage({ searchParams }: { searchParams: Promise<CatalogParams> }) {
  return <Suspense fallback={<main className="store-catalog-page"><div className="store-catalog-skeleton" aria-label="جارٍ البحث"><i /><i /><i /><i /></div></main>}><CatalogBrowser mode="search" searchParams={searchParams} /></Suspense>;
}
