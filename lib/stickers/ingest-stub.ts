import type { Sticker, StickerTag } from "@/data/stickers";

/**
 * 投喂入库的接口约定，**只有类型，没有写入**。
 *
 * 以后 Webby 整理完一张表情，会像 Bear 收录笔记那样直接推到站上：
 *
 *   POST /api/stickers/ingest
 *   Authorization: Bearer <STICKER_ADMIN_TOKEN>
 *   Content-Type: application/json
 *   { eventId, title, mood, tags, gif: { encoding: "base64", data } }
 *
 * 和 `/api/wiki/ingest` 同一套约定：
 * - 口令只在服务端环境变量里，没配就一律 401；不进仓库，不进 `NEXT_PUBLIC_*`。
 * - 幂等：同一个 `eventId` 再推一次返回 `{ ok: true, created: false }`，不重复入库，方便 webhook 重试。
 * - 入库默认 `visibility: "private"`，上橱窗只在保险箱里手动点。
 * - `gif` 由 Webby 侧的 ffmpeg 先转成方形、≤300KB；服务端只校验，不转码。
 *
 * 知识库那边的双写钩子（一篇笔记里的 GIF 同时进保险箱）只写在这里，`/api/wiki/ingest` 不动。
 */
export interface StickerIngestRequest {
  eventId: string;
  title: string;
  mood: string;
  tags: StickerTag[];
  gif: { encoding: "base64"; data: string };
}

export type StickerIngestResponse =
  | { ok: true; id: string; created: boolean }
  | { ok: false; message: string };

export const FEED_STUB_EVENT_ID = "webby-feed-demo-0001";

/**
 * 原型里的「模拟 Webby 投喂」：返回一张写死的示意表情，等价于上面那次 POST 成功后入库的结果。
 * id 取自 eventId，所以重复投喂落在同一条上，保险箱按 id 去重。
 */
export function simulateWebbyFeed(now: Date = new Date()): Sticker {
  return {
    id: `feed-${FEED_STUB_EVENT_ID}`,
    title: "蕾登转圈",
    mood: "Webby 从知识库里捞出来的",
    tags: ["VTuber"],
    visibility: "private",
    source: "feed-stub",
    src: "/stickers/demo/feed-spin.gif",
    bytes: 19449,
    edge: 240,
    frames: 12,
    createdAt: now.toISOString(),
  };
}
