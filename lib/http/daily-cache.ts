import { NextResponse } from "next/server";

/**
 * 枪码 / 主播这类日更数据的共享缓存。
 * max-age=0：浏览器不把 JSON 存下来。
 * s-maxage=3600：nginx 最多存一小时，不能再按静态页的一年去冻。
 * stale-while-revalidate 与 next.config 的 expireTime 对齐。
 */
export const DAILY_SHARED_CACHE =
  "public, max-age=0, s-maxage=3600, stale-while-revalidate=3600";

const NO_STORE = "private, no-cache, no-store, max-age=0, must-revalidate";

export function dailyJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": status === 200 ? DAILY_SHARED_CACHE : NO_STORE,
    },
  });
}
