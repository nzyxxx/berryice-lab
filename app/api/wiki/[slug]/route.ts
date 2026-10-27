import { isWikiAdminAuthorized, wikiJson, wikiUnauthorized } from "@/lib/content/wiki-auth";
import { deleteWikiNote, WikiStoreError } from "@/lib/content/wiki-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 从磁盘删掉 `content/wiki/<slug>.md`（或 WIKI_CONTENT_DIR 里的同名文件）。
 * 文件已经不在时仍返回 ok，第二次删除不会写成失败。
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isWikiAdminAuthorized(request)) return wikiUnauthorized();

  let slug: string;
  try {
    slug = decodeURIComponent((await params).slug);
  } catch {
    return wikiJson({ ok: false, message: "slug 无法解析" }, 400);
  }

  try {
    const result = await deleteWikiNote(slug);
    return wikiJson({ ok: true, slug, deleted: result.deleted });
  } catch (error) {
    if (error instanceof WikiStoreError) {
      const status = error.code === "io" ? 500 : 400;
      return wikiJson({ ok: false, message: error.message }, status);
    }
    console.error("DELETE /api/wiki/[slug] failed:", error instanceof Error ? error.message : error);
    return wikiJson({ ok: false, message: "删除失败" }, 500);
  }
}
