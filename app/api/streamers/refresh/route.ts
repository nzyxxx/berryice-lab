import { NextResponse } from "next/server";

import { isCronAuthorized } from "@/lib/api/cron-auth";
import { scrapeStreamers } from "@/lib/services/streamersScraper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** 33 位主播逐个抓详情页，默认 15s 不够用 */
export const maxDuration = 120;

export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "未授权" }, { status: 401 });
  }

  try {
    const summary = await scrapeStreamers();
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("POST /api/streamers/refresh failed:", message);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
