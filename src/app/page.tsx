import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

type HomeProduct = Prisma.ProductGetPayload<{
  include: {
    category: { select: { name: true } };
    images: { orderBy: { sortOrder: "asc" }; take: 1; select: { imageUrl: true; altText: true } };
  };
}>;

function CategoryGlyph({ index }: { index: number }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const drawings = [
    <><rect x="4" y="5" width="16" height="11" rx="2" /><path d="M9 20h6M12 16v4" /></>,
    <><rect x="3.5" y="4" width="17" height="13" rx="2" /><path d="M8 20h8M12 17v3M7 8h10" /></>,
    <><rect x="4" y="6" width="16" height="12" rx="3" /><path d="M8 10h.01M12 10h.01M16 10h.01M8 14h8" /></>,
    <><path d="M5 8.5 12 4l7 4.5v7L12 20l-7-4.5z" /><path d="m5.5 8.7 6.5 4.1 6.5-4.1M12 13v6.5" /></>,
    <><rect x="4" y="8" width="16" height="11" rx="2" /><path d="M8 8V5h8v3M8 12h.01M12 12h.01M16 12h.01M8 15h.01M12 15h.01M16 15h.01" /></>,
    <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="m12 4 .8 5M20 12l-5 .8M12 20l-.8-5M4 12l5-.8" /></>,
  ];

  return <svg aria-hidden="true" viewBox="0 0 24 24" {...common}>{drawings[index % drawings.length]}</svg>;
}

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none"><path d="M4 10h11M10 5l5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function HeroIllustration() {
  return (
    <div className="home-hero-art" aria-label="رسم توضيحي لمكونات تقنية">
      <div className="home-art-orbit home-art-orbit-one" />
      <div className="home-art-orbit home-art-orbit-two" />
      <div className="home-art-grid" />
      <div className="home-art-board">
        <div className="home-board-top"><span /><span /><span /><small>MADAR / TECH</small></div>
        <svg className="home-board-circuit" viewBox="0 0 360 280" fill="none" aria-hidden="true">
          <path d="M20 140h66l28-28h44M340 140h-66l-28 28h-44M180 12v62l28 28v34M180 268v-62l-28-28v-34" stroke="rgba(56,189,248,.58)" strokeWidth="2" />
          <path d="M28 94h38l20 20M332 186h-38l-20-20M132 20v34l20 20M228 260v-34l-20-20" stroke="rgba(2,132,199,.43)" strokeWidth="1.5" />
          <circle cx="180" cy="140" r="82" stroke="rgba(56,189,248,.2)" />
          <circle cx="180" cy="140" r="64" stroke="rgba(56,189,248,.28)" strokeDasharray="3 8" />
          <circle cx="20" cy="140" r="4" fill="#38BDF8" /><circle cx="340" cy="140" r="4" fill="#38BDF8" />
          <circle cx="180" cy="12" r="4" fill="#38BDF8" /><circle cx="180" cy="268" r="4" fill="#38BDF8" />
        </svg>
        <div className="home-chip">
          <div className="home-chip-corners" />
          <span className="home-chip-mark">M</span>
          <span className="home-chip-caption">SMARTER<br />TECH CHOICES</span>
          <span className="home-chip-light" />
        </div>
        <div className="home-board-caption"><span>MT / 01</span><span>TECHNOLOGY, MADE CLEAR</span></div>
      </div>
      <div className="home-float-card home-float-storage"><span className="home-float-icon">▱</span><span><strong>تخزين أسرع</strong><small>SSD · MEMORY</small></span><i /></div>
      <div className="home-float-card home-float-connect"><span className="home-float-icon">⌁</span><span><strong>اتصال أذكى</strong><small>NETWORK · WIFI</small></span><i /></div>
      <div className="home-art-index"><span>01</span><span>ENGINEERED FOR EVERYDAY</span></div>
    </div>
  );
}

function EmptyProducts() {
  return (
    <div className="home-products-state" role="status">
      <div className="home-empty-illustration" aria-hidden="true"><span>▦</span><i /><i /><i /></div>
      <h3>نجهّز لك خيارات تستحق الاكتشاف</h3>
      <p>لا توجد منتجات متاحة للعرض الآن. عُد قريبًا للاطلاع على المنتجات الجديدة.</p>
      <Link href="#categories" className="home-inline-link">تعرّف على أقسامنا <ArrowIcon /></Link>
    </div>
  );
}

async function HomeContent() {
  let categories: Awaited<ReturnType<typeof prisma.category.findMany>> = [];
  let products: HomeProduct[] = [];
  let categoryError = false;
  let productError = false;

  const [categoryResult, productResult] = await Promise.allSettled([
    prisma.category.findMany({ where: { isActive: true, parentId: null }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], take: 6 }),
    prisma.product.findMany({
      where: { status: "ACTIVE", stockQuantity: { gt: 0 }, category: { isActive: true } },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 4,
      include: {
        category: { select: { name: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { imageUrl: true, altText: true } },
      },
    }),
  ]);

  if (categoryResult.status === "fulfilled") categories = categoryResult.value;
  else categoryError = true;
  if (productResult.status === "fulfilled") products = productResult.value;
  else productError = true;

  const advantages = [
    { number: "01", title: "اختيار أوضح", description: "معلومات مرتبة تساعدك على مقارنة الخيارات بهدوء." },
    { number: "02", title: "تقنية أقرب لك", description: "أقسام متنوعة لأجهزة الكمبيوتر والشبكات وملحقاتها." },
    { number: "03", title: "تجربة عربية", description: "تصفح مريح باللغة العربية، من أول خطوة." },
  ];

  return (
    <main className="madar-home">
      <section className="home-hero">
        <div className="home-hero-sheen" aria-hidden="true" />
        <div className="home-hero-inner">
          <div className="home-hero-copy">
            <div className="home-eyebrow"><span /><span>تقنية تختارها بثقة</span><small>MADAR TECH</small></div>
            <h1>مساحتك التقنية،<br /><span>تبدأ من هنا.</span></h1>
            <p>من أجهزة الكمبيوتر إلى تفاصيل الشبكات — اكتشف خيارات عملية، ومعلومات واضحة، وتجربة تسوق صُممت لك.</p>
            <div className="home-hero-actions">
              <Link className="home-button home-button-primary" href="#categories">اكتشف الأقسام <ArrowIcon /></Link>
              <Link className="home-button home-button-quiet" href="#available-products">شاهد المنتجات <span aria-hidden="true">↓</span></Link>
            </div>
            <div className="home-proofline"><span><i>✓</i> خيارات تقنية متنوعة</span><b /><span><i>✓</i> تصفح عربي مريح</span></div>
          </div>
          <HeroIllustration />
        </div>
        <div className="home-hero-foot"><span>01 / اكتشف ما يناسبك</span><span>COMPUTING · NETWORKS · MORE</span></div>
      </section>

      <section className="home-value-strip" aria-label="مميزات مدار تك">
        <div><span className="value-mark">01</span><span><strong>تقنية لكل يوم</strong><small>منتجات تلائم احتياجاتك</small></span></div>
        <i />
        <div><span className="value-mark">02</span><span><strong>تفاصيل مفهومة</strong><small>معلومات منظمة وواضحة</small></span></div>
        <i />
        <div><span className="value-mark">03</span><span><strong>من مكان واحد</strong><small>كمبيوتر، تخزين، وشبكات</small></span></div>
      </section>

      <section className="home-categories home-section" id="categories">
        <div className="home-section-heading">
          <div><span className="home-kicker">تصفّح بطريقتك <b>—</b> 01</span><h2>ابدأ من <em>اهتمامك.</em></h2><p>أقسام مختارة لتصل إلى عالم التقنية الذي تبحث عنه.</p></div>
          <span className="home-heading-side">FIND YOUR<br />NEXT UPGRADE <i>↙</i></span>
        </div>

        {categoryError ? <div className="home-message home-message-error"><span>!</span><div><strong>تعذر تحميل الأقسام</strong><p>الخدمة غير متاحة الآن. حاول تحديث الصفحة بعد قليل.</p></div></div> : categories.length === 0 ? <div className="home-message"><span>⌁</span><div><strong>تُضاف الأقسام قريبًا</strong><p>نعمل على تجهيز أقسام المتجر لتسهيل وصولك.</p></div></div> : (
          <div className="home-category-grid">
            {categories.map((category, index) => <Link className="home-category-card" href={`/categories/${category.slug}`} key={category.id}>
              <div className="home-category-top"><span className="home-category-icon"><CategoryGlyph index={index} /></span><span className="home-category-index">0{index + 1}</span></div>
              <div className="home-category-copy"><h3>{category.name}</h3><p>{category.description || "خيارات تقنية مختارة لتجهيزك القادم."}</p></div>
              <span className="home-category-rule" /><span className="home-category-arrow" aria-hidden="true">↗</span>
            </Link>)}
          </div>
        )}
      </section>

      <section className="home-products-section" id="available-products">
        <div className="home-section home-products-inner">
          <div className="home-section-heading">
            <div><span className="home-kicker">من الكتالوج <b>—</b> 02</span><h2>خيارات <em>تستحق النظر.</em></h2><p>منتجات نشطة ومتوفرة، تُحدّث مباشرة من كتالوج المتجر.</p></div>
            <span className="home-product-count">{productError ? "—" : String(products.length).padStart(2, "0")}<small>منتجات</small></span>
          </div>

          {productError ? <div className="home-products-state home-products-error" role="alert"><div className="home-state-symbol">↻</div><div><h3>تعذر تحميل المنتجات</h3><p>واجهنا مشكلة في الاتصال بالكتالوج. أعد المحاولة بعد قليل.</p></div></div> : products.length === 0 ? <EmptyProducts /> : (
            <div className="home-product-grid">
              {products.map((product, index) => <Link href={`/products/${product.slug}`} className="home-product-card" key={product.id}>
                <div className={`home-product-art product-art-${index + 1}`}>
                  {product.images[0] ? <Image src={product.images[0].imageUrl} alt={product.images[0].altText || product.name} fill sizes="(max-width: 640px) 90vw, (max-width: 1000px) 45vw, 25vw" unoptimized /> : <div className="home-product-placeholder" aria-hidden="true"><span>{index % 2 === 0 ? "▱" : "⌘"}</span><i /><i /></div>}
                  {product.isFeatured && <span className="home-featured-label">اختيار مميز</span>}
                  <span className="home-stock-label"><i /> متوفر</span>
                </div>
                <div className="home-product-info"><span className="home-product-category">{product.category.name}</span><h3>{product.name}</h3><div className="home-product-price"><strong>{product.price.toFixed(2)} <small>ر.ي</small></strong>{product.compareAtPrice && <del>{product.compareAtPrice.toFixed(2)} ر.ي</del>}</div></div>
              </Link>)}
            </div>
          )}
        </div>
      </section>

      <section className="home-approach home-section">
        <div className="home-section-heading"><div><span className="home-kicker">اختيارات أذكى <b>—</b> 03</span><h2>البساطة، <em>بلمسة تقنية.</em></h2><p>نجعل رحلة الاختيار أقرب وأسهل، من التصفح حتى العثور على ما يناسبك.</p></div></div>
        <div className="home-advantage-grid">{advantages.map((item) => <article className="home-advantage" key={item.number}><span>{item.number}</span><div className="home-advantage-line" /><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>
      </section>

      <section className="home-join-cta">
        <div className="home-cta-orb" aria-hidden="true" /><div className="home-cta-copy"><span>نرتب لك عالم التقنية</span><h2>خطوتك القادمة<br />تبدأ باختيار أبسط.</h2><p>أنشئ حسابًا لتكون جاهزًا لمتابعة مشترياتك وخياراتك في مدار تك.</p></div><Link className="home-button home-button-cta" href="/register">أنشئ حسابك <ArrowIcon /></Link>
        <span className="home-cta-signature">MADAR TECH <i>®</i><small>TECHNOLOGY, MADE CLEAR</small></span>
      </section>
    </main>
  );
}

export default function HomePage() {
  return <Suspense fallback={<main className="madar-home"><div className="home-products-state" aria-live="polite">جارٍ تجهيز المتجر…</div></main>}><HomeContent /></Suspense>;
}
