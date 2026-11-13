import { PUBLIC_GAMES, UNSORTED_GAME_ID, publicGame } from "./catalog";
import { filterGameEntries, type GameQuery } from "./knowledge";
import { listGameIndex, saveGameKnowledge, type GameSaveResult } from "./store";

export type GameHttpResult = { status: number; body: unknown };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pageQuery(url: URL): GameQuery {
  const page = Number(url.searchParams.get("page") ?? "1");
  return {
    q: url.searchParams.get("q") ?? undefined,
    kind: url.searchParams.get("kind") ?? undefined,
    page: Number.isFinite(page) ? page : 1,
  };
}

function allowedGame(gameId: string): boolean {
  return gameId === UNSORTED_GAME_ID || publicGame(gameId) !== null;
}

export async function handleGameKnowledgePost(
  request: Request,
  options: { authorized: boolean; directory?: string; now?: Date }
): Promise<GameHttpResult> {
  if (!options.authorized) return { status: 401, body: { ok: false, message: "未授权" } };

  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > 250_000) {
    return { status: 413, body: { ok: false, message: "请求太大" } };
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return { status: 400, body: { ok: false, message: "请求体不是 JSON" } };
  }
  if (!isRecord(payload)) return { status: 400, body: { ok: false, message: "请求体不是 JSON" } };

  const result: GameSaveResult = await saveGameKnowledge(payload, {
    directory: options.directory,
    games: PUBLIC_GAMES,
    now: options.now ?? new Date(),
  });
  if (!result.ok) return { status: result.status, body: result };
  return { status: result.created ? 201 : 200, body: result };
}

export async function handleGameKnowledgeGet(
  request: Request,
  options: { authorized: boolean; directory?: string }
): Promise<GameHttpResult> {
  if (!options.authorized) return { status: 401, body: { ok: false, message: "未授权" } };
  const url = new URL(request.url);
  const gameId = url.searchParams.get("gameId")?.trim() ?? "";
  if (!gameId || !allowedGame(gameId)) {
    return { status: 400, body: { ok: false, message: "要指定已经确认的游戏，或未归类" } };
  }
  const entries = await listGameIndex(options.directory, PUBLIC_GAMES);
  const page = filterGameEntries(entries, gameId, pageQuery(url), { includeDrafts: true });
  return {
    status: 200,
    body: {
      ok: true,
      gameId,
      total: page.total,
      entries: page.entries,
    },
  };
}
