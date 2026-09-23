/** 站点公开配置（备案号等通过环境变量注入，勿写入密钥） */

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "BerryIce Lab",
  tagline: process.env.NEXT_PUBLIC_SITE_TAGLINE ?? "程序员 · 游戏玩家 · 创作者",
  /** 工信部 ICP 备案号（berryice.cn） */
  icpNumber: process.env.NEXT_PUBLIC_ICP_NUMBER ?? "京ICP备2026010734号-1",
  icpUrl: process.env.NEXT_PUBLIC_ICP_URL ?? "https://beian.miit.gov.cn/",
  policeNumber: process.env.NEXT_PUBLIC_POLICE_ICP ?? "京公网安备11011202101750号",
  policeUrl:
    process.env.NEXT_PUBLIC_POLICE_ICP_URL ??
    "http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=11011202101750",
  copyrightYear: new Date().getFullYear(),
} as const;

export const profileConfig = {
  displayName: process.env.NEXT_PUBLIC_DISPLAY_NAME ?? "BerryIce",
  handle: process.env.NEXT_PUBLIC_HANDLE ?? "berryice",
  tags: ["程序员", "游戏玩家", "创作者"],
  bio:
    process.env.NEXT_PUBLIC_BIO ??
    "写代码、改枪、听音乐。三角洲是我的主项目。",
  avatarSrc: process.env.NEXT_PUBLIC_AVATAR_URL ?? "",
  avatarInitials: process.env.NEXT_PUBLIC_AVATAR_INITIALS ?? "B",
} as const;

export type ModuleId = "delta" | "writing" | "about";

/**
 * 门户只有三个去处。
 *
 * 之前是五个平级模块（三角洲 / 音乐 / 文章 / 笔记 / 联系），
 * 结果唯一有完整主路径的三角洲被摊薄成五分之一，跟三个占位页平起平坐。
 * 文章和笔记本来就是同一件事的长短两种形态，合成「写作」；
 * 音乐和联系都是「关于我」的下属信息，降级成 /about 里的两段。
 */
export const moduleLinks: {
  id: ModuleId;
  href: string;
  title: string;
  /** 导航条放不下完整标题时用的短名，缺省就用 title */
  navLabel?: string;
  description: string;
  accent: string;
  /** 门户里占满整行的主模块 */
  featured?: boolean;
}[] = [
  {
    id: "delta",
    href: "/delta-gun",
    title: "三角洲改枪实验室",
    navLabel: "三角洲",
    description: "查枪械、抄社区枪码、看主播配装、保存自己的方案。",
    accent: "#f97316",
    featured: true,
  },
  {
    id: "writing",
    href: "/writing",
    title: "写作",
    description: "长文与随记。",
    accent: "#38bdf8",
  },
  {
    id: "about",
    href: "/about",
    title: "关于",
    description: "我在做什么，以及怎么找到我。",
    accent: "#a78bfa",
  },
];

export type SocialIconId = "github" | "repo" | "kook" | "x" | "bilibili" | "mail";

const SOCIAL_LINK_CANDIDATES: {
  id: SocialIconId;
  label: string;
  href: string;
}[] = [
  {
    id: "github",
    label: "GitHub",
    href: process.env.NEXT_PUBLIC_SOCIAL_GITHUB ?? "https://github.com/nzyxxx",
  },
  {
    id: "repo",
    label: "本站源码",
    href: process.env.NEXT_PUBLIC_SOCIAL_REPO ?? "https://github.com/nzyxxx/berryice-lab",
  },
  {
    id: "kook",
    label: "Kook 聊天室",
    href: process.env.NEXT_PUBLIC_SOCIAL_KOOK ?? "https://www.kookapp.cn/",
  },
  {
    id: "x",
    label: "X",
    href: process.env.NEXT_PUBLIC_SOCIAL_X ?? "",
  },
  {
    id: "bilibili",
    label: "哔哩哔哩",
    href: process.env.NEXT_PUBLIC_SOCIAL_BILIBILI ?? "",
  },
  {
    id: "mail",
    label: "邮箱",
    href: process.env.NEXT_PUBLIC_CONTACT_EMAIL
      ? `mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`
      : "",
  },
];

export const socialLinks = SOCIAL_LINK_CANDIDATES.filter((item) => item.href.length > 0);
