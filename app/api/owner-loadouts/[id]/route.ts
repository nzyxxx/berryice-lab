import { NextResponse } from "next/server";

import { isAdminRequest } from "@/lib/api/admin-auth";
import { deleteOwnerLoadout, parseOwnerLoadoutInput, updateOwnerLoadout } from "@/lib/repositories/ownerLoadoutsRepo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function loadoutId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, message: "没有写入权限" }, { status: 401 });
  }
  const id = loadoutId((await context.params).id);
  if (!id) return NextResponse.json({ ok: false, message: "编号不对" }, { status: 400 });

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
    const updated = await updateOwnerLoadout(id, parsed);
    if (!updated) {
      return NextResponse.json({ ok: false, message: "没有这条枪码，或枪不在库里" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存失败";
    console.error("PATCH /api/owner-loadouts failed:", message);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ ok: false, message: "没有写入权限" }, { status: 401 });
  }
  const id = loadoutId((await context.params).id);
  if (!id) return NextResponse.json({ ok: false, message: "编号不对" }, { status: 400 });

  try {
    const removed = await deleteOwnerLoadout(id);
    if (!removed) return NextResponse.json({ ok: false, message: "没有这条枪码" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除失败";
    console.error("DELETE /api/owner-loadouts failed:", message);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
