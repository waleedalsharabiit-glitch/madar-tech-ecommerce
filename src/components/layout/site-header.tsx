import Link from "next/link";
import { storeConfig } from "@/config/store";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-announcement">
        <div className="site-container announcement-inner">
          <span>مرحبًا بك في مدار تك — وجهتك لمعدات الكمبيوتر والشبكات</span>
          <span className="announcement-secondary">الجودة والاختيار في مكان واحد</span>
        </div>
      </div>

      <div className="site-container header-main">
        <Link
          className="store-brand"
          href="/"
          aria-label={`الصفحة الرئيسية لمتجر ${storeConfig.name}`}
        >
          <span className="brand-symbol" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>

          <span className="brand-text">
            <strong>{storeConfig.name}</strong>
            <small>{storeConfig.nameEnglish}</small>
          </span>
        </Link>

        <form className="store-search" action="/search" method="get" role="search">
          <label className="visually-hidden" htmlFor="store-search-input">
            ابحث عن منتج
          </label>

          <span className="search-symbol" aria-hidden="true">
            ⌕
          </span>

          <input
            id="store-search-input"
            name="q"
            type="search"
            placeholder="ابحث عن كمبيوتر، شاشة، SSD، أو جهاز شبكة..."
            autoComplete="off"
          />

          <button type="submit">بحث</button>
        </form>

        <Link className="header-account-link" href="/account">
          <span className="account-symbol" aria-hidden="true">
            ♙
          </span>
          <span>
            <small>مرحبًا بك</small>
            <strong>حسابي</strong>
          </span>
        </Link>
      </div>

      <nav className="store-navigation" aria-label="القائمة الرئيسية">
        <div className="site-container navigation-inner">
          <div className="navigation-links">
            {storeConfig.navigation.map((item) => (
              <Link
                className={
                  item.key === "home"
                    ? "navigation-link navigation-link-active"
                    : "navigation-link"
                }
                href={item.href}
                key={item.key}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <span className="navigation-note">
            <span className="navigation-status" aria-hidden="true" />
            اكتشف منتجات التقنية
          </span>
        </div>
      </nav>
    </header>
  );
}
