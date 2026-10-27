import type { NextConfig } from "next";

const lowMemDeploy = process.env.SKIP_TYPECHECK === "1";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // 只作用于带数字 revalidate 的 ISR 页（主播页、sitemap）。
  // 静态页的 Cache-Control 仍是 s-maxage=31536000，没有 stale-while-revalidate。
  // 3600 的 revalidate 配上 7200，得到 s-maxage=3600, stale-while-revalidate=3600。
  expireTime: 7200,
  // 只在发布脚本里生效。本机 yarn build 仍做类型检查、仍用默认并行。
  // 线上是 2 vCPU / 2 GiB。tsc 再加默认 4 个静态生成 worker 会把内存顶满，
  // 两颗核都去换页，表现为构建挂住十几分钟。这里跳过 tsc，并且只用 1 个 worker，
  // 留一颗核给系统和正在跑的站点。
  typescript: {
    ignoreBuildErrors: lowMemDeploy,
  },
  ...(lowMemDeploy
    ? {
        experimental: {
          cpus: 1,
        },
      }
    : {}),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "playerhub.df.qq.com",
        pathname: "/playerhub/**",
      },
      {
        protocol: "https",
        hostname: "g.aitags.cn",
        pathname: "/wp-content/**",
      },
      {
        protocol: "https",
        hostname: "zzz.sanyueqi.cn",
        pathname: "/public/**",
      },
      {
        protocol: "https",
        hostname: "www.beian.gov.cn",
        pathname: "/img/**",
      },
    ],
  },
  /**
   * 2026-09 模块收敛留下的旧路由。
   * 用 308 而不是 307：这四个地址不会再回来了，让浏览器和搜索引擎把它记死，
   * 省得每次访问都先打一次旧地址。
   */
  async redirects() {
    return [
      { source: "/articles", destination: "/writing", permanent: true },
      { source: "/notes", destination: "/writing", permanent: true },
      { source: "/music", destination: "/about", permanent: true },
      { source: "/contact", destination: "/about", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          {
            // 只报告、不拦截。Next 的 RSC 内联脚本和主题脚本需要 unsafe-inline，
            // 图片来自备案图标和枪械图床。强制 CSP 前先用报告模式看控制台。
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "frame-ancestors 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self'",
              "connect-src 'self'",
              "media-src 'self'",
              "worker-src 'self' blob:",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  // 允许局域网设备访问开发服务器（去掉 HMR 跨域警告）
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.31.36",
    "192.168.31.*",
    "192.168.0.*",
    "192.168.1.*",
  ],
};

export default nextConfig;
