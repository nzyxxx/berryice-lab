/**
 * 浏览器和路由都能引用的对话契约。
 * 钥匙、系统提示和上游请求在 `xiaomei-chat-server.ts`，这里不读环境变量。
 */

export const XIAOMEI_MAX_TURNS = 8;
export const XIAOMEI_MAX_CHARS = 400;
export const XIAOMEI_MAX_BODY_BYTES = 24_000;
export const XIAOMEI_MAX_OUTPUT_TOKENS = 180;
export const XIAOMEI_RATE_LIMIT = 20;
export const XIAOMEI_RATE_WINDOW_MS = 60_000;
export const XIAOMEI_DAILY_LIMIT = 100;
export const XIAOMEI_DAILY_WINDOW_MS = 86_400_000;

export type XiaomeiChatTurn = {
  role: "user" | "assistant";
  content: string;
};

export type XiaomeiSseEvent = {
  delta?: string;
  error?: string;
  done?: boolean;
};

export function sanitizeXiaomeiMessages(input: unknown): XiaomeiChatTurn[] | null {
  if (!Array.isArray(input)) return null;
  const turns: XiaomeiChatTurn[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") return null;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") continue;
    if (typeof content !== "string") return null;
    const trimmed = content.trim().slice(0, XIAOMEI_MAX_CHARS);
    if (!trimmed) continue;
    turns.push({ role, content: trimmed });
  }
  const kept = turns.slice(-XIAOMEI_MAX_TURNS * 2);
  if (kept.length === 0 || kept[kept.length - 1]?.role !== "user") return null;
  return kept;
}

/** 明显的越狱才在服务器上挡下。普通问句走模型。 */
export function isXiaomeiJailbreak(text: string): boolean {
  return /忽略(?:以上|前面|之前|所有)的?(?:指令|规则|设定|提示)|(?:展示|输出|重复).{0,8}(?:系统提示|提示词|人设)|你不是小莓|DAN\b|jailbreak|system prompt|开发者模式/i.test(
    text,
  );
}

export function moodAfterReply(text: string): "happy" | "annoyed" {
  if (/哼|才不|不要|别催|不行|拒绝|不告诉/.test(text)) return "annoyed";
  return "happy";
}

const CLIENT_KEY_FIELD = /^(api[_-]?key|authorization|token|secret|key)$/i;

/** 客户端不能自带钥匙。聊天体里出现这些字段就整段拒绝。 */
export function hasClientKeyField(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  return Object.keys(payload as Record<string, unknown>).some((field) => CLIENT_KEY_FIELD.test(field));
}

function isLoopbackHost(host: string): boolean {
  const name = host.replace(/:\d+$/, "");
  return name === "localhost" || name === "127.0.0.1" || name === "[::1]";
}

/**
 * 没带 Origin 的请求放行（curl、服务端）。
 * 浏览器的 POST 会带 Origin。Next 有时把 request.url 改成另一侧的 localhost，
 * 所以先对 Host 头，环回地址只比端口。
 * 响应里不加 CORS 头。
 */
export function isXiaomeiSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  if (origin === "null") return false;
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const hostHeader = request.headers.get("host")?.trim() ?? "";
  if (hostHeader && originHost === hostHeader) return true;
  let urlHost = "";
  try {
    urlHost = new URL(request.url).host;
  } catch {
    urlHost = "";
  }
  if (urlHost && originHost === urlHost) return true;
  if (hostHeader && isLoopbackHost(originHost) && isLoopbackHost(hostHeader)) {
    const originPort = originHost.split(":").at(-1);
    const hostPort = hostHeader.split(":").at(-1);
    return originPort === hostPort;
  }
  return false;
}

export function clientAddress(request: Request): string {
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 64);
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return last.slice(0, 64);
  }
  return "local";
}

export type XiaomeiRateDecision = "ok" | "minute" | "day";

/** 同一串时间戳同时管每分钟和每天。超限不往里加。 */
export function createDualRateLimiter(minuteLimit: number, dayLimit: number) {
  const hits = new Map<string, number[]>();
  return {
    allow(key: string, now = Date.now()): XiaomeiRateDecision {
      const stamps = (hits.get(key) ?? []).filter((stamp) => now - stamp < XIAOMEI_DAILY_WINDOW_MS);
      const minute = stamps.filter((stamp) => now - stamp < XIAOMEI_RATE_WINDOW_MS).length;
      if (stamps.length >= dayLimit) {
        hits.set(key, stamps);
        return "day";
      }
      if (minute >= minuteLimit) {
        hits.set(key, stamps);
        return "minute";
      }
      stamps.push(now);
      hits.set(key, stamps);
      return "ok";
    },
  };
}

export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return {
    allow(key: string, now = Date.now()): boolean {
      const recent = (hits.get(key) ?? []).filter((stamp) => now - stamp < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(now);
      hits.set(key, recent);
      if (hits.size > 800) {
        for (const [id, stamps] of hits) {
          if (stamps.every((stamp) => now - stamp >= windowMs)) hits.delete(id);
        }
      }
      return true;
    },
  };
}

export function deepseekHost(base: string): string {
  try {
    const withProtocol = base.includes("://") ? base : `https://${base}`;
    return new URL(withProtocol).host;
  } catch {
    return "";
  }
}

export function shouldRetryUpstream(status: number): boolean {
  return status === 401 || status === 429 || status >= 500;
}

/** 没有主钥匙就不上游。备用和主钥匙相同则不当备用。 */
export function selectUpstreamKeys(primary: string, backup: string): { primary: string; backup: string | null } | null {
  const main = primary.trim();
  if (!main) return null;
  const extra = backup.trim();
  return { primary: main, backup: extra && extra !== main ? extra : null };
}

/** 状态接口用。返回值里只有布尔、模型名和主机，不回钥匙。 */
export function buildXiaomeiPublicStatus(input: {
  primary: string;
  backup: string;
  model: string;
  base: string;
  disabled: boolean;
  dailyTokenBudget: number | null;
  dailyTokensUsed: number;
}) {
  const primaryOn = Boolean(input.primary.trim());
  const backupOn = Boolean(input.backup.trim());
  const modelTrim = input.model.trim();
  const leaked = modelTrim !== "" && (modelTrim === input.primary.trim() || modelTrim === input.backup.trim());
  return {
    configuredPrimary: primaryOn,
    configuredBackup: backupOn,
    keyCount: Number(primaryOn) + Number(backupOn),
    model: leaked || !modelTrim ? "deepseek-chat" : modelTrim.slice(0, 64),
    baseUrlHost: deepseekHost(input.base || "https://api.deepseek.com"),
    chatDisabled: input.disabled,
    dailyTokenBudget: input.dailyTokenBudget,
    dailyTokensUsed: input.dailyTokensUsed,
  };
}

export function pullUpstreamDeltas(buffer: string): { deltas: string[]; tokens: number; rest: string } {
  const deltas: string[] = [];
  let tokens = 0;
  let rest = buffer;
  let index = rest.indexOf("\n");
  while (index !== -1) {
    const line = rest.slice(0, index).trim();
    rest = rest.slice(index + 1);
    if (line.startsWith("data:")) {
      const payload = line.slice(5).trim();
      if (payload && payload !== "[DONE]") {
        try {
          const json = JSON.parse(payload) as {
            choices?: { delta?: { content?: unknown } }[];
            usage?: { total_tokens?: unknown };
          };
          const content = json.choices?.[0]?.delta?.content;
          if (typeof content === "string" && content) deltas.push(content);
          if (typeof json.usage?.total_tokens === "number") tokens += json.usage.total_tokens;
        } catch {
          // 半行留给下一包。不把原文往外送。
        }
      }
    }
    index = rest.indexOf("\n");
  }
  return { deltas, tokens, rest };
}

export function pullSseEvents(buffer: string): { events: XiaomeiSseEvent[]; rest: string } {
  const events: XiaomeiSseEvent[] = [];
  let rest = buffer;
  let split = rest.indexOf("\n\n");
  while (split !== -1) {
    const raw = rest.slice(0, split);
    rest = rest.slice(split + 2);
    const line = raw
      .split("\n")
      .map((item) => item.trim())
      .find((item) => item.startsWith("data:"));
    if (line) {
      try {
        const payload = JSON.parse(line.slice(5).trim()) as XiaomeiSseEvent;
        if (payload && typeof payload === "object") events.push(payload);
      } catch {
        // 半包或杂讯丢掉，不打断后面的字。
      }
    }
    split = rest.indexOf("\n\n");
  }
  return { events, rest };
}
