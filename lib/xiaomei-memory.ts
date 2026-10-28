/**
 * 这台浏览器上的小莓记性。没有账号。
 * 亲密度和饱腹决定口气档；话题碎片让她下次还认得出你。
 * 碎片会进模型上下文，但服务端会夹短并丢掉越狱句，不能改人设。
 */

import { XIAOMEI_MAX_CHARS, isXiaomeiJailbreak, type XiaomeiChatTurn } from "./xiaomei-chat";
import { XIAOMEI_METER_DEFAULT, clampXiaomeiMeter } from "./xiaomei-meters";

export const XIAOMEI_MEMORY_KEY = "berryice.xiaomei.memory";
export const XIAOMEI_TOPIC_LIMIT = 6;
export const XIAOMEI_TOPIC_CHARS = 48;
export const XIAOMEI_MEMORY_TURNS = 16;

/** 低于这个好感，还在嘴硬档。默认 22 就落在这里。 */
export const XIAOMEI_TONE_PRICKLY_BELOW = 36;
/** 好感到这儿，心软档。喂食和聊完都会慢慢抬上去。 */
export const XIAOMEI_TONE_SOFT_AT = 68;
/** 饱腹低于这个，饿了，口气发硬，盖过好感。 */
export const XIAOMEI_TONE_HUNGRY = 25;

export type XiaomeiTone = "prickly" | "usual" | "soft";

export type XiaomeiMemoryContext = {
  affection: number;
  fullness: number;
  topics: string[];
};

export type XiaomeiMemoryRecord = {
  topics: string[];
  turns: XiaomeiChatTurn[];
};

export function emptyXiaomeiMemory(): XiaomeiMemoryRecord {
  return { topics: [], turns: [] };
}

export function toneFromMeters(affection: number, fullness: number): XiaomeiTone {
  const love = clampXiaomeiMeter(affection);
  const belly = clampXiaomeiMeter(fullness);
  if (belly < XIAOMEI_TONE_HUNGRY || love < XIAOMEI_TONE_PRICKLY_BELOW) return "prickly";
  if (love >= XIAOMEI_TONE_SOFT_AT) return "soft";
  return "usual";
}

function clipChars(text: string, max: number): string {
  return [...text.replace(/\s+/g, " ").trim()].slice(0, max).join("").trim();
}

/** 把一轮对话收成她能记住的一句，不另叫模型。 */
export function topicFromExchange(user: string, assistant: string): string | null {
  if (isXiaomeiJailbreak(user) || isXiaomeiJailbreak(assistant)) return null;
  const asked = clipChars(user, 14);
  if ([...asked].length < 2) return null;
  const replied = clipChars(assistant, 12);
  const line = replied ? `他提过「${asked}」，我回过「${replied}」` : `他提过「${asked}」`;
  return clipChars(line, XIAOMEI_TOPIC_CHARS);
}

export function pushTopic(topics: readonly string[], next: string): string[] {
  const trimmed = next.trim();
  if (!trimmed) return [...topics];
  const without = topics.filter((item) => item !== trimmed);
  return [...without, trimmed].slice(-XIAOMEI_TOPIC_LIMIT);
}

export function rememberThread(
  topics: readonly string[],
  turns: readonly XiaomeiChatTurn[],
  user: string,
  assistant: string,
): XiaomeiMemoryRecord {
  const topic = topicFromExchange(user, assistant);
  const nextTopics = topic ? pushTopic(topics, topic) : [...topics].slice(-XIAOMEI_TOPIC_LIMIT);
  const kept: XiaomeiChatTurn[] = [];
  let skipAssistant = false;
  for (const turn of turns) {
    if (turn.role !== "user" && turn.role !== "assistant") continue;
    const content = clipChars(turn.content, XIAOMEI_MAX_CHARS);
    if (!content) continue;
    if (turn.role === "user" && isXiaomeiJailbreak(content)) {
      skipAssistant = true;
      continue;
    }
    if (turn.role === "assistant" && skipAssistant) {
      skipAssistant = false;
      continue;
    }
    skipAssistant = false;
    kept.push({ role: turn.role, content });
  }
  return { topics: nextTopics, turns: kept.slice(-XIAOMEI_MEMORY_TURNS) };
}

/** 只认三个字段。多出来的钥匙字段直接丢掉。 */
export function sanitizeXiaomeiMemory(input: unknown): XiaomeiMemoryContext {
  const record = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const affection =
    typeof record.affection === "number" ? clampXiaomeiMeter(record.affection) : XIAOMEI_METER_DEFAULT.affection;
  const fullness =
    typeof record.fullness === "number" ? clampXiaomeiMeter(record.fullness) : XIAOMEI_METER_DEFAULT.fullness;
  const topics: string[] = [];
  const rawTopics = Array.isArray(record.topics) ? record.topics.slice(-12) : [];
  for (const item of rawTopics) {
    if (typeof item !== "string") continue;
    const clipped = clipChars(item, XIAOMEI_TOPIC_CHARS);
    if (!clipped || isXiaomeiJailbreak(clipped)) continue;
    if (!topics.includes(clipped)) topics.push(clipped);
  }
  return { affection, fullness, topics: topics.slice(-XIAOMEI_TOPIC_LIMIT) };
}

export function memoryFromStored(raw: string | null): XiaomeiMemoryRecord {
  if (!raw) return emptyXiaomeiMemory();
  try {
    const parsed = JSON.parse(raw) as { topics?: unknown; turns?: unknown };
    const topics = sanitizeXiaomeiMemory({ topics: parsed.topics }).topics;
    const turns: XiaomeiChatTurn[] = [];
    if (Array.isArray(parsed.turns)) {
      for (const item of parsed.turns) {
        if (!item || typeof item !== "object") continue;
        const role = (item as { role?: unknown }).role;
        const content = (item as { content?: unknown }).content;
        if ((role !== "user" && role !== "assistant") || typeof content !== "string") continue;
        const text = clipChars(content, XIAOMEI_MAX_CHARS);
        if (!text || isXiaomeiJailbreak(text)) continue;
        turns.push({ role, content: text });
      }
    }
    return { topics, turns: turns.slice(-XIAOMEI_MEMORY_TURNS) };
  } catch {
    return emptyXiaomeiMemory();
  }
}

export function readXiaomeiMemory(): XiaomeiMemoryRecord {
  if (typeof window === "undefined") return emptyXiaomeiMemory();
  try {
    return memoryFromStored(localStorage.getItem(XIAOMEI_MEMORY_KEY));
  } catch {
    return emptyXiaomeiMemory();
  }
}

export function writeXiaomeiMemory(record: XiaomeiMemoryRecord) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      XIAOMEI_MEMORY_KEY,
      JSON.stringify({
        topics: record.topics.slice(-XIAOMEI_TOPIC_LIMIT),
        turns: record.turns.slice(-XIAOMEI_MEMORY_TURNS),
      }),
    );
  } catch {
    /* 记不住就当这回没记住。对话还可以继续。 */
  }
}
