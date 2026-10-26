import Link from "next/link";

const categories = [
  {
    number: "01",
    symbol: "▣",
    title: "أجهزة الكمبيوتر",
    description: "خيارات الحواسيب ومكوناتها الأساسية.",
    href: "/categories/computers",
    className: "category-blue",
  },
  {
    number: "02",
    symbol: "▤",
    title: "الشاشات",
    description: "شاشات للاستخدام اليومي والعمل.",
    href: "/categories/monitors",
    className: "category-violet",
  },
  {
    number: "03",
    symbol: "◈",
    title: "التخزين والذاكرة",
    description: "وحدات SSD والأقراص والذاكرة.",
    href: "/categories/storage",
    className: "category-cyan",
  },
  {
    number: "04",
    symbol: "⌁",
    title: "الشبكات والاتصالات",
    description: "أجهزة الشبكات والراوترات وملحقاتها.",
    href: "/categories/networking",
    className: "category-navy",
  },
  {
    number: "05",
    symbol: "⌘",
    title: "ملحقات الكمبيوتر",
    description: "ملحقات تساعدك على إكمال تجهيزك.",
    href: "/categories/accessories",
    className: "category-orange",
  },
  {
    number: "06",
    symbol: "⚙",
    title: "مكونات الكمبيوتر",
    description: "مكونات لترقية الأجهزة وتجهيزها.",
    href: "/categories/components",
    className: "category-green",
  },
];

const benefits = [
  {
    number: "01",
    title: "تفاصيل واضحة",
    description: "عرض معلومات المنتجات ومواصفاتها بصورة منظمة تساعدك على الاختيار.",
  },
  {
    number: "02",
    title: "تصفح منظم",
    description: "الوصول إلى الفئات المطلوبة دون الحاجة إلى التنقل العشوائي.",
  },
  {
    number: "03",
    title: "استلام من المتجر",
    description: "تجربة طلب مصممة للاستلام من المتجر دون افتراض توفر التوصيل.",
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="hero-section">
        <div className="hero-glow hero-glow-one" aria-hidden="true" />
        <div className="hero-glow hero-glow-two" aria-hidden="true" />

        <div className="hero-content">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            عالم الكمبيوتر والشبكات
          </div>

          <h1>
            جهّز عالمك التقني
            <br />
            <span>بثقة ووضوح.</span>
          </h1>

          <p className="hero-description">
            اكتشف معدات الكمبيوتر والشاشات والتخزين وأجهزة الشبكات
            في تجربة تسوق عربية بسيطة، منظمة، ومصممة لاحتياجك.
          </p>

          <div className="hero-actions">
            <Link className="button-primary" href="/categories">
              استكشف التصنيفات
              <span aria-hidden="true">←</span>
            </Link>
            <Link className="button-secondary" href="/products">
              تصفح المنتجات
            </Link>
          </div>

          <div className="hero-trust">
            <span className="trust-check" aria-hidden="true">✓</span>
            <span>معلومات واضحة</span>
            <span className="trust-divider" />
            <span className="trust-check" aria-hidden="true">✓</span>
            <span>استلام من المتجر</span>
          </div>
        </div>

        <div className="hero-visual" aria-label="هوية بصرية تقنية">
          <div className="visual-orbit orbit-one" />
          <div className="visual-orbit orbit-two" />
          <div className="visual-grid" />
          <div className="visual-core">
            <div className="core-topline">
              <span />
              <span />
              <span />
              <small>MADAR / TECH</small>
            </div>
            <div className="core-symbol" aria-hidden="true">M</div>
            <div className="core-caption">TECHNOLOGY & NETWORKS</div>
            <div className="core-line" />
          </div>
          <div className="floating-chip chip-one">
            <span aria-hidden="true">◈</span>
            <span><strong>Storage</strong><small>SSD & Memory</small></span>
          </div>
          <div className="floating-chip chip-two">
            <span aria-hidden="true">⌁</span>
            <span><strong>Networking</strong><small>Connect smarter</small></span>
          </div>
          <div className="visual-label">BUILT FOR YOUR TECH NEEDS</div>
        </div>

        <div className="hero-bottom-line">
          <span>01 / اكتشف الفئات</span>
          <span>مدار تك — خيارات تقنية أوضح</span>
        </div>
      </section>

      <section className="categories-section section-container" id="categories">
        <div className="section-heading">
          <div>
            <span className="section-kicker">تصفح حسب احتياجك</span>
            <h2>كل ما تحتاجه، <span>في مكان واحد.</span></h2>
            <p>
              ابدأ من التصنيف المناسب للوصول إلى المنتجات التي تبحث عنها.
            </p>
          </div>
          <Link className="text-link" href="/categories">
            جميع التصنيفات <span aria-hidden="true">←</span>
          </Link>
        </div>

        <div className="category-grid">
          {categories.map((category) => (
            <Link
              className={`category-card ${category.className}`}
              href={category.href}
              key={category.number}
            >
              <div className="category-card-top">
                <span className="category-symbol" aria-hidden="true">
                  {category.symbol}
                </span>
                <span className="category-number">{category.number}</span>
              </div>
              <h3>{category.title}</h3>
              <p>{category.description}</p>
              <span className="category-arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
        <p className="catalog-note">
          تصنيفات المتجر المعروضة هنا تمثل أقسام التصفح؛ ستظهر المنتجات الفعلية
          وأسعارها عند ربط الكتالوج بقاعدة البيانات.
        </p>
      </section>

      <section className="catalog-preview">
        <div className="catalog-preview-inner">
          <div className="catalog-icon" aria-hidden="true">▦</div>
          <div className="catalog-copy">
            <span className="section-kicker">كتالوج المنتجات</span>
            <h2>اختيارك يبدأ من المعلومات الصحيحة.</h2>
            <p>
              ستُعرض هنا المنتجات المسجلة في المتجر مع صورها ومواصفاتها
              وأسعارها وحالة توفرها بعد تجهيز قاعدة البيانات.
            </p>
          </div>
          <div className="catalog-status">
            <span className="status-dot" />
            <span>ربط الكتالوج في المرحلة القادمة</span>
          </div>
        </div>
      </section>

      <section className="benefits-section section-container">
        <div className="section-heading benefits-heading">
          <div>
            <span className="section-kicker">تجربة تسوق أبسط</span>
            <h2>تجربة واضحة <span>من البداية.</span></h2>
            <p>نركز على تنظيم المعلومات وتسهيل الوصول إلى ما تحتاجه.</p>
          </div>
        </div>

        <div className="benefits-grid">
          {benefits.map((benefit) => (
            <article className="benefit-card" key={benefit.number}>
              <span className="benefit-number">{benefit.number}</span>
              <div className="benefit-line" />
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="closing-cta">
        <div>
          <span className="section-kicker">MADAR TECH</span>
          <h2>هل تبحث عن قطعة أو جهاز محدد؟</h2>
          <p>
            سنضيف في المراحل القادمة البحث والكتالوج الحقيقي وطلب المنتجات
            غير المتوفرة.
          </p>
        </div>
        <Link className="button-primary" href="/categories">
          ابدأ التصفح <span aria-hidden="true">←</span>
        </Link>
      </section>
    </main>
  );
}
