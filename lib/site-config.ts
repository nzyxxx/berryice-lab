/** 站点公开配置（备案号等通过环境变量注入，勿写入密钥） */

/** 首页 `<title>` 与分享卡标题。个人站，不把改枪实验室写进封面。 */
export const siteTitle = "小莓流冰 | BerryIce";

export const siteDescription =
  "小莓流冰（BerryIce）的个人站点。项目、文章、实验室、关于与生活。";

/** 不带末尾斜杠的站点绝对地址。metadata、robots、sitemap 都从这里取。 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL ?? "https://berryice.cn";
  return configured.replace(/\/$/, "");
}

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
  displayName: process.env.NEXT_PUBLIC_DISPLAY_NAME ?? "小莓流冰",
  /** 拉丁写法，和中文名一起出现，不单独当站名 */
  latinName: process.env.NEXT_PUBLIC_LATIN_NAME ?? "BerryIce",
  handle: process.env.NEXT_PUBLIC_HANDLE ?? "nzyxxx",
  tags: ["程序员", "游戏玩家", "创作者"],
  bio: process.env.NEXT_PUBLIC_BIO ?? "学无止境",
  avatarSrc: process.env.NEXT_PUBLIC_AVATAR_URL ?? "",
  avatarInitials: process.env.NEXT_PUBLIC_AVATAR_INITIALS ?? "B",
} as const;

export type ModuleId = "delta" | "writing" | "wiki" | "music" | "about" | "games";

/**
 * 访客看见的顺序只有一份：知识库、游戏、歌单、表情、写作、关于。
 * 顶栏、手机菜单、首页六栏都读 `siteIndex`。
 * 三角洲不跟这六项并列，留在 `/delta-gun`，从游戏页进去。
 * `moduleLinks` 仍是旧的六项索引（含三角洲、不含表情），给还在用它的瓦片。
 */
export const moduleLinks: {
  id: ModuleId;
  href: string;
  title: string;
  /** 导航条放不下完整标题时用的短名，缺省就用 title */
  navLabel?: string;
  description: string;
  accent: string;
}[] = [
  {
    id: "wiki",
    href: "/wiki",
    title: "知识库",
    description: "收录进来的笔记。",
    accent: "#7dd3fc",
  },
  {
    id: "games",
    href: "/games",
    title: "游戏",
    description: "按游戏整理攻略与技巧，保留来源与适用版本。",
    accent: "#38bdf8",
  },
  {
    id: "delta",
    href: "/delta-gun",
    title: "三角洲工具",
    navLabel: "三角洲",
    description: "枪械库、社区改枪码、主播配装。",
    accent: "#f97316",
  },
  {
    id: "music",
    href: "/music",
    title: "歌单",
    description: "记在这台浏览器里。",
    accent: "#38bdf8",
  },
  {
    id: "about",
    href: "/about",
    title: "关于",
    description: "我在做什么，以及怎么找到我。",
    accent: "#a78bfa",
  },
  {
    id: "writing",
    href: "/writing",
    title: "写作",
    description: "长文和随记。",
    accent: "#38bdf8",
  },
];

/** 顶栏、手机菜单、首页栏目共用这一份。三角洲不在里面。 */
export const siteIndex = [
  {
    id: "wiki",
    href: "/wiki",
    title: "知识库",
    description: "收录进来的笔记。",
  },
  {
    id: "games",
    href: "/games",
    title: "游戏",
    description: "攻略和技巧，按游戏分开。",
  },
  {
    id: "music",
    href: "/music",
    title: "歌单",
    description: "记在这台浏览器里。",
  },
  {
    id: "stickers",
    href: "/stickers",
    title: "表情",
    description: "方形表情，对外只看橱窗。",
  },
  {
    id: "writing",
    href: "/writing",
    title: "写作",
    description: "长文和随记。",
  },
  {
    id: "about",
    href: "/about",
    title: "关于",
    description: "现在在做什么。",
  },
] as const;

export const headerNav = siteIndex;

/** 当前页。人在三角洲工具里时，顶栏的「游戏」仍是当前项。 */
export function navIsCurrent(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/games") {
    return pathname === "/games" || pathname.startsWith("/games/") || pathname.startsWith("/delta-gun");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

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
