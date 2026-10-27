import { dailyJson } from "@/lib/http/daily-cache";
import { ensureGunCodesTable, listGunCodes } from "@/lib/repositories/gunCodesRepo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = Number(searchParams.get("limit") ?? "200");
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 500) : 200;
    const game = searchParams.get("game") ?? undefined;

    await ensureGunCodesTable();
    const data = await listGunCodes(limit, game);
    return dailyJson({ ok: true, count: data.length, data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("GET /api/gun-codes failed:", msg);
    return dailyJson({ ok: false, message: msg }, 500);
  }
}
