import { NextResponse } from "next/server";

import { ensureGunCodesTable, listGunCodes } from "@/lib/repositories/gunCodesRepo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = Number(searchParams.get("limit") ?? "200");
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 500) : 200;
    const game = searchParams.get("game") ?? undefined;

    await ensureGunCodesTable();
    const data = await listGunCodes(limit, game);
    return NextResponse.json({ ok: true, count: data.length, data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("GET /api/gun-codes failed:", msg);
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
