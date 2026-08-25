import { SiteAtmosphere } from "@/components/atmosphere/site-atmosphere";
import { ThemeProvider } from "@/components/lab/theme-provider";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://berryice.cn";
const siteTitle = "BerryIce Lab | 个人学习实验室";
const siteDescription =
  "BerryIce 的个人入口：三角洲改枪实验室、主播枪码、社区配装与学习记录。";

export const metadata: Metadata = {
  // 有了 metadataBase，OG / Twitter 里的相对图片路径才会被补成绝对地址
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | BerryIce Lab",
  },
  description: siteDescription,
  applicationName: "BerryIce Lab",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: siteUrl,
    siteName: "BerryIce Lab",
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
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
