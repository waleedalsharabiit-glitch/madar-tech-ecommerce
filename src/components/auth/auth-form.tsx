"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const isRegister = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "تعذر إكمال الطلب.");
      const next = new URLSearchParams(window.location.search).get("next") ?? "/account";
      router.replace(isRegister || !next.startsWith("/") || next.startsWith("//") ? "/account" : next);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "حدث خطأ غير متوقع.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      {isRegister && <label>الاسم الكامل<input name="name" autoComplete="name" minLength={2} maxLength={80} required /></label>}
      <label>البريد الإلكتروني<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
      <label>كلمة المرور<input name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} minLength={isRegister ? 10 : 1} maxLength={128} required />{isRegister && <small>10 أحرف على الأقل.</small>}</label>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="button-primary" type="submit" disabled={pending}>{pending ? "جارٍ المعالجة…" : isRegister ? "إنشاء الحساب" : "تسجيل الدخول"}</button>
    </form>
  );
}
