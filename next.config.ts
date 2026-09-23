import type { NextConfig } from "next";

const lowMemDeploy = process.env.SKIP_TYPECHECK === "1";

const nextConfig: NextConfig = {
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
