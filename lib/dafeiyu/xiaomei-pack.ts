/**
 * 小莓成片清单。规则与 public/dafeiyu/helper/character-slot.js 的 sameBodyPlan 一致。
 * 舞台文案读这一份；iframe 里的绘制读那一份。两边由 characters.test.ts 锁在同一套夹具上。
 */

const FALLBACK_LABEL = "小莓";
const FALLBACK_IDENTITY = "银紫发 · 绵羊耳 · 女仆围裙";
/** 与 character-slot.js 同一数。现网预览宽 180，高约 240。 */
const ACTOR_WIDTH = 180;
const SOURCE_SRC = /^\/characters\/xiaomei\/[a-z0-9][a-z0-9-]*\.(webp|png|svg)$/;
const ART_FRAME_FILE = /^[a-z0-9][a-z0-9-]*\.webp$/;
const ART_ACTIVITIES = new Set(["idle", "stretch", "walk"]);

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

function artFamilyPack(data: object): object | null {
  const art = data as {
    artFamily?: unknown;
    activities?: unknown;
    frames?: unknown;
    identityLocks?: unknown;
    reskinSlot?: { id?: unknown; status?: unknown } | null;
  };
  if (art.artFamily !== "xiaomei-samebody-v1") return null;
  const slot = art.reskinSlot;
  if (!slot || slot.id !== "xiaomei" || slot.status !== "ready") return null;
  if (!Array.isArray(art.activities) || art.activities.length !== 3) return null;
  const seen = new Set<string>();
  for (const name of art.activities) {
    if (typeof name !== "string" || !ART_ACTIVITIES.has(name) || seen.has(name)) return null;
    seen.add(name);
  }
  if (!art.frames || typeof art.frames !== "object" || Array.isArray(art.frames)) return null;
  const frameMap = art.frames as Record<string, unknown>;
  if (!Array.isArray(art.identityLocks)) return null;
  if (
    !art.identityLocks.includes("sheepEars") ||
    !art.identityLocks.includes("silverLilacHair") ||
    !art.identityLocks.includes("maidApronBlueberry")
  ) {
    return null;
  }
  const sources = [];
  for (const id of ["idle", "stretch", "walk"] as const) {
    const file = frameMap[id];
    if (typeof file !== "string" || !ART_FRAME_FILE.test(file)) return null;
    sources.push({ id, src: `/characters/xiaomei/${file}` });
  }
  return {
    id: "xiaomei",
    label: FALLBACK_LABEL,
    status: "ready",
    body: "raster-samebody",
    identity: ["银紫发", "绵羊耳", "女仆围裙"],
    animations: {},
    sources,
    note: "小莓站在台上。",
  };
}

export function xiaomeiSameBodyPlan(data: unknown): XiaomeiSameBodyPlan | null {
  if (!data || typeof data !== "object") return null;
  let rawBlob: string;
  try {
    rawBlob = JSON.stringify(data);
  } catch {
    return null;
  }
  if (bannedPackText(rawBlob)) return null;
  let source: object = data;
  if ("artFamily" in data && (data as { artFamily?: unknown }).artFamily != null) {
    const packed = artFamilyPack(data);
    if (!packed) return null;
    source = packed;
  }
  const pack = source as {
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
