import { wikiJson, wikiUnauthorized, isWikiAdminAuthorized } from "@/lib/content/wiki-auth";
import { WikiStoreError, writeWikiNote } from "@/lib/content/wiki-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function statusFor(error: WikiStoreError): number {
  if (error.code === "too-large") return 413;
  if (error.code === "io") return 500;
  return 400;
}

/**
 * Bear「收录到知识库」的主路径。
 * 同一 slug 再推一次会覆盖文件，两次都返回 ok，方便 webhook 重试。
 */
export async function POST(request: Request) {
  if (!isWikiAdminAuthorized(request)) return wikiUnauthorized();

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return wikiJson({ ok: false, message: "请求体不是 JSON" }, 400);
  }

  if (!isRecord(payload) || typeof payload.slug !== "string" || typeof payload.markdown !== "string") {
    return wikiJson({ ok: false, message: "需要 JSON：{ slug, markdown }" }, 400);
  }

  try {
    const result = await writeWikiNote(payload.slug, payload.markdown);
    return wikiJson({
      ok: true,
      slug: payload.slug,
      title: result.title,
      created: result.created,
    });
  } catch (error) {
    if (error instanceof WikiStoreError) {
      return wikiJson({ ok: false, message: error.message }, statusFor(error));
    }
    console.error("POST /api/wiki/ingest failed:", error instanceof Error ? error.message : error);
    return wikiJson({ ok: false, message: "写入失败" }, 500);
  }
}
