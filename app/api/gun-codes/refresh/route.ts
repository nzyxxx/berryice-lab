import { NextResponse } from "next/server";

import { isCronAuthorized } from "@/lib/api/cron-auth";
import { cleanupGunCodes } from "@/lib/services/gunCodesCleanup";
import { scrapeGunCodes } from "@/lib/services/gunCodesScraper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "未授权" }, { status: 401 });
  }

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
