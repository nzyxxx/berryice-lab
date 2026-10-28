import { randomBytes } from "node:crypto";

import {
  XIAOMEI_DAILY_LIMIT,
  XIAOMEI_MAX_BODY_BYTES,
  XIAOMEI_RATE_LIMIT,
  clientAddress,
  createDualRateLimiter,
  hasClientKeyField,
  isXiaomeiJailbreak,
  isXiaomeiSameOrigin,
  sanitizeXiaomeiMessages,
  shouldRetryUpstream,
} from "@/lib/xiaomei-chat";
import { sanitizeXiaomeiMemory } from "@/lib/xiaomei-memory";
import { XIAOMEI_NAME } from "@/lib/xiaomei-lines";
import {
  XIAOMEI_REFUSAL,
  XIAOMEI_UPSTREAM_ERROR,
  cannedXiaomeiStream,
  requestXiaomeiUpstream,
  upstreamToClientSse,
  xiaomeiBudgetSnapshot,
  xiaomeiChatDisabled,
  xiaomeiUpstreamConfig,
} from "@/lib/xiaomei-chat-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const buckets = createDualRateLimiter(XIAOMEI_RATE_LIMIT, XIAOMEI_DAILY_LIMIT);
const SID_COOKIE = "xiaomei_sid";

function jsonError(error: string, status: number, extraHeaders?: HeadersInit) {
  return Response.json(
    { error },
    { status, headers: { "Cache-Control": "no-store", ...extraHeaders } },
  );
}

function readSid(request: Request): string {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)xiaomei_sid=([A-Za-z0-9_-]{16,64})/);
  return match?.[1] ?? "";
}

function freshSidCookie(): { sid: string; header: string } {
  const sid = randomBytes(16).toString("hex");
  return {
    sid,
    header: `${SID_COOKIE}=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
  };
}

async function readLimitedJson(request: Request): Promise<{ payload: unknown } | { error: string; status: number }> {
  const declared = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(declared) && declared > XIAOMEI_MAX_BODY_BYTES) {
    return { error: "话太长了，我记不住。", status: 413 };
  }
  if (!request.body) return { error: "你倒是说句话。", status: 400 };

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > XIAOMEI_MAX_BODY_BYTES) {
      await reader.cancel().catch(() => undefined);
      return { error: "话太长了，我记不住。", status: 413 };
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  try {
    return { payload: JSON.parse(text) as unknown };
  } catch {
    return { error: "你这话说得我没听懂。", status: 400 };
  }
}

function rateMessage(decision: "minute" | "day") {
  return decision === "day" ? "今天说到这儿了。明天再来。" : "慢一点。再催我就不理你了。";
}

export async function POST(request: Request) {
  if (!isXiaomeiSameOrigin(request)) {
    return jsonError("这个对话只在本站开。", 403);
  }

  // 客户端带上来的 Authorization 一律不用，也不能当成上游钥匙。
  if (xiaomeiChatDisabled()) {
    return jsonError(`${XIAOMEI_NAME}这会儿被按停了。`, 503);
  }

  const config = xiaomeiUpstreamConfig();
  if (!config) {
    return jsonError(`${XIAOMEI_NAME}这会儿不在线，对话钥匙还没放好。`, 503);
  }

  if (xiaomeiBudgetSnapshot().blocked) {
    return jsonError("今天的话费完了。明天再聊。", 503);
  }

  const body = await readLimitedJson(request);
  if ("error" in body) return jsonError(body.error, body.status);
  if (hasClientKeyField(body.payload)) return jsonError("不用带钥匙。", 400);

  const record =
    body.payload && typeof body.payload === "object"
      ? (body.payload as { messages?: unknown; memory?: unknown })
      : null;
  const messages = sanitizeXiaomeiMessages(record?.messages);
  if (!messages) return jsonError("你倒是说句话。", 400);
  const memory = sanitizeXiaomeiMemory(record?.memory);

  const ip = clientAddress(request);
  const ipDecision = buckets.allow(`ip:${ip}`);
  if (ipDecision !== "ok") return jsonError(rateMessage(ipDecision), 429);

  const existingSid = readSid(request);
  const issued = existingSid ? null : freshSidCookie();
  const sid = existingSid || issued?.sid || "";
  if (sid) {
    const sidDecision = buckets.allow(`sid:${sid}`);
    if (sidDecision !== "ok") {
      return jsonError(rateMessage(sidDecision), 429, issued ? { "Set-Cookie": issued.header } : undefined);
    }
  }

  const cookieHeader = issued ? { "Set-Cookie": issued.header } : undefined;
  const last = messages[messages.length - 1];
  if (last && isXiaomeiJailbreak(last.content)) {
    return new Response(cannedXiaomeiStream(XIAOMEI_REFUSAL), {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
        ...cookieHeader,
      },
    });
  }

  try {
    let upstream = await requestXiaomeiUpstream(config, config.primary, messages, memory);
    if (!upstream.ok && config.backup && shouldRetryUpstream(upstream.status)) {
      await upstream.body?.cancel().catch(() => undefined);
      console.error("[xiaomei] upstream retry", upstream.status);
      upstream = await requestXiaomeiUpstream(config, config.backup, messages, memory);
    }
    if (!upstream.ok || !upstream.body) {
      await upstream.body?.cancel().catch(() => undefined);
      console.error("[xiaomei] upstream status", upstream.status);
      return jsonError(XIAOMEI_UPSTREAM_ERROR, 502, cookieHeader);
    }
    return new Response(upstreamToClientSse(upstream.body), {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
        ...cookieHeader,
      },
    });
  } catch (error) {
    console.error("[xiaomei] upstream failed", error instanceof Error ? error.name : "error");
    return jsonError(XIAOMEI_UPSTREAM_ERROR, 502, cookieHeader);
  }
}
