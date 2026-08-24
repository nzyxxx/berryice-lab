/** 站点公开配置（备案号等通过环境变量注入，勿写入密钥） */

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "BerryIce Lab",
  tagline: process.env.NEXT_PUBLIC_SITE_TAGLINE ?? "个人学习实验室",
  /** 工信部 ICP 备案号（berryice.cn） */
  icpNumber: process.env.NEXT_PUBLIC_ICP_NUMBER ?? "京ICP备2026010734号-1",
  icpUrl: process.env.NEXT_PUBLIC_ICP_URL ?? "https://beian.miit.gov.cn/",
  policeNumber: process.env.NEXT_PUBLIC_POLICE_ICP ?? "京公网安备11011202101750号",
  policeUrl:
    process.env.NEXT_PUBLIC_POLICE_ICP_URL ??
    "http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=11011202101750",
  copyrightYear: new Date().getFullYear(),
} as const;
