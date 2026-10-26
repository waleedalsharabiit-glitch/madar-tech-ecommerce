import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { allowAuthAttempt } from "@/lib/auth/rate-limit";

const schema = z.object({
  name: z.string().trim().min(2, "الاسم يجب ألا يقل عن حرفين.").max(80),
  email: z.string().trim().email("أدخل بريدًا إلكترونيًا صحيحًا.").max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(10, "كلمة المرور يجب أن تتكون من 10 أحرف على الأقل.").max(128),
});

export async function POST(request: NextRequest) {
  if (!allowAuthAttempt(`register:${request.headers.get("x-forwarded-for") ?? "unknown"}`)) {
    return Response.json({ error: "محاولات كثيرة. حاول بعد 15 دقيقة." }, { status: 429 });
  }
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "تحقق من البيانات المدخلة." }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (existing) return Response.json({ error: "تعذر إنشاء الحساب بهذا البريد الإلكتروني." }, { status: 409 });

  const user = await prisma.user.create({
    data: { name: parsed.data.name, email: parsed.data.email, passwordHash: await hashPassword(parsed.data.password), role: "CUSTOMER" },
    select: { id: true, name: true, email: true, role: true },
  });
  await setSessionCookie(user.id);
  return Response.json({ user }, { status: 201 });
}
