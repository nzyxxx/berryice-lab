import { NextResponse } from "next/server";

import { cleanupGunCodes } from "@/lib/services/gunCodesCleanup";
import { scrapeGunCodes } from "@/lib/services/gunCodesScraper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 手动刷新接口：无需鉴权（个人网站直接开放，cron 接口单独保护）
export async function POST() {
  try {
    const result = await scrapeGunCodes();
    const deleted = await cleanupGunCodes(30);
    return NextResponse.json({
      ok: true,
      parsed: result.parsed,
      inserted: result.summary.inserted,
      updated: result.summary.updated,
      deleted,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("POST /api/gun-codes/refresh failed:", msg);
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
