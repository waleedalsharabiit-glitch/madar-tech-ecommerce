import { Suspense } from "react";
import { CategoryBrowser } from "@/components/store/category-browser";

export default function CategoriesPage() {
  return <Suspense fallback={<main className="store-catalog-page"><div className="store-catalog-skeleton" aria-label="جارٍ تحميل التصنيفات"><i /><i /><i /><i /></div></main>}><CategoryBrowser /></Suspense>;
}
