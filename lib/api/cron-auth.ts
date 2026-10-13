import { createHash, timingSafeEqual } from "node:crypto";

/**
 * 抓取 / cron 写接口的口令校验。
 * 只认请求头 `x-cron-secret`。查询参数会进访问日志，不再接受。
 * 未配置 CRON_SECRET 时拒绝，避免线上忘了配密钥就放行。
 */
export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const provided = request.headers.get("x-cron-secret");
  if (!provided) return false;

  const providedDigest = createHash("sha256").update(provided).digest();
  const secretDigest = createHash("sha256").update(secret).digest();
  return timingSafeEqual(providedDigest, secretDigest);
}
