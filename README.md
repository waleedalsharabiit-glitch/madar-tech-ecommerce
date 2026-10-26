This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# الحسابات والصلاحيات

- التسجيل العام ينشئ حسابًا بدور `CUSTOMER` فقط.
- لتجهيز مدير المتجر الأول، اضبط `ADMIN_EMAIL` و`ADMIN_NAME` و`ADMIN_PASSWORD` مؤقتًا في PowerShell (كلمة المرور 16 حرفًا على الأقل)، ثم شغّل `npm run provision:admin`. لا تضع كلمة المرور في ملفات المشروع. الأمر لا يغيّر حساب مدير موجودًا ولا يرفع دور حساب عميل.
- يجب أن يكون `AUTH_SECRET` قيمة عشوائية مستقلة بطول 32 حرفًا على الأقل في كل بيئة. ملف `.env.example` يحتوي قيمة توضيحية فقط.
- صفحات الإدارة المحمية تبدأ من `/admin`. استخدم `getCurrentUser` أو `requireRole` في عمليات الخادم؛ فإخفاء عناصر الواجهة وحده لا يفرض الصلاحيات.
- واجهات المصادقة: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, و`GET /api/auth/me`.

# صور المنتجات والتخزين الدائم

رفع الصور في لوحة الإدارة يتطلب مخزنًا متوافقًا مع S3 (مثل AWS S3 أو Cloudflare R2). لا يستخدم التطبيق قرص الخادم حتى تبقى الملفات متاحة بعد إعادة النشر أو تغيير الخادم. يمكن أن يشير `S3_PUBLIC_BASE_URL` إلى نطاق CDN أو نطاق مخصص أمام الحاوية.

اضبط المتغيرات التالية في إعدادات بيئة التشغيل، ولا تضع مفاتيح حقيقية في Git:

```env
S3_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
S3_REGION="auto"
S3_BUCKET="madar-product-images"
S3_PUBLIC_BASE_URL="https://images.example.com"
S3_ACCESS_KEY_ID="..."
S3_SECRET_ACCESS_KEY="..."
```

`S3_ENDPOINT` اختياري مع AWS S3. عند تشغيل التطبيق بهوية IAM، اترك مفتاحي الوصول غير مضبوطين. أنشئ الحاوية وسياسة وصول تتيح للتطبيق كتابة وحذف العناصر، واجعل نطاق الصور قادرًا على قراءتها. في Cloudflare R2، اربط نطاقًا عامًا أو CDN بالحاوية واستخدمه في `S3_PUBLIC_BASE_URL`؛ لا تجعل بيانات اعتماد R2 متاحة للمتصفح.

يقبل الرفع JPEG وPNG وWebP الثابتة فقط، بحد أقصى 8 ميجابايت للصورة و5 صور/20 ميجابايت في الدفعة و12 صورة للمنتج. يتحقق الخادم من التوقيع الفعلي للصورة وفك ترميزها وأبعادها، ثم يدير الاتجاه ويزيل بيانات EXIF ويحوّل الملف إلى WebP قبل التخزين. تُخزن الصور برؤوس تخزين مؤقت طويلة لأن أسماء الكائنات عشوائية وغير قابلة للتغيير. عند غياب إعداد التخزين، يعرض مدير الصور حالة إعداد واضحة ويوقف الرفع.
