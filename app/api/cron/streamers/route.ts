import { NextResponse } from "next/server";

import { isCronAuthorized } from "@/lib/api/cron-auth";
import { scrapeStreamers } from "@/lib/services/streamersScraper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "未授权" }, { status: 401 });
  }

  try {
    const summary = await scrapeStreamers();
    return NextResponse.json({ ok: true, mode: "cron", ...summary });
  } catch (error) {
    console.error("GET /api/cron/streamers failed:", error);
    return NextResponse.json({ ok: false, message: "cron 刷新失败" }, { status: 500 });
  }
}
