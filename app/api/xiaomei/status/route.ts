import { isAdminRequest } from "@/lib/api/admin-auth";
import { isXiaomeiSameOrigin } from "@/lib/xiaomei-chat";
import { xiaomeiPublicStatus } from "@/lib/xiaomei-chat-server";
import { isWikiAdminAuthorized } from "@/lib/content/wiki-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function denied(status: number, message: string) {
  return Response.json(
    { ok: false, message },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

/** 站长看小莓接没接上。只回布尔和主机名，不回钥匙。 */
export async function GET(request: Request) {
  if (!isXiaomeiSameOrigin(request)) return denied(403, "只在本站看。");
  if (!isAdminRequest(request) && !isWikiAdminAuthorized(request)) return denied(401, "未授权");

  return Response.json(
    { ok: true, ...xiaomeiPublicStatus() },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
