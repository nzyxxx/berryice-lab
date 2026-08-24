import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  // 允许局域网设备访问开发服务器（去掉警告）
  allowedDevOrigins: [
    "192.168.0.237", // 你当前这个IP
    "localhost",
    "127.0.0.1",
    "192.168.0.*", // 允许整个局域网（推荐加上）
  ],
};

export default nextConfig;
