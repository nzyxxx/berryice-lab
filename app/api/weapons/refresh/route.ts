import { NextResponse } from "next/server";

import { scrapeAndSaveWeapons } from "@/lib/services/weaponsScraper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST() {
  try {
    const result = await scrapeAndSaveWeapons();
    return NextResponse.json({
      ok: true,
      count: result.count,
      path: result.path,
      message: `已同步 ${result.count} 把枪械，刷新页面即可看到最新数据`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("POST /api/weapons/refresh failed:", msg);
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
