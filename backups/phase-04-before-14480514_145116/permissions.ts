import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";

export type AuthUser = { id: string; name: string; email: string; role: UserRole };

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = readSessionToken(token);
  if (!session) return null;
  return prisma.user.findFirst({
    where: { id: session.userId, isActive: true },
    select: { id: true, name: true, email: true, role: true },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(roles: UserRole[]) {
  const user = await getCurrentUser();
  if (!user) return { user: null, response: Response.json({ error: "يلزم تسجيل الدخول." }, { status: 401 }) };
  if (!roles.includes(user.role)) return { user: null, response: Response.json({ error: "ليست لديك صلاحية لتنفيذ هذا الإجراء." }, { status: 403 }) };
  return { user, response: null };
}
