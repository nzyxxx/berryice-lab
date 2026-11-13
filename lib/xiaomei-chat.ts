/**
 * 浏览器和路由都能引用的对话契约。
 * 钥匙、系统提示和上游请求在 `xiaomei-chat-server.ts`，这里不读环境变量。
 */

export const XIAOMEI_MAX_TURNS = 8;
export const XIAOMEI_MAX_CHARS = 400;
export const XIAOMEI_MAX_BODY_BYTES = 24_000;
/** 聊天窗默认大约 80 字。对方明确要详细时再放宽。 */
export const XIAOMEI_MAX_OUTPUT_TOKENS = 120;
export const XIAOMEI_DETAIL_OUTPUT_TOKENS = 240;

export function xiaomeiOutputLimit(messages: XiaomeiChatTurn[]): number {
  const last = [...messages].reverse().find((turn) => turn.role === "user");
  if (last && /详细|展开讲|具体讲/.test(last.content)) return XIAOMEI_DETAIL_OUTPUT_TOKENS;
  return XIAOMEI_MAX_OUTPUT_TOKENS;
}
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

type OriginSite = { name: string; port: number; defaultPort: number; host: string };

function bareHostName(value: string): string {
  let name = value.trim().toLowerCase();
  if (name.startsWith("[") && name.endsWith("]")) name = name.slice(1, -1);
  return name.replace(/\.+$/, "");
}

function isLoopbackName(name: string): boolean {
  const bare = bareHostName(name);
  return bare === "localhost" || bare === "127.0.0.1" || bare === "::1";
}

function parsePort(value: string): number | null {
  if (!/^\d{1,5}$/.test(value)) return null;
  const port = Number(value);
  if (port < 1 || port > 65535) return null;
  return port;
}

/** 拆开 Host。没写端口时 port 为 null，不能直接当成 80 或 443。 */
function readHost(value: string): { name: string; port: number | null } | null {
  const raw = value.trim().toLowerCase();
  if (!raw || /[\s/\\@?#]/.test(raw)) return null;

  let name = raw;
  let port: number | null = null;
  if (raw.startsWith("[")) {
    const end = raw.indexOf("]");
    if (end <= 1) return null;
    name = raw.slice(1, end);
    const rest = raw.slice(end + 1);
    if (rest !== "") {
      if (!rest.startsWith(":")) return null;
      port = parsePort(rest.slice(1));
      if (port === null) return null;
    }
  } else {
    const colon = raw.lastIndexOf(":");
    if (colon !== -1) {
      name = raw.slice(0, colon);
      port = parsePort(raw.slice(colon + 1));
      if (!name || port === null) return null;
    }
  }

  name = bareHostName(name);
  if (!name) return null;
  return { name, port };
}

function readOrigin(origin: string): OriginSite | null {
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return null;
  }
  const defaultPort = url.protocol === "https:" ? 443 : url.protocol === "http:" ? 80 : 0;
  if (!defaultPort) return null;
  const name = bareHostName(url.hostname);
  if (!name) return null;
  const port = url.port ? Number(url.port) : defaultPort;
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
  return { name, port, defaultPort, host: url.host };
}

/**
 * 主机名必须相同。Host 带了端口就跟 Origin 的有效端口比；
 * 没带端口时只接受该协议的默认端口（:443 / :80 已被 URL 去掉的那种）。
 */
function sameSite(origin: OriginSite, candidate: string): boolean {
  const host = readHost(candidate);
  if (!host || host.name !== origin.name) return false;
  if (host.port === null) return origin.port === origin.defaultPort;
  return host.port === origin.port;
}

/** 环回可以换名字（localhost 和 127.0.0.1），但两边都要写明同一个端口。 */
function loopbackSamePort(originHost: string, hostHeader: string): boolean {
  const origin = readHost(originHost);
  const header = readHost(hostHeader);
  if (!origin?.port || !header?.port) return false;
  if (!isLoopbackName(origin.name) || !isLoopbackName(header.name)) return false;
  return origin.port === header.port;
}

/**
 * 没带 Origin 的请求放行（curl、服务端）。
 * 浏览器的 POST 会带 Origin。Next 有时把 request.url 改成另一侧的 localhost，
 * 所以先对 Host 头。反代常把 Host 写成 `berryice.cn:443`，URL.host 会去掉默认端口，
 * 因此按主机名和有效端口比，不按整段字符串。环回地址只比端口。
 * 响应里不加 CORS 头。
 */
export function isXiaomeiSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  if (origin === "null") return false;
  const site = readOrigin(origin);
  if (!site) return false;

  const hostHeader = request.headers.get("host")?.trim() ?? "";
  if (hostHeader && sameSite(site, hostHeader)) return true;

  let urlHost = "";
  try {
    urlHost = new URL(request.url).host;
  } catch {
    urlHost = "";
  }
  if (urlHost && sameSite(site, urlHost)) return true;
  if (hostHeader && loopbackSamePort(site.host, hostHeader)) return true;
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

/** 公司主上游。完整 Messages 地址，不再在后面接 `/chat/completions`。 */
export const XIAOMEI_PRIMARY_MESSAGES_URL = "https://www.viralaiai.com/v1/messages";
export const XIAOMEI_PRIMARY_MODEL = "deepseek-v4-1-flash-261017";
/** 个人备用上游。官方 Chat Completions，和主上游不是同一台主机。 */
export const XIAOMEI_BACKUP_ORIGIN = "https://api.deepseek.com";
export const XIAOMEI_BACKUP_MODEL = "deepseek-chat";
export const ANTHROPIC_MESSAGES_VERSION = "2023-06-01";

export type XiaomeiUpstreamProtocol = "anthropic-messages" | "openai-chat";

export type XiaomeiUpstreamEndpoint = {
  protocol: XiaomeiUpstreamProtocol;
  url: string;
  model: string;
  apiKey: string;
};

export type XiaomeiBackupBlock = "same-key" | "same-host" | null;

export type AnthropicTokenUsage = {
  inputTokens: number;
  outputTokens: number;
};

export function exactUpstreamUrl(url: string, fallback: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  return trimmed || fallback;
}

/** 备用只走官方对话补全。传入的是源站根或已经拼好的补全地址。 */
export function officialChatCompletionsUrl(base: string): string {
  const trimmed = (base.trim() || XIAOMEI_BACKUP_ORIGIN).replace(/\/+$/, "");
  if (trimmed.endsWith("/chat/completions")) return trimmed;
  return `${trimmed}/chat/completions`;
}

export function safeUpstreamModel(model: string, fallback: string, secrets: readonly string[]): string {
  const trimmed = model.trim();
  const leaked = secrets.some((secret) => {
    const value = secret.trim();
    return value !== "" && trimmed === value;
  });
  if (!trimmed || leaked) return fallback;
  return trimmed.slice(0, 64);
}

function upstreamHost(url: string): string {
  return deepseekHost(url).toLowerCase();
}

/**
 * 主钥匙缺失则整段不可用，备用不能单独顶上。
 * 备用与主上游同主机，或地址落在 Messages 路径上时，直接丢掉备用，避免个人钥匙打到中转。
 */
export function resolveXiaomeiUpstreams(input: {
  primaryKey: string;
  primaryUrl: string;
  primaryModel: string;
  backupKey: string;
  backupUrl: string;
  backupModel: string;
}): {
  primary: XiaomeiUpstreamEndpoint;
  backup: XiaomeiUpstreamEndpoint | null;
  backupBlocked: XiaomeiBackupBlock;
} | null {
  const primaryKey = input.primaryKey.trim();
  if (!primaryKey) return null;
  const backupKey = input.backupKey.trim();
  const secrets = [primaryKey, backupKey];
  const primaryUrl = exactUpstreamUrl(input.primaryUrl, XIAOMEI_PRIMARY_MESSAGES_URL);
  const primary: XiaomeiUpstreamEndpoint = {
    protocol: "anthropic-messages",
    url: primaryUrl,
    model: safeUpstreamModel(input.primaryModel, XIAOMEI_PRIMARY_MODEL, secrets),
    apiKey: primaryKey,
  };
  if (!backupKey) return { primary, backup: null, backupBlocked: null };
  if (backupKey === primaryKey) return { primary, backup: null, backupBlocked: "same-key" };
  const backupUrl = officialChatCompletionsUrl(input.backupUrl);
  const primaryHost = upstreamHost(primaryUrl);
  const backupHost = upstreamHost(backupUrl);
  let backupPath = "";
  try {
    backupPath = new URL(backupUrl).pathname;
  } catch {
    backupPath = backupUrl;
  }
  if (!backupHost || backupHost === primaryHost || backupPath.includes("/messages")) {
    return { primary, backup: null, backupBlocked: "same-host" };
  }
  return {
    primary,
    backup: {
      protocol: "openai-chat",
      url: backupUrl,
      model: safeUpstreamModel(input.backupModel, XIAOMEI_BACKUP_MODEL, secrets),
      apiKey: backupKey,
    },
    backupBlocked: null,
  };
}

export function backupAfterFailure<T>(status: number, backup: T | null): T | null {
  if (!backup || !shouldRetryUpstream(status)) return null;
  return backup;
}

export function anthropicMessagesHeaders(apiKey: string, stream = true): Record<string, string> {
  return {
    "content-type": "application/json",
    "anthropic-version": ANTHROPIC_MESSAGES_VERSION,
    accept: stream ? "text/event-stream" : "application/json",
    "x-api-key": apiKey,
  };
}

type PromptMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * 实测通过的请求字段是 model / max_tokens / stream / messages。
 * `system` 不在那次 ping 里，但人设只能放在 Anthropic 的顶层 system，不能塞进 messages 的 system 角色。
 */
export function buildAnthropicMessagesBody(input: {
  model: string;
  maxTokens: number;
  messages: readonly PromptMessage[];
  stream?: boolean;
}): {
  model: string;
  max_tokens: number;
  stream: boolean;
  messages: { role: "user" | "assistant"; content: string }[];
  system?: string;
} {
  const systemParts: string[] = [];
  const dialog: { role: "user" | "assistant"; content: string }[] = [];
  for (const message of input.messages) {
    if (!message.content.trim()) continue;
    if (message.role === "system") {
      systemParts.push(message.content);
      continue;
    }
    const prev = dialog.at(-1);
    if (prev && prev.role === message.role) prev.content = `${prev.content}\n${message.content}`;
    else dialog.push({ role: message.role, content: message.content });
  }
  while (dialog[0]?.role === "assistant") dialog.shift();
  const body = {
    model: input.model,
    max_tokens: input.maxTokens,
    stream: input.stream !== false,
    messages: dialog,
  };
  if (systemParts.length === 0) return body;
  return { ...body, system: systemParts.join("\n\n") };
}

export function readDirectUsage(usage: unknown): AnthropicTokenUsage {
  if (!usage || typeof usage !== "object") return { inputTokens: 0, outputTokens: 0 };
  const record = usage as Record<string, unknown>;
  const read = (value: unknown) =>
    typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
  return {
    inputTokens: read(record.input_tokens),
    outputTokens: read(record.output_tokens),
  };
}

/** 用量字段按累计总值取高水位，不把 message_start 和 message_delta 加两次，也不读 billing_usage。 */
export function mergeAnthropicUsage(current: AnthropicTokenUsage, next: AnthropicTokenUsage): AnthropicTokenUsage {
  return {
    inputTokens: Math.max(current.inputTokens, next.inputTokens),
    outputTokens: Math.max(current.outputTokens, next.outputTokens),
  };
}

export function accountAnthropicUsage(
  seen: AnthropicTokenUsage,
  next: AnthropicTokenUsage,
): { seen: AnthropicTokenUsage; tokens: number } {
  const merged = mergeAnthropicUsage(seen, next);
  return {
    seen: merged,
    tokens: merged.inputTokens - seen.inputTokens + (merged.outputTokens - seen.outputTokens),
  };
}

export function anthropicMessageText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const content = (payload as { content?: unknown }).content;
  if (!Array.isArray(content)) return "";
  let text = "";
  for (const block of content) {
    if (!block || typeof block !== "object") continue;
    const record = block as { type?: unknown; text?: unknown };
    if (record.type === "text" && typeof record.text === "string") text += record.text;
  }
  return text;
}

export function anthropicMessageUsage(payload: unknown): AnthropicTokenUsage {
  if (!payload || typeof payload !== "object") return { inputTokens: 0, outputTokens: 0 };
  return readDirectUsage((payload as { usage?: unknown }).usage);
}

/** 没有主钥匙就不上游。备用和主钥匙相同则不当备用。 */
export function selectUpstreamKeys(primary: string, backup: string): { primary: string; backup: string | null } | null {
  const main = primary.trim();
  if (!main) return null;
  const extra = backup.trim();
  return { primary: main, backup: extra && extra !== main ? extra : null };
}

/** 状态接口用。返回值里只有布尔、模型名和主机，不回钥匙。 */
export function describeXiaomeiUpstream(input: {
  primaryKey: string;
  backupKey: string;
  primaryModel: string;
  backupModel: string;
  primaryUrl: string;
  backupUrl: string;
  legacyPresent: boolean;
  disabled: boolean;
  dailyTokenBudget: number | null;
  dailyTokensUsed: number;
}) {
  const resolved = resolveXiaomeiUpstreams(input);
  const primaryUrl = exactUpstreamUrl(input.primaryUrl, XIAOMEI_PRIMARY_MESSAGES_URL);
  const secrets = [input.primaryKey, input.backupKey];
  const model = safeUpstreamModel(input.primaryModel, XIAOMEI_PRIMARY_MODEL, secrets);
  const shared = {
    model: resolved?.primary.model ?? model,
    baseUrlHost: deepseekHost(resolved?.primary.url ?? primaryUrl),
    primaryProtocol: "anthropic-messages" as const,
    legacyPresent: input.legacyPresent,
    chatDisabled: input.disabled,
    dailyTokenBudget: input.dailyTokenBudget,
    dailyTokensUsed: input.dailyTokensUsed,
  };
  if (!resolved) {
    return {
      ...shared,
      configuredPrimary: false,
      configuredBackup: false,
      keyCount: 0,
      backupBlocked: null as XiaomeiBackupBlock,
      backupProtocol: null,
      backupModel: "",
      backupBaseUrlHost: "",
    };
  }
  return {
    ...shared,
    configuredPrimary: true,
    configuredBackup: Boolean(resolved.backup),
    keyCount: resolved.backup ? 2 : 1,
    backupBlocked: resolved.backupBlocked,
    backupProtocol: resolved.backup ? ("openai-chat" as const) : null,
    backupModel: resolved.backup?.model ?? "",
    backupBaseUrlHost: resolved.backup ? deepseekHost(resolved.backup.url) : "",
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

function usageFromAnthropicEvent(json: Record<string, unknown>): AnthropicTokenUsage {
  let usage: AnthropicTokenUsage = { inputTokens: 0, outputTokens: 0 };
  if (json.type === "message_start" && json.message && typeof json.message === "object") {
    usage = mergeAnthropicUsage(usage, readDirectUsage((json.message as { usage?: unknown }).usage));
  }
  if (json.type === "message_delta") usage = mergeAnthropicUsage(usage, readDirectUsage(json.usage));
  return usage;
}

/**
 * Anthropic Messages 的 SSE。只取出 text_delta。
 * thinking / signature / tool 的增量留在这里，不交给页面。
 * 同一段缓冲里的用量取高水位，避免 message_start 和 message_delta 各算一遍。
 */
export function pullAnthropicDeltas(buffer: string): {
  deltas: string[];
  usage: AnthropicTokenUsage;
  error: boolean;
  rest: string;
} {
  const deltas: string[] = [];
  let usage: AnthropicTokenUsage = { inputTokens: 0, outputTokens: 0 };
  let error = false;
  let rest = buffer;
  let index = rest.indexOf("\n");
  while (index !== -1) {
    const line = rest.slice(0, index).trim();
    rest = rest.slice(index + 1);
    if (line.startsWith("data:")) {
      const payload = line.slice(5).trim();
      if (payload) {
        try {
          const json = JSON.parse(payload) as Record<string, unknown>;
          usage = mergeAnthropicUsage(usage, usageFromAnthropicEvent(json));
          if (json.type === "error") {
            error = true;
            continue;
          }
          if (error) continue;
          if (json.type === "content_block_delta" && json.delta && typeof json.delta === "object") {
            const delta = json.delta as { type?: unknown; text?: unknown };
            if (delta.type === "text_delta" && typeof delta.text === "string" && delta.text) deltas.push(delta.text);
          }
        } catch {
          // 半行留给下一包。不把原文往外送。
        }
      }
    }
    index = rest.indexOf("\n");
  }
  return { deltas, usage, error, rest };
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
