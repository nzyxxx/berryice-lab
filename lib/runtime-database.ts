import { unstable_cache } from "next/cache";
import { connection } from "next/server";

import { ensureStreamerTables, listStreamers } from "@/lib/repositories/streamersRepo";

/**
 * 构建机器上往往没有 DATABASE_URL。这时如果把查询失败换成空列表，
 * Next 会把空页面写进预渲染，线上要等 revalidate 到期才再查库。
 * connection() 只在没有连接串时调用，让这次构建停在请求阶段。
 * 真正的请求再用进程里的连接串查库，查询结果复用一小时。
 * 构建时已经有连接串，则不会调用 connection()，整页仍按 revalidate 做 ISR。
 */
export async function deferWithoutDatabase(): Promise<void> {
  if (process.env.DATABASE_URL?.trim()) return;
  await connection();
}

/** 请求阶段再查库，并复用一小时。构建时没有连接串，不会把空列表写进这里。 */
export const readStreamersCached = unstable_cache(
  async () => {
    await ensureStreamerTables();
    return listStreamers();
  },
  ["delta-gun-streamers"],
  { revalidate: 3600 }
);
