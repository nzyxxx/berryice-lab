/**
 * 小莓成片清单。规则与 public/dafeiyu/helper/character-slot.js 的 sameBodyPlan 一致。
 * 舞台文案读这一份；iframe 里的绘制读那一份。两边由 characters.test.ts 锁在同一套夹具上。
 */

const FALLBACK_LABEL = "小莓";
const FALLBACK_IDENTITY = "银紫发 · 绵羊耳 · 女仆围裙";
/** 与 character-slot.js 同一数。640×853 在此宽度下高约 260。 */
const ACTOR_WIDTH = 195;
const SOURCE_SRC = /^\/characters\/xiaomei\/[a-z0-9][a-z0-9-]*\.(webp|png|svg)$/;

export type XiaomeiSameBodyPlan = {
  width: number;
  idle: string;
  breath: string[];
  stretch: string | null;
  walk: string | null;
  identity: string;
};

function textAllowed(text: string): boolean {
  return text.trim() !== "" && !text.includes("dsh-pet") && !text.includes(".webm") && !text.includes("鲸鳍") && !text.includes("鲸尾");
}

function identityLine(data: { identity?: unknown }): string {
  if (!Array.isArray(data.identity)) return FALLBACK_IDENTITY;
  const parts = data.identity.filter((item): item is string => typeof item === "string" && item.trim() !== "").map((item) => item.trim());
  const line = parts.join(" · ");
  return textAllowed(line) ? line : FALLBACK_IDENTITY;
}

function bannedPackText(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("dsh-pet") ||
    lower.includes(".webm") ||
    text.includes("/thumb/") ||
    text.includes("鲸") ||
    lower.includes("whale") ||
    text.includes("小莓妹") ||
    text.includes("蓝莓")
  );
}

function identityLocked(data: { identity?: unknown }): boolean {
  const line = identityLine(data);
  return line.includes("银紫发") && line.includes("绵羊耳") && line.includes("女仆");
}

function sourceKind(id: string): "idle" | "breath" | "stretch" | "walk" | "" {
  if (id === "idle" || id === "stretch" || id === "walk") return id;
  if (id === "breath" || /^breath-[1-9]\d*$/.test(id)) return "breath";
  return "";
}

function breathRank(id: string): number {
  if (id === "breath") return 0;
  const n = Number(id.slice("breath-".length));
  return Number.isFinite(n) ? n : 99;
}

export function xiaomeiSameBodyPlan(data: unknown): XiaomeiSameBodyPlan | null {
  if (!data || typeof data !== "object") return null;
  const pack = data as {
    id?: unknown;
    status?: unknown;
    body?: unknown;
    label?: unknown;
    note?: unknown;
    animations?: unknown;
    identity?: unknown;
    sources?: unknown;
  };
  if (pack.id !== "xiaomei" || pack.status !== "ready" || pack.body !== "raster-samebody") return null;
  if (pack.label != null && pack.label !== FALLBACK_LABEL) return null;
  if (pack.note != null && typeof pack.note !== "string") return null;
  if (pack.animations != null && (typeof pack.animations !== "object" || Array.isArray(pack.animations) || Object.keys(pack.animations).length !== 0)) {
    return null;
  }
  let blob: string;
  try {
    blob = JSON.stringify(data);
  } catch {
    return null;
  }
  if (bannedPackText(blob) || !identityLocked(pack)) return null;
  if (!Array.isArray(pack.sources) || pack.sources.length === 0) return null;
  const seen = new Set<string>();
  let idle = "";
  const breath: { id: string; src: string }[] = [];
  let stretch: string | null = null;
  let walk: string | null = null;
  for (const item of pack.sources) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const frame = item as { id?: unknown; src?: unknown };
    if (typeof frame.id !== "string" || typeof frame.src !== "string") return null;
    if (seen.has(frame.id)) return null;
    seen.add(frame.id);
    if (!SOURCE_SRC.test(frame.src) || bannedPackText(frame.src)) return null;
    const kind = sourceKind(frame.id);
    if (kind === "idle") idle = frame.src;
    else if (kind === "breath") breath.push({ id: frame.id, src: frame.src });
    else if (kind === "stretch") stretch = frame.src;
    else if (kind === "walk") walk = frame.src;
    else return null;
  }
  if (!idle) return null;
  breath.sort((a, b) => breathRank(a.id) - breathRank(b.id));
  return {
    width: ACTOR_WIDTH,
    idle,
    breath: breath.map((frame) => frame.src),
    stretch,
    walk,
    identity: identityLine(pack),
  };
}

export function xiaomeiPackReady(data: unknown): boolean {
  return xiaomeiSameBodyPlan(data) !== null;
}

export function xiaomeiPackReadyFromJson(raw: string): boolean {
  try {
    return xiaomeiPackReady(JSON.parse(raw));
  } catch {
    return false;
  }
}
