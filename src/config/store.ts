export const storeConfig = {
  name: "مدار تك",
  nameEnglish: "MADAR TECH",
  description: "معدات الكمبيوتر والشبكات وملحقاتها",
  slogan: "تقنية تثق بها، وخيارات تناسب احتياجك",
  locale: "ar",
  direction: "rtl",
  currency: "YER",
  navigation: [
    { label: "الرئيسية", href: "/", key: "home" },
    { label: "المنتجات", href: "/products", key: "products" },
    { label: "التصنيفات", href: "/categories", key: "categories" },
    { label: "من نحن", href: "/about", key: "about" },
  ],
} as const;
