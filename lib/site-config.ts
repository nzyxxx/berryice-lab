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

export type ModuleId = "delta" | "music" | "articles" | "notes" | "contact";

export const moduleLinks: {
  id: ModuleId;
  href: string;
  title: string;
  description: string;
  accent: string;
}[] = [
  {
    id: "delta",
    href: "/delta-gun",
    title: "三角洲",
    description: "查枪械、抄枪码、保存配置。",
    accent: "#f97316",
  },
  {
    id: "music",
    href: "/music",
    title: "音乐",
    description: "正在听的歌单。",
    accent: "#a78bfa",
  },
  {
    id: "articles",
    href: "/articles",
    title: "文章",
    description: "希腊神话与荷马史诗。",
    accent: "#38bdf8",
  },
  {
    id: "notes",
    href: "/notes",
    title: "笔记",
    description: "短想法与片段。",
    accent: "#34d399",
  },
  {
    id: "contact",
    href: "/contact",
    title: "联系",
    description: "Kook 聊天室与邮箱。",
    accent: "#fb7185",
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
