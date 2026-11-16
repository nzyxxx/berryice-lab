/**
 * 首页底部的公开入口。和顶栏、页脚用同一批真实地址。
 * 游戏进 `/games`，不拿三角洲的枪当全部游戏的封面。
 * 没有地址的占位栏目不放进来。
 */
export const homeChannels = [
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
    id: "about",
    href: "/about",
    title: "关于",
    description: "现在在做什么。",
  },
  {
    id: "writing",
    href: "/writing",
    title: "写作",
    description: "长文和随记。",
  },
] as const;

export type HomeChannelId = (typeof homeChannels)[number]["id"];
