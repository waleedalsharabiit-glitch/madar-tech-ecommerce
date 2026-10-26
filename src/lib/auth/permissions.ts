import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";

export type AuthUser = { id: string; name: string; email: string; role: UserRole };

export function hasAnyRole(user: Pick<AuthUser, "role"> | null, roles: UserRole[]) {
  return user !== null && roles.includes(user.role);
}

export function roleAuthorizationStatus(user: Pick<AuthUser, "role"> | null, roles: UserRole[]) {
  if (!user) return 401;
  return hasAnyRole(user, roles) ? 200 : 403;
}

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
  const status = roleAuthorizationStatus(user, roles);
  if (status === 401) return { user: null, response: Response.json({ error: "يلزم تسجيل الدخول." }, { status }) };
  if (status === 403) return { user: null, response: Response.json({ error: "ليست لديك صلاحية لتنفيذ هذا الإجراء." }, { status }) };
  return { user, response: null };
}
