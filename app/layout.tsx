import { SiteAtmosphere } from "@/components/atmosphere/site-atmosphere";
import { ThemeProvider } from "@/components/lab/theme-provider";
import { siteDescription } from "@/lib/site-config";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";

/**
 * 字体文件放在仓库里，不走 next/font/google。
 *
 * google 那个加载器在 `next build` 时向 fonts.gstatic.com 拉文件。
 * 国内 ECS 连不上 Google，连接会停在 D 状态，构建卡在
 * “Creating an optimized production build”十几分钟，Ctrl+C 也杀不掉。
 * 这里的写法对齐 geist 包自己的加载方式：可变字体，字重 100–900。
 */
const geistSans = localFont({
  src: "./fonts/Geist-Variable.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  adjustFontFallback: false,
  weight: "100 900",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://berryice.cn";
/** 没单独写 title 的页面（含三角洲子页）继续用这个，避免整库枪械页的标签被首页标题盖掉。 */
const fallbackTitle = "BerryIce Lab | 个人学习实验室";

export const metadata: Metadata = {
  // 有了 metadataBase，OG / Twitter 里的相对图片路径才会被补成绝对地址
  metadataBase: new URL(siteUrl),
  title: {
    default: fallbackTitle,
    template: "%s | BerryIce Lab",
  },
  description: siteDescription,
  applicationName: "BerryIce Lab",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: siteUrl,
    siteName: "BerryIce Lab",
    title: fallbackTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: fallbackTitle,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="zh-CN"
      className={`dark ${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen font-sans">
        <Script id="berryice-theme" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <ThemeProvider>
          {/* 气候层放在 template 之外，跨路由不卸载，雨才是连续的 */}
          <SiteAtmosphere />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
