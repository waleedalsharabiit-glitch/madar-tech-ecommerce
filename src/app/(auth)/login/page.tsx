import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return <main className="auth-page"><section className="auth-card"><span className="section-kicker">حساب مدار تك</span><h1>تسجيل الدخول</h1><p>أدخل بيانات حسابك للمتابعة.</p><AuthForm mode="login" /><div className="auth-switch">ليس لديك حساب؟ <Link href="/register">أنشئ حسابًا</Link></div></section></main>;
}
