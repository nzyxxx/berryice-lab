import { NextResponse } from "next/server";

import { isWikiAdminAuthorized } from "./wiki-admin-token";

const NO_STORE = "private, no-cache, no-store, max-age=0, must-revalidate";

export { isWikiAdminAuthorized };

export function wikiJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": NO_STORE },
  });
}

export function wikiUnauthorized() {
  if (!process.env.WIKI_ADMIN_TOKEN) {
    console.error("WIKI_ADMIN_TOKEN 未配置，知识库写入已拒绝");
  }
  return wikiJson({ ok: false, message: "未授权" }, 401);
}
