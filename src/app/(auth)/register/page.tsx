import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export default function RegisterPage() {
  return <main className="auth-page"><section className="auth-card"><span className="section-kicker">انضم إلينا</span><h1>إنشاء حساب</h1><p>أنشئ حساب عميل لمتابعة طلباتك وإدارة بياناتك.</p><AuthForm mode="register" /><div className="auth-switch">لديك حساب بالفعل؟ <Link href="/login">سجّل الدخول</Link></div></section></main>;
}
