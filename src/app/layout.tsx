import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { storeConfig } from "@/config/store";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${storeConfig.name} | معدات الكمبيوتر والشبكات`,
    template: `%s | ${storeConfig.name}`,
  },
  description:
    "متجر متخصص في معدات الكمبيوتر والشاشات والتخزين وأجهزة الشبكات وملحقاتها.",
  applicationName: storeConfig.name,
  keywords: [
    "مدار تك",
    "كمبيوتر",
    "شاشات",
    "شبكات",
    "SSD",
    "راوتر",
    "ملحقات الكمبيوتر",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0284c7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}

