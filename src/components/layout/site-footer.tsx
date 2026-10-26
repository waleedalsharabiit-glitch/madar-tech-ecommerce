import Link from "next/link";
import { storeConfig } from "@/config/store";

const footerGroups = [
  {
    title: "تصفح المتجر",
    links: [
      { label: "الرئيسية", href: "/" },
      { label: "المنتجات", href: "/products" },
      { label: "التصنيفات", href: "/categories" },
    ],
  },
  {
    title: "خدمة العملاء",
    links: [
      { label: "حسابي", href: "/account" },
      { label: "طلبات المنتجات", href: "/product-requests" },
      { label: "تواصل معنا", href: "/contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link href="/" className="footer-logo" aria-label={storeConfig.name}>
            <span className="brand-mark" aria-hidden="true">M</span>
            <span>
              <strong>{storeConfig.name}</strong>
              <small>{storeConfig.nameEnglish}</small>
            </span>
          </Link>
          <p>
            وجهتك لمعدات الكمبيوتر والشاشات والتخزين وأجهزة الشبكات
            وملحقاتها، بتجربة تسوق واضحة وسهلة.
          </p>
          <span className="footer-note">
            التقنية المناسبة تبدأ بالاختيار الصحيح.
          </span>
        </div>

        {footerGroups.map((group) => (
          <div className="footer-group" key={group.title}>
            <h2>{group.title}</h2>
            <ul>
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="footer-group footer-pickup">
          <h2>الاستلام من المتجر</h2>
          <p>
            اختر احتياجك، وتعرّف على تفاصيل المنتج عند توفره، ثم استكمل
            طلبك وفق خيارات الاستلام المتاحة.
          </p>
          <span className="pickup-badge">
            <span aria-hidden="true">✓</span>
            الاستلام من المتجر
          </span>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {2026} {storeConfig.name}. جميع الحقوق محفوظة.</p>
        <span>صُمم لتجربة عربية واضحة وسهلة الاستخدام</span>
      </div>
    </footer>
  );
}
