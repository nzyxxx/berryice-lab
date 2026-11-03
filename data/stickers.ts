/**
 * 表情工坊的数据模型和示意表情。
 *
 * 全部是示意：标题是编的，GIF 是 `scripts/make-sticker-demos.mts` 程序化画的团子，
 * 不含任何真实素材或客户数据。换成真表情时只换 `demoStickers`，类型不动。
 */

export const stickerTags = ["假笑崩", "VTuber", "游戏反应", "小莓自制"] as const;
export type StickerTag = (typeof stickerTags)[number];

/** `private` 只在保险箱；`showcase` 同时陈列在公开橱窗。 */
export type StickerVisibility = "private" | "showcase";

/** `manual` 是在工坊里自己做的；`feed-stub` 是模拟 Webby 投喂进来的。 */
export type StickerSource = "manual" | "feed-stub";

export interface Sticker {
  id: string;
  title: string;
  /** 一句话心情，卡片副标题 */
  mood: string;
  tags: StickerTag[];
  visibility: StickerVisibility;
  source: StickerSource;
  /** 站内路径或 data: URL */
  src: string;
  bytes: number;
  /** 方形边长（px） */
  edge: number;
  frames: number;
  createdAt: string;
}

/** 微信「文件传输助手 → 长按添加」这条路上，GIF 过了这个体积就加不进表情栏。 */
export const WECHAT_STICKER_LIMIT_BYTES = 300 * 1024;
/** 表情栏里的显示尺寸，再大也只是白占体积。 */
export const WECHAT_STICKER_EDGE = 240;

export function isTag(value: unknown): value is StickerTag {
  return typeof value === "string" && (stickerTags as readonly string[]).includes(value);
}

export const demoStickers: Sticker[] = [
  {
    id: "demo-leiden-hop",
    title: "蕾登蹦一下",
    mood: "开播前的热身",
    tags: ["VTuber"],
    visibility: "showcase",
    source: "manual",
    src: "/stickers/demo/leiden-hop.gif",
    bytes: 19775,
    edge: 240,
    frames: 12,
    createdAt: "2026-10-28T13:00:00.000Z",
  },
  {
    id: "demo-homelander-what",
    title: "祖国人？？？",
    mood: "笑着笑着就崩了",
    tags: ["假笑崩"],
    visibility: "showcase",
    source: "manual",
    src: "/stickers/demo/homelander-what.gif",
    bytes: 19680,
    edge: 240,
    frames: 10,
    createdAt: "2026-10-27T13:00:00.000Z",
  },
  {
    id: "demo-this-one-is-mine",
    title: "这把我的",
    mood: "残血反杀前一秒",
    tags: ["游戏反应"],
    visibility: "private",
    source: "manual",
    src: "/stickers/demo/this-one-is-mine.gif",
    bytes: 13996,
    edge: 240,
    frames: 8,
    createdAt: "2026-10-26T13:00:00.000Z",
  },
  {
    id: "demo-xiaomei-nod",
    title: "小莓点头",
    mood: "收到，在做了",
    tags: ["小莓自制"],
    visibility: "private",
    source: "manual",
    src: "/stickers/demo/xiaomei-nod.gif",
    bytes: 15917,
    edge: 240,
    frames: 10,
    createdAt: "2026-10-25T13:00:00.000Z",
  },
  {
    id: "demo-rainy-slack",
    title: "雨夜摸鱼",
    mood: "下雨天，适合假装在忙",
    tags: ["小莓自制", "假笑崩"],
    visibility: "private",
    source: "manual",
    src: "/stickers/demo/rainy-slack.gif",
    bytes: 21118,
    edge: 240,
    frames: 12,
    createdAt: "2026-10-24T13:00:00.000Z",
  },
];
