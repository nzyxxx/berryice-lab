/** 抓取类端点的统一口令校验：header 或 query 二选一。未配置 CRON_SECRET 时放行，便于本地调试。 */
export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  if (request.headers.get("x-cron-secret") === secret) return true;

  return new URL(request.url).searchParams.get("secret") === secret;
}
