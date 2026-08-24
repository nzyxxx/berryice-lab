import { NextResponse } from "next/server";

import { getGuns } from "@/lib/data/guns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getGuns();
    return NextResponse.json({ ok: true, count: data.length, data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
