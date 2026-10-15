import { NextResponse } from "next/server";

import { isCronAuthorized } from "@/lib/api/cron-auth";
import { cleanupGunCodes } from "@/lib/services/gunCodesCleanup";
import { scrapeGunCodes } from "@/lib/services/gunCodesScraper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "未授权" }, { status: 401 });
  }

  try {
    const result = await scrapeGunCodes();
    const deleted = await cleanupGunCodes(30);

    return NextResponse.json({
      ok: true,
      mode: "cron",
      parsed: result.parsed,
      inserted: result.summary.inserted,
      updated: result.summary.updated,
      skipped: result.summary.skipped,
      deleted,
    });
  } catch (error) {
    console.error("GET /api/cron/gun-codes failed:", error);
    return NextResponse.json({ ok: false, message: "cron 刷新失败" }, { status: 500 });
  }
}
