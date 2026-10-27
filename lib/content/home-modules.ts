/**
 * 首页栏目。以后加一块，就往这个数组里追加一条。
 *
 * - `href`：整张卡片进这个地址。
 * - `entries`：卡片里的条目。有 `href` 才是链接；没写完就不要填空字符串。
 * - `badge`：占位卡片上的小药丸，例如「即将上线」。首页不渲染这些卡。有真实去处的不要填。
 * 改枪实验室只是「实验室」里的一条，不要单独做成首页主区块。
 */

export const homeIntro = "项目、文章和实验。写完的才会放上来。";

export interface HomeModuleEntry {
  title: string;
  description?: string;
  href?: string;
}

export interface HomeModule {
  id: string;
  title: string;
  description?: string;
  href?: string;
  badge?: string;
  entries?: HomeModuleEntry[];
}

export const homeModules: HomeModule[] = [
  {
    id: "works",
    title: "项目 / 作品",
    description: "做过的东西。还没往上放。",
    badge: "即将上线",
  },
  {
    id: "writing",
    title: "文章",
    description: "写完的长文和随记。",
    href: "/writing",
  },
  {
    id: "lab",
    title: "实验室",
    description: "在做的实验。",
    entries: [
      {
        title: "三角洲",
        description: "枪械库、社区改枪码、主播配装。",
        href: "/delta-gun",
      },
    ],
  },
  {
    id: "about",
    title: "关于我",
    description: "现在在做什么，以及怎么找到我。",
    href: "/about",
  },
  {
    id: "life",
    title: "生活 / 兴趣",
    description: "日常和喜欢的事。还没往上放。",
    badge: "即将上线",
  },
  {
    id: "more",
    title: "更多",
    description: "还没归类的内容。",
    badge: "即将上线",
  },
];
