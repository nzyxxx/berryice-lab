/**
 * 这台浏览器上的小莓妹记性。没有账号。
 * 好感只改语气软硬，不是恋爱，也不是权限。
 * 长期记忆按种类收成短摘要；服务端会丢掉越狱句和钥匙。
 */

import { XIAOMEI_MAX_CHARS, isXiaomeiJailbreak, type XiaomeiChatTurn } from "./xiaomei-chat";
import { XIAOMEI_METER_DEFAULT, clampXiaomeiMeter } from "./xiaomei-meters";

export const XIAOMEI_MEMORY_KEY = "berryice.xiaomei.memory";
export const XIAOMEI_TOPIC_LIMIT = 8;
export const XIAOMEI_TOPIC_CHARS = 60;
export const XIAOMEI_MEMORY_TURNS = 16;
export const XIAOMEI_NAME_CHARS = 8;

/** 签过的好感梯度：0–19 / 20–49 / 50–79 / 80–100。 */
export const XIAOMEI_TONE_GUARDED_BELOW = 20;
export const XIAOMEI_TONE_WARM_AT = 50;
export const XIAOMEI_TONE_CLOSE_AT = 80;
/** 饱腹低于这个就算饿，想吃点心。不盖过好感档。 */
export const XIAOMEI_TONE_HUNGRY = 25;

export const XIAOMEI_MEMORY_KINDS = ["preference", "event", "emotion", "nickname"] as const;

export type XiaomeiMemoryKind = (typeof XIAOMEI_MEMORY_KINDS)[number];

export type XiaomeiTone = "guarded" | "classic" | "warm" | "close";

export type XiaomeiMemoryNote = {
  kind: XiaomeiMemoryKind;
  summary: string;
};

export type XiaomeiMemoryContext = {
  affection: number;
  fullness: number;
  feedCountToday: number;
  userName: string;
  topics: XiaomeiMemoryNote[];
};

export type XiaomeiMemoryRecord = {
  userName: string;
  topics: XiaomeiMemoryNote[];
  turns: XiaomeiChatTurn[];
};

export function emptyXiaomeiMemory(): XiaomeiMemoryRecord {
  return { userName: "", topics: [], turns: [] };
}

export function toneFromAffection(affection: number): XiaomeiTone {
  const love = clampXiaomeiMeter(affection);
  if (love < XIAOMEI_TONE_GUARDED_BELOW) return "guarded";
  if (love >= XIAOMEI_TONE_CLOSE_AT) return "close";
  if (love >= XIAOMEI_TONE_WARM_AT) return "warm";
  return "classic";
}

/** 饱腹低才算饿。好感再高也还会想吃点心，但语气档不因此倒退。 */
export function isXiaomeiHungry(fullness: number): boolean {
  return clampXiaomeiMeter(fullness) < XIAOMEI_TONE_HUNGRY;
}

export function moodFromMeters(affection: number, fullness: number): string {
  if (isXiaomeiHungry(fullness)) return "有点蔫，想吃点心";
  const tone = toneFromAffection(affection);
  if (tone === "close") return "嘴硬，但会小声关心";
  if (tone === "warm") return "别扭，想多问一句";
  if (tone === "classic") return "别扭但在听";
  return "防备，话很短";
}

export function sceneFromUser(text: string): "low" | "detail" | "chat" {
  if (/详细|展开讲|具体讲/.test(text)) return "detail";
  if (/难过|伤心|想哭|好累|难受|崩溃|不开心|心好累/.test(text)) return "low";
  return "chat";
}

function clipChars(text: string, max: number): string {
  return [...text.replace(/\s+/g, " ").trim()].slice(0, max).join("").trim();
}

function isSecret(text: string): boolean {
  return /密钥|密码|api[_-]?key|\bsk-[a-z0-9]/i.test(text);
}

export function nicknameFromText(text: string): string | null {
  const match = text.match(/(?:叫我|我叫|称呼我)[:：\s]*([^\s，。！？,.!?]{1,8})/);
  if (!match?.[1]) return null;
  const name = clipChars(match[1], XIAOMEI_NAME_CHARS);
  if (!name || name === "你" || isXiaomeiJailbreak(name) || isSecret(name)) return null;
  return name;
}

function kindFor(user: string): XiaomeiMemoryKind {
  if (nicknameFromText(user)) return "nickname";
  if (/喜欢|讨厌|不想|爱吃|不爱/.test(user)) return "preference";
  if (/难过|伤心|累|开心|高兴|想哭|难受|烦/.test(user)) return "emotion";
  return "event";
}

/** 收成一条摘要。不记钥匙，不把模型的长回复再贴一遍。 */
export function topicFromExchange(user: string, assistant: string): XiaomeiMemoryNote | null {
  if (isXiaomeiJailbreak(user) || isXiaomeiJailbreak(assistant) || isSecret(user)) return null;
  const nick = nicknameFromText(user);
  if (nick) return { kind: "nickname", summary: clipChars(`想被叫作${nick}`, XIAOMEI_TOPIC_CHARS) };
  const asked = clipChars(user, 28);
  if ([...asked].length < 2) return null;
  const kind = kindFor(user);
  const summary =
    kind === "emotion"
      ? clipChars(`心情：${asked}`, XIAOMEI_TOPIC_CHARS)
      : kind === "preference"
        ? clipChars(`偏好：${asked}`, XIAOMEI_TOPIC_CHARS)
        : clipChars(asked, XIAOMEI_TOPIC_CHARS);
  return { kind, summary };
}

export function pushTopic(topics: readonly XiaomeiMemoryNote[], next: XiaomeiMemoryNote): XiaomeiMemoryNote[] {
  const summary = next.summary.trim();
  if (!summary) return [...topics];
  const without = topics.filter((item) => item.summary !== summary);
  return [...without, { kind: next.kind, summary }].slice(-XIAOMEI_TOPIC_LIMIT);
}

function keepTurns(turns: readonly XiaomeiChatTurn[]): XiaomeiChatTurn[] {
  const kept: XiaomeiChatTurn[] = [];
  let skipAssistant = false;
  for (const turn of turns) {
    if (turn.role !== "user" && turn.role !== "assistant") continue;
    const content = clipChars(turn.content, XIAOMEI_MAX_CHARS);
    if (!content || isSecret(content)) continue;
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
  return kept.slice(-XIAOMEI_MEMORY_TURNS);
}

export function rememberThread(
  current: Pick<XiaomeiMemoryRecord, "userName" | "topics" | "turns">,
  user: string,
  assistant: string,
): XiaomeiMemoryRecord {
  const nick = nicknameFromText(user);
  const topic = topicFromExchange(user, assistant);
  const turns = keepTurns([
    ...current.turns,
    { role: "user", content: user },
    { role: "assistant", content: assistant },
  ]);
  return {
    userName: nick ?? current.userName,
    topics: topic ? pushTopic(current.topics, topic) : current.topics.slice(-XIAOMEI_TOPIC_LIMIT),
    turns,
  };
}

function noteFromUnknown(item: unknown): XiaomeiMemoryNote | null {
  if (typeof item === "string") {
    const summary = clipChars(item, XIAOMEI_TOPIC_CHARS);
    if (!summary || isXiaomeiJailbreak(summary) || isSecret(summary)) return null;
    return { kind: "event", summary };
  }
  if (!item || typeof item !== "object") return null;
  const kind = (item as { kind?: unknown }).kind;
  const summaryRaw = (item as { summary?: unknown }).summary;
  if (typeof summaryRaw !== "string") return null;
  const summary = clipChars(summaryRaw, XIAOMEI_TOPIC_CHARS);
  if (!summary || isXiaomeiJailbreak(summary) || isSecret(summary)) return null;
  const safeKind = XIAOMEI_MEMORY_KINDS.includes(kind as XiaomeiMemoryKind) ? (kind as XiaomeiMemoryKind) : "event";
  return { kind: safeKind, summary };
}

function sanitizeUserName(value: unknown): string {
  if (typeof value !== "string") return "";
  const name = clipChars(value, XIAOMEI_NAME_CHARS);
  if (!name || isXiaomeiJailbreak(name) || isSecret(name)) return "";
  return name;
}

function sanitizeFeedCount(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(30, Math.max(0, Math.floor(value)));
}

/** 只认状态和摘要。心情由服务端按数字重算，不接受客户端写的心情句子。 */
export function sanitizeXiaomeiMemory(input: unknown): XiaomeiMemoryContext {
  const record = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const affection =
    typeof record.affection === "number" ? clampXiaomeiMeter(record.affection) : XIAOMEI_METER_DEFAULT.affection;
  const fullness =
    typeof record.fullness === "number" ? clampXiaomeiMeter(record.fullness) : XIAOMEI_METER_DEFAULT.fullness;
  const topics: XiaomeiMemoryNote[] = [];
  const rawTopics = Array.isArray(record.topics) ? record.topics.slice(-16) : [];
  for (const item of rawTopics) {
    const note = noteFromUnknown(item);
    if (!note) continue;
    if (topics.some((topic) => topic.summary === note.summary)) continue;
    topics.push(note);
  }
  return {
    affection,
    fullness,
    feedCountToday: sanitizeFeedCount(record.feedCountToday),
    userName: sanitizeUserName(record.userName),
    topics: topics.slice(-XIAOMEI_TOPIC_LIMIT),
  };
}

export function memoryFromStored(raw: string | null): XiaomeiMemoryRecord {
  if (!raw) return emptyXiaomeiMemory();
  try {
    const parsed = JSON.parse(raw) as { topics?: unknown; turns?: unknown; userName?: unknown };
    const context = sanitizeXiaomeiMemory({ topics: parsed.topics, userName: parsed.userName });
    const turns = Array.isArray(parsed.turns) ? keepTurns(parsed.turns as XiaomeiChatTurn[]) : [];
    return { userName: context.userName, topics: context.topics, turns };
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
        userName: record.userName,
        topics: record.topics.slice(-XIAOMEI_TOPIC_LIMIT),
        turns: record.turns.slice(-XIAOMEI_MEMORY_TURNS),
      }),
    );
  } catch {
    /* 记不住就当这回没记住。对话还可以继续。 */
  }
}
