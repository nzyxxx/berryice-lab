import { NextResponse } from "next/server";

import {
  ensureStreamerTables,
  getStreamerBySlug,
  listStreamerLoadouts,
} from "@/lib/repositories/streamersRepo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const decoded = decodeURIComponent(slug);

    await ensureStreamerTables();
    const streamer = await getStreamerBySlug(decoded);
    if (!streamer) {
      return NextResponse.json({ ok: false, message: "主播不存在" }, { status: 404 });
    }

    const loadouts = await listStreamerLoadouts(decoded);
    return NextResponse.json({ ok: true, data: { ...streamer, loadouts } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("GET /api/streamers/[slug] failed:", message);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
