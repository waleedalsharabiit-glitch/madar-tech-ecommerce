import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { allowAuthAttempt } from "@/lib/auth/rate-limit";

const schema = z.object({ email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()), password: z.string().min(1).max(128) });

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة." }, { status: 400 });
  const address = request.headers.get("x-forwarded-for") ?? "unknown";
  if (!allowAuthAttempt(`login:${address}:${parsed.data.email}`)) return Response.json({ error: "محاولات كثيرة. حاول بعد 15 دقيقة." }, { status: 429 });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  const valid = user?.passwordHash ? await verifyPassword(parsed.data.password, user.passwordHash) : false;
  if (!user || !valid || !user.isActive) return Response.json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة." }, { status: 401 });
  await setSessionCookie(user.id);
  return Response.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
