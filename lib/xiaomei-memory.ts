/**
 * 这台浏览器上的小莓妹记性。没有账号。
 * 好感只改语气软硬，不是恋爱，也不是权限。
 * 称呼和偏好是永久事实，不跟事件抢名额，也不占每天的事件配额。
 * 事件带时间；七天内优先想起，更旧的仍留着但排后面。超限丢掉最旧的事件。
 * 服务端会丢掉越狱句和钥匙。
 */

import { XIAOMEI_MAX_CHARS, isXiaomeiJailbreak, type XiaomeiChatTurn } from "./xiaomei-chat";
import { XIAOMEI_METER_DEFAULT, clampXiaomeiMeter, dayKey } from "./xiaomei-meters";

export const XIAOMEI_MEMORY_KEY = "berryice.xiaomei.memory";
export const XIAOMEI_TOPIC_LIMIT = 8;
export const XIAOMEI_TOPIC_CHARS = 60;
export const XIAOMEI_MEMORY_TURNS = 16;
export const XIAOMEI_NAME_CHARS = 8;
/** 称呼、偏好最多留这么多。再多就丢掉最早的一条事实，不动事件。 */
export const XIAOMEI_FACT_LIMIT = 6;
/** 每轮提示里常驻的事实条数。不占事件名额。 */
export const XIAOMEI_FACT_PROMPT_LIMIT = 3;
/** 每轮提示里的事件条数。相关的优先，再补最近的。 */
export const XIAOMEI_EVENT_PROMPT_LIMIT = 5;
/** 七天内的事件算新鲜，排序靠前；更旧的仍可被想起。 */
export const XIAOMEI_FRESH_MS = 7 * 24 * 60 * 60 * 1000;
/** 每天新写入的事件条数。永久事实不计入。 */
export const XIAOMEI_MEMORY_DAILY_QUOTA = 8;

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
  /** 写入时刻，毫秒。旧存档没有这个字段，仍然可读。 */
  at?: number;
  /** 称呼或偏好。旧存档没有这个字段时，仍按 kind 当成事实。 */
  permanent?: boolean;
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
  /** 本地日键，和喂食同一套日历。旧存档可以没有。 */
  memoryDay?: string;
  memoryWritesToday?: number;
};

export type XiaomeiPromptMemory = {
  facts: XiaomeiMemoryNote[];
  events: XiaomeiMemoryNote[];
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

export type XiaomeiScene = "low" | "detail" | "nav" | "chat";

export function sceneFromUser(text: string): XiaomeiScene {
  if (/详细|展开讲|具体讲/.test(text)) return "detail";
  if (/难过|伤心|想哭|好累|难受|崩溃|不开心|心好累/.test(text)) return "low";
  if (/怎么逛|怎么走|怎么进|入口在|页面在哪|知识库|枪码|改枪|三角洲|写作在|投喂/.test(text)) return "nav";
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

export function isXiaomeiFact(note: Pick<XiaomeiMemoryNote, "kind">): boolean {
  return note.kind === "nickname" || note.kind === "preference";
}

function readAt(value: unknown, now: number): number | undefined {
  let at: number | null = null;
  if (typeof value === "number" && Number.isFinite(value)) at = value;
  else if (typeof value === "string" && value.trim()) {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) at = parsed;
  }
  if (at === null || at < 1_000_000_000_000 || at > now + 60_000) return undefined;
  return Math.floor(at);
}

/** 事实和事件分开封顶。事实排在前面被挤掉的是最早那条，不是后面的事件。 */
function trimTopics(notes: readonly XiaomeiMemoryNote[]): XiaomeiMemoryNote[] {
  const factIndexes: number[] = [];
  const eventIndexes: number[] = [];
  notes.forEach((note, index) => {
    (isXiaomeiFact(note) ? factIndexes : eventIndexes).push(index);
  });
  const drop = new Set<number>();
  for (const index of factIndexes.slice(0, Math.max(0, factIndexes.length - XIAOMEI_FACT_LIMIT))) drop.add(index);
  for (const index of eventIndexes.slice(0, Math.max(0, eventIndexes.length - XIAOMEI_TOPIC_LIMIT))) drop.add(index);
  return notes.filter((_, index) => !drop.has(index));
}

export function pushTopic(
  topics: readonly XiaomeiMemoryNote[],
  next: XiaomeiMemoryNote,
  now = Date.now(),
): XiaomeiMemoryNote[] {
  const summary = next.summary.trim();
  if (!summary) return trimTopics(topics);
  const stamped: XiaomeiMemoryNote = {
    kind: next.kind,
    summary,
    at: readAt(next.at, now) ?? now,
  };
  if (isXiaomeiFact(stamped)) stamped.permanent = true;
  const without = topics.filter((item) => item.summary !== summary);
  return trimTopics([...without, stamped]);
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

function quotaFromUnknown(day: unknown, writes: unknown): Pick<XiaomeiMemoryRecord, "memoryDay" | "memoryWritesToday"> {
  if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return {};
  const count =
    typeof writes === "number" && Number.isFinite(writes) ? Math.max(0, Math.min(XIAOMEI_MEMORY_DAILY_QUOTA, Math.floor(writes))) : 0;
  return { memoryDay: day, memoryWritesToday: count };
}

export function rememberThread(
  current: Pick<XiaomeiMemoryRecord, "userName" | "topics" | "turns"> &
    Partial<Pick<XiaomeiMemoryRecord, "memoryDay" | "memoryWritesToday">>,
  user: string,
  assistant: string,
  now = new Date(),
): XiaomeiMemoryRecord {
  const nick = nicknameFromText(user);
  const topic = topicFromExchange(user, assistant);
  const turns = keepTurns([
    ...current.turns,
    { role: "user", content: user },
    { role: "assistant", content: assistant },
  ]);
  const today = dayKey(now);
  const sameDay = current.memoryDay === today;
  let writes = sameDay ? Math.max(0, current.memoryWritesToday ?? 0) : 0;
  let topics = current.topics;
  if (topic) {
    const permanent = isXiaomeiFact(topic);
    if (permanent || writes < XIAOMEI_MEMORY_DAILY_QUOTA) {
      topics = pushTopic(topics, topic, now.getTime());
      if (!permanent) writes += 1;
    } else {
      topics = trimTopics(topics);
    }
  } else {
    topics = trimTopics(topics);
  }
  return {
    userName: nick ?? current.userName,
    topics,
    turns,
    memoryDay: today,
    memoryWritesToday: writes,
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
  const note: XiaomeiMemoryNote = { kind: safeKind, summary };
  const at = readAt((item as { at?: unknown }).at, Date.now());
  if (at !== undefined) note.at = at;
  if (isXiaomeiFact(note) && (item as { permanent?: unknown }).permanent === true) note.permanent = true;
  return note;
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
  const rawTopics = Array.isArray(record.topics) ? record.topics.slice(-32) : [];
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
    topics: trimTopics(topics),
  };
}

export function memoryFromStored(raw: string | null): XiaomeiMemoryRecord {
  if (!raw) return emptyXiaomeiMemory();
  try {
    const parsed = JSON.parse(raw) as {
      topics?: unknown;
      turns?: unknown;
      userName?: unknown;
      memoryDay?: unknown;
      memoryWritesToday?: unknown;
    };
    const context = sanitizeXiaomeiMemory({ topics: parsed.topics, userName: parsed.userName });
    const turns = Array.isArray(parsed.turns) ? keepTurns(parsed.turns as XiaomeiChatTurn[]) : [];
    return {
      userName: context.userName,
      topics: context.topics,
      turns,
      ...quotaFromUnknown(parsed.memoryDay, parsed.memoryWritesToday),
    };
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

export function serializeXiaomeiMemory(record: XiaomeiMemoryRecord): string {
  const payload: {
    userName: string;
    topics: XiaomeiMemoryNote[];
    turns: XiaomeiChatTurn[];
    memoryDay?: string;
    memoryWritesToday?: number;
  } = {
    userName: record.userName,
    topics: trimTopics(record.topics),
    turns: record.turns.slice(-XIAOMEI_MEMORY_TURNS),
  };
  if (record.memoryDay) {
    payload.memoryDay = record.memoryDay;
    payload.memoryWritesToday = record.memoryWritesToday ?? 0;
  }
  return JSON.stringify(payload);
}

const RECALL_STOP = new Set([
  "什么",
  "怎么",
  "这个",
  "那个",
  "一下",
  "人家",
  "今天",
  "还是",
  "不是",
  "可以",
  "知道",
  "没有",
  "偏好",
  "心情",
  "然后",
  "我们",
  "你们",
  "自己",
  "就是",
  "一个",
  "喜欢",
]);

function recallTokens(text: string): Set<string> {
  const tokens = new Set<string>();
  const lower = text.toLowerCase();
  for (const word of lower.match(/[a-z0-9]{2,}/g) ?? []) tokens.add(word);
  for (const run of lower.match(/[\u4e00-\u9fff]+/g) ?? []) {
    const grams = run.length <= 2 ? [run] : Array.from({ length: run.length - 1 }, (_, index) => run.slice(index, index + 2));
    for (const gram of grams) {
      if (gram.length >= 2 && !RECALL_STOP.has(gram)) tokens.add(gram);
    }
  }
  return tokens;
}

function summaryTokens(summary: string): Set<string> {
  return recallTokens(summary.replace(/^(?:偏好|心情)：/, "").replace(/^想被叫作/, ""));
}

function sharesRecall(summary: string, userTokens: Set<string>): boolean {
  if (userTokens.size === 0) return false;
  for (const token of summaryTokens(summary)) {
    if (userTokens.has(token)) return true;
  }
  return false;
}

/**
 * 永久事实全部带上（有上限），不占事件名额。
 * 事件先取和这句有词重叠的，再补七天内的，最后才是更旧的。
 */
export function selectMemoriesForPrompt(
  userText: string,
  record: Pick<XiaomeiMemoryContext, "userName" | "topics">,
  now = Date.now(),
): XiaomeiPromptMemory {
  const facts = record.topics.filter((note) => isXiaomeiFact(note));
  const name = record.userName.trim();
  const named = name.length > 0 && facts.some((note) => note.kind === "nickname" && note.summary.includes(name));
  const withName =
    name && !named ? [{ kind: "nickname" as const, summary: `想被叫作${name}`, permanent: true as const }, ...facts] : facts;
  const nicknames = withName.filter((note) => note.kind === "nickname");
  const preferences = withName
    .filter((note) => note.kind !== "nickname")
    .slice()
    .sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
  const userTokens = recallTokens(userText);
  const events = record.topics
    .filter((note) => !isXiaomeiFact(note))
    .slice()
    .sort((a, b) => {
      const overlap = Number(sharesRecall(b.summary, userTokens)) - Number(sharesRecall(a.summary, userTokens));
      if (overlap !== 0) return overlap;
      const freshA = a.at !== undefined && now - a.at <= XIAOMEI_FRESH_MS && a.at <= now ? 1 : 0;
      const freshB = b.at !== undefined && now - b.at <= XIAOMEI_FRESH_MS && b.at <= now ? 1 : 0;
      if (freshA !== freshB) return freshB - freshA;
      return (b.at ?? 0) - (a.at ?? 0);
    });
  return {
    facts: [...nicknames, ...preferences].slice(0, XIAOMEI_FACT_PROMPT_LIMIT),
    events: events.slice(0, XIAOMEI_EVENT_PROMPT_LIMIT),
  };
}

/**
 * 抽屉里看到的全部笔记，不是送进提示词的那一小截。
 * 称呼若只写在 userName 上、话题里还没有，补一条出来，删的时候才能对上。
 */
export function memoryNotesForDrawer(record: Pick<XiaomeiMemoryRecord, "userName" | "topics">): {
  facts: XiaomeiMemoryNote[];
  events: XiaomeiMemoryNote[];
} {
  const facts = record.topics.filter((note) => isXiaomeiFact(note));
  const name = record.userName.trim();
  const named = name.length > 0 && facts.some((note) => note.kind === "nickname" && note.summary.includes(name));
  const withName =
    name && !named ? [{ kind: "nickname" as const, summary: `想被叫作${name}`, permanent: true as const }, ...facts] : facts;
  const byRecent = (a: XiaomeiMemoryNote, b: XiaomeiMemoryNote) => (b.at ?? 0) - (a.at ?? 0);
  return {
    facts: [
      ...withName.filter((note) => note.kind === "nickname").sort(byRecent),
      ...withName.filter((note) => note.kind !== "nickname").sort(byRecent),
    ],
    events: record.topics.filter((note) => !isXiaomeiFact(note)).slice().sort(byRecent),
  };
}

/** 忘掉一条。对话轮次还留着。删掉当前称呼时，把名字一起清掉，避免下一轮又补回来。 */
export function forgetXiaomeiNote(record: XiaomeiMemoryRecord, summary: string): XiaomeiMemoryRecord {
  const trimmed = summary.trim();
  if (!trimmed) return record;
  const name = record.userName.trim();
  return {
    ...record,
    userName: name.length > 0 && trimmed === `想被叫作${name}` ? "" : record.userName,
    topics: record.topics.filter((note) => note.summary !== trimmed),
  };
}

export function writeXiaomeiMemory(record: XiaomeiMemoryRecord) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(XIAOMEI_MEMORY_KEY, serializeXiaomeiMemory(record));
  } catch {
    /* 记不住就当这回没记住。对话还可以继续。 */
  }
}
