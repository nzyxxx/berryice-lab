import { createHash, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

const NO_STORE = "private, no-cache, no-store, max-age=0, must-revalidate";

/**
 * 知识库写入口令。只认 `Authorization: Bearer <WIKI_ADMIN_TOKEN>`。
 * 未配置环境变量时拒绝，避免线上忘了配密钥就放行。
 * 比对走 sha256，避免口令长度不同时 timingSafeEqual 抛错。
 */
export function isWikiAdminAuthorized(request: Request): boolean {
  const secret = process.env.WIKI_ADMIN_TOKEN;
  if (!secret) return false;

  const header = request.headers.get("authorization");
  if (!header) return false;
  const match = header.match(/^Bearer\s+(\S+)\s*$/i);
  if (!match) return false;

  const providedDigest = createHash("sha256").update(match[1]).digest();
  const secretDigest = createHash("sha256").update(secret).digest();
  return timingSafeEqual(providedDigest, secretDigest);
}

export function wikiJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": NO_STORE },
  });
}

export function wikiUnauthorized() {
  if (!process.env.WIKI_ADMIN_TOKEN) {
    console.error("WIKI_ADMIN_TOKEN 未配置，知识库写入已拒绝");
  }
  return wikiJson({ ok: false, message: "未授权" }, 401);
}
