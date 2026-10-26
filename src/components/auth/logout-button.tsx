"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return <button className="button-secondary auth-logout" type="button" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.replace("/"); router.refresh(); }}>تسجيل الخروج</button>;
}
