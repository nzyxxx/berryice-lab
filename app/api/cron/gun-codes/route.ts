import { NextResponse } from "next/server";

import { cleanupGunCodes } from "@/lib/services/gunCodesCleanup";
import { scrapeGunCodes } from "@/lib/services/gunCodesScraper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const token = request.headers.get("x-cron-secret");
  if (token && token === secret) return true;

  const url = new URL(request.url);
  const queryToken = url.searchParams.get("secret");
  return queryToken === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
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
      deleted,
    });
  } catch (error) {
    console.error("GET /api/cron/gun-codes failed:", error);
    return NextResponse.json({ ok: false, message: "cron 刷新失败" }, { status: 500 });
  }
}
