import { readFile, stat } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
};

const FILE_NAME = /^([a-z0-9]+(?:-[a-z0-9]+)*)(\.webp|\.png|\.jpg|\.jpeg|\.gif)$/;

export async function GET(
  _request: Request,
  context: { params: Promise<{ file: string }> }
) {
  const { file } = await context.params;
  const match = FILE_NAME.exec(file);
  if (!match) return new Response(null, { status: 404 });

  const root = path.resolve(process.cwd(), "public", "wiki-covers");
  const full = path.resolve(root, `${match[1]}${match[2]}`);
  if (path.relative(root, full).startsWith("..")) return new Response(null, { status: 404 });

  try {
    const info = await stat(full);
    if (!info.isFile()) return new Response(null, { status: 404 });
    const body = await readFile(full);
    return new Response(body, {
      headers: {
        "content-type": TYPES[match[2]],
        "cache-control": "private, no-cache, no-store, max-age=0, must-revalidate",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
