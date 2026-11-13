import { wikiJson, isWikiAdminAuthorized } from "@/lib/content/wiki-auth";
import { handleGameKnowledgeGet, handleGameKnowledgePost } from "@/lib/games/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const result = await handleGameKnowledgePost(request, {
    authorized: isWikiAdminAuthorized(request),
  });
  return wikiJson(result.body, result.status);
}

export async function GET(request: Request) {
  const result = await handleGameKnowledgeGet(request, {
    authorized: isWikiAdminAuthorized(request),
  });
  return wikiJson(result.body, result.status);
}
