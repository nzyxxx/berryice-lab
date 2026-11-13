import { isWikiAdminAuthorized, wikiJson, wikiUnauthorized } from "@/lib/content/wiki-auth";
import { handleGameKnowledgeGet, handleGameKnowledgePost } from "@/lib/games/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isWikiAdminAuthorized(request)) return wikiUnauthorized();
  const result = await handleGameKnowledgePost(request, { authorized: true });
  return wikiJson(result.body, result.status);
}

export async function GET(request: Request) {
  if (!isWikiAdminAuthorized(request)) return wikiUnauthorized();
  const result = await handleGameKnowledgeGet(request, { authorized: true });
  return wikiJson(result.body, result.status);
}
