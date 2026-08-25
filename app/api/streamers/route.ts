import { NextResponse } from "next/server";

import { ensureStreamerTables, listStreamers } from "@/lib/repositories/streamersRepo";
import type { StreamerPlatform } from "@/lib/types/streamer";
import { STREAMER_PLATFORMS } from "@/lib/types/streamer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const raw = new URL(request.url).searchParams.get("platform");
    const platform = STREAMER_PLATFORMS.includes(raw as StreamerPlatform)
      ? (raw as StreamerPlatform)
      : undefined;

    await ensureStreamerTables();
    const data = await listStreamers(platform);
    return NextResponse.json({ ok: true, count: data.length, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("GET /api/streamers failed:", message);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
