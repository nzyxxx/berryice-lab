import { NextResponse } from "next/server";

import { adminSessionClearCookie, adminSessionSetCookie, isAdminRequest } from "@/lib/api/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return NextResponse.json({ ok: isAdminRequest(request) });
}

export async function POST(request: Request) {
  if (!process.env.ADMIN_TOKEN) {
    return NextResponse.json({ ok: false, message: "管理口令还没配置" }, { status: 503 });
  }

  let token = "";
  try {
    const body = (await request.json()) as { token?: unknown };
    token = typeof body.token === "string" ? body.token : "";
  } catch {
    return NextResponse.json({ ok: false, message: "请求格式不对" }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json({ ok: false, message: "口令不对" }, { status: 401 });
  }

  const probe = new Request(request.url, {
    headers: { "x-admin-token": token },
  });
  if (!isAdminRequest(probe)) {
    return NextResponse.json({ ok: false, message: "口令不对" }, { status: 401 });
  }

  return NextResponse.json(
    { ok: true },
    { headers: { "Set-Cookie": adminSessionSetCookie(request) } }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { ok: true },
    { headers: { "Set-Cookie": adminSessionClearCookie() } }
  );
}
