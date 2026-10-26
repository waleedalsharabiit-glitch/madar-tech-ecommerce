import Link from "next/link";

type CategoryOption = { id: string; name: string };

export function ProductFilters({
  categories,
  values,
}: {
  categories: CategoryOption[];
  values: { q: string; categoryId: string; status: string; sort: string };
}) {
  return (
    <form className="product-filters" action="/admin/products" method="get">
      <label>بحث بالاسم أو SKU<input name="q" type="search" defaultValue={values.q} placeholder="مثال: شاشة أو MT-100" /></label>
      <label>التصنيف<select name="categoryId" defaultValue={values.categoryId}><option value="">كل التصنيفات</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <label>الحالة<select name="status" defaultValue={values.status}><option value="">كل الحالات</option><option value="DRAFT">مسودة</option><option value="ACTIVE">نشط</option><option value="OUT_OF_STOCK">نفد المخزون</option><option value="ARCHIVED">مؤرشف</option></select></label>
      <label>الترتيب<select name="sort" defaultValue={values.sort}><option value="newest">الأحدث</option><option value="oldest">الأقدم</option><option value="name">الاسم</option><option value="price-low">السعر: الأقل</option><option value="price-high">السعر: الأعلى</option><option value="stock">الأقل مخزونًا</option></select></label>
      <div className="product-filter-actions"><button className="button-primary" type="submit">تطبيق</button><Link className="button-secondary" href="/admin/products">مسح الفلاتر</Link></div>
    </form>
  );
}
