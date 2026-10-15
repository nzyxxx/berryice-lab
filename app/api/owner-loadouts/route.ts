import { NextResponse } from "next/server";

import { isAdminRequest } from "@/lib/api/admin-auth";
import { createOwnerLoadout, listOwnerLoadouts, parseOwnerLoadoutInput } from "@/lib/repositories/ownerLoadoutsRepo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await listOwnerLoadouts();
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "读取失败";
    console.error("GET /api/owner-loadouts failed:", message);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, message: "没有写入权限" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "请求格式不对" }, { status: 400 });
  }

  const parsed = parseOwnerLoadoutInput(body);
  if (typeof parsed === "string") {
    return NextResponse.json({ ok: false, message: parsed }, { status: 400 });
  }

  try {
    const created = await createOwnerLoadout(parsed);
    if (!created) {
      return NextResponse.json({ ok: false, message: "枪械库里没有这把枪" }, { status: 400 });
    }
    return NextResponse.json({ ok: true, data: created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存失败";
    console.error("POST /api/owner-loadouts failed:", message);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
