/**
 * 情境碎碎念分桶。同一句只活在一个桶里。
 * 忙着思考时桶是空的，对齐忙时闭嘴：不抽发呆甜句。
 * 只排冷却和选句，不碰 DOM、不留 rAF、不上本地朗读。
 */

import { shouldSuppressIdleChatter, type XiaomeiChatStatus } from "./xiaomei-fsm";
import {
  pickTaggedLine,
  XIAOMEI_MUTTER_LINES,
  XIAOMEI_PAGE_MUTTER_LINES,
  XIAOMEI_PET_LINES,
  XIAOMEI_REAWAKE_LINES,
  type XiaomeiPageKind,
  type XiaomeiSpokenLine,
} from "./xiaomei-lines";
import type { XiaomeiTone } from "./xiaomei-memory";

/** 发呆 / 思考（空）/ 盯页 / 忙完回神 / 摸头。 */
export const XIAOMEI_CHATTER_BUCKETS = ["idle", "thinking", "page", "reawaken", "touch"] as const;

export type XiaomeiChatterBucket = (typeof XIAOMEI_CHATTER_BUCKETS)[number];

export type XiaomeiChatterRoute =
  | { bucket: "idle" | "thinking" | "reawaken" | "touch" }
  | { bucket: "page"; page: XiaomeiPageKind };

/**
 * 两次闲话至少隔这么久。比待机动作间隔长一截，避免几秒一句。
 * 上沿再拉开，避免整点报时。
 */
export const XIAOMEI_CHATTER_GAP_MS = { min: 14_000, max: 28_000 } as const;

export function chatterGapMs(roll: number): number {
  const unit = !Number.isFinite(roll) || roll <= 0 ? 0 : roll >= 1 ? 1 : roll;
  const { min, max } = XIAOMEI_CHATTER_GAP_MS;
  return Math.round(min + unit * (max - min));
}

/** 有气泡、静音、开着窗、或间隔没到，就不许再开口。 */
export function canChatter(input: {
  now: number;
  lastAt: number;
  minGapMs: number;
  blocked: boolean;
}): boolean {
  if (input.blocked) return false;
  if (!Number.isFinite(input.now) || !Number.isFinite(input.lastAt) || !Number.isFinite(input.minGapMs)) {
    return false;
  }
  if (input.minGapMs < 0 || input.lastAt < 0) return false;
  return input.now - input.lastAt >= input.minGapMs;
}

/**
 * 便宜的「她在看哪一栏」：地址栏路径。首页和预览不当成盯页。
 * 没有路径就当发呆，不发明她看见了屏幕上的字。
 */
export function pageKindFromPath(pathname: string | null | undefined): XiaomeiPageKind | null {
  if (!pathname) return null;
  const path = pathname.split("?")[0]?.split("#")[0]?.replace(/\/+$/, "") || "/";
  if (path === "/" || path.startsWith("/preview") || path.startsWith("/admin")) return null;
  if (path === "/wiki" || path.startsWith("/wiki/")) return "wiki";
  if (path === "/writing" || path.startsWith("/writing/")) return "writing";
  if (path === "/delta-gun" || path.startsWith("/delta-gun/")) return "guns";
  if (path === "/about" || path.startsWith("/about/")) return "about";
  return null;
}

/**
 * 思考压过一切（包括摸头和回神）。睡着不说话。
 * 回神只抢在盯页和发呆前面，说完由调用方清掉。
 */
export function resolveChatterBucket(input: {
  status: XiaomeiChatStatus;
  pathname?: string | null;
  reawaken?: boolean;
  touch?: boolean;
  sleeping?: boolean;
}): XiaomeiChatterRoute | null {
  if (shouldSuppressIdleChatter(input.status)) return { bucket: "thinking" };
  if (input.sleeping) return null;
  if (input.touch) return { bucket: "touch" };
  if (input.reawaken) return { bucket: "reawaken" };
  const page = pageKindFromPath(input.pathname);
  if (page) return { bucket: "page", page };
  return { bucket: "idle" };
}

export function chatterLines(route: XiaomeiChatterRoute | null): readonly XiaomeiSpokenLine[] {
  if (!route) return [];
  if (route.bucket === "thinking") return [];
  if (route.bucket === "idle") return XIAOMEI_MUTTER_LINES;
  if (route.bucket === "reawaken") return XIAOMEI_REAWAKE_LINES;
  if (route.bucket === "touch") return XIAOMEI_PET_LINES;
  if (route.bucket === "page") return XIAOMEI_PAGE_MUTTER_LINES[route.page];
  return [];
}

/** 空桶返回 null，不拿格言垫一句。 */
export function pickChatterLine(
  route: XiaomeiChatterRoute | null,
  avoid?: string,
  tone?: XiaomeiTone,
): XiaomeiSpokenLine | null {
  const pool = chatterLines(route);
  if (pool.length === 0) return null;
  return pickTaggedLine(pool, avoid, tone);
}

export type AmbientChatter = {
  line: XiaomeiSpokenLine;
  bucket: "idle" | "page" | "reawaken";
  at: number;
};

/**
 * 环境碎碎念的下一次。思考、睡着、冷却没到、或调用方标明挡住，就什么都不说。
 * 摸头不走这里，摸头是当下的反应。
 */
export function nextAmbientChatter(input: {
  now: number;
  lastAt: number;
  blocked: boolean;
  status: XiaomeiChatStatus;
  pathname?: string | null;
  reawaken?: boolean;
  sleeping?: boolean;
  avoid?: string;
  tone?: XiaomeiTone;
  minGapMs?: number;
  /** 免打扰。只压这次环境碎碎念，不改忙时闭嘴，也不挡用户点开的聊天。 */
  dnd?: boolean;
}): AmbientChatter | null {
  if (input.dnd === true) return null;
  const minGapMs = input.minGapMs ?? XIAOMEI_CHATTER_GAP_MS.min;
  if (!canChatter({ now: input.now, lastAt: input.lastAt, minGapMs, blocked: input.blocked })) return null;
  const route = resolveChatterBucket({
    status: input.status,
    pathname: input.pathname,
    reawaken: input.reawaken,
    sleeping: input.sleeping,
  });
  if (!route || route.bucket === "thinking" || route.bucket === "touch") return null;
  const line = pickChatterLine(route, input.avoid, input.tone);
  if (!line) return null;
  return { line, bucket: route.bucket, at: input.now };
}
