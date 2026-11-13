import { createHash, timingSafeEqual } from "node:crypto";

/**
 * 知识库写入口令。只认 `Authorization: Bearer <WIKI_ADMIN_TOKEN>`。
 * 未配置环境变量时拒绝。比对走 sha256，避免口令长度不同时抛错。
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
