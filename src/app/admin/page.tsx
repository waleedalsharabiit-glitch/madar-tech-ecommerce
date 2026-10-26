import { requireUser } from "@/lib/auth/permissions";

export default async function AdminHomePage() {
  const user = await requireUser();
  return <main className="auth-page"><section className="auth-card"><span className="section-kicker">MADAR TECH / ADMIN</span><h1>لوحة الإدارة</h1><p>مرحبًا {user.name}. المصادقة والصلاحيات تعملان، وستُضاف أدوات إدارة المنتجات والطلبات في مراحلها المحددة.</p></section></main>;
}
