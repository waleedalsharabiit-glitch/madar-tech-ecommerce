import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/permissions";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Faccount");
  return <main className="auth-page"><section className="auth-card"><span className="section-kicker">حسابك</span><h1>مرحبًا، {user.name}</h1><p>البريد الإلكتروني: {user.email}</p><p>نوع الحساب: {user.role === "CUSTOMER" ? "عميل" : user.role === "EMPLOYEE" ? "موظف" : "مدير المتجر"}</p><LogoutButton /></section></main>;
}
