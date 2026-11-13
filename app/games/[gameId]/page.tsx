import { GameEntryList, GameSearch } from "@/components/games/game-space";
import { PageContainer } from "@/components/lab/page-container";
import { PageShell } from "@/components/lab/page-shell";
import { PUBLIC_GAMES, UNSORTED_GAME_ID, publicGame } from "@/lib/games/catalog";
import { filterGameEntries, type GameQuery } from "@/lib/games/knowledge";
import { listGameIndex } from "@/lib/games/store";
import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ gameId: string }>;
  searchParams: Promise<{ q?: string | string[]; kind?: string | string[]; page?: string | string[] }>;
};

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

async function load(params: PageProps["params"]) {
  const { gameId } = await params;
  if (gameId === UNSORTED_GAME_ID) {
    return { id: UNSORTED_GAME_ID, title: "未归类", blurb: "游戏没有写明，或写了站上还没有的游戏。不会猜它属于哪一款。", tools: [] as { href: string; label: string }[] };
  }
  return publicGame(gameId);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const game = await load(params);
  if (!game) return { title: "没有这款游戏" };
  return { title: game.title, description: game.blurb };
}

export default async function GameSpacePage({ params, searchParams }: PageProps) {
  await connection();
  const game = await load(params);
  if (!game) notFound();
  const raw = await searchParams;
  const query: GameQuery = {
    q: first(raw.q),
    kind: first(raw.kind),
    page: Number(first(raw.page) || "1"),
  };

  let failed = false;
  let result = filterGameEntries([], game.id, query);
  try {
    const entries = await listGameIndex(undefined, PUBLIC_GAMES);
    result = filterGameEntries(entries, game.id, query);
  } catch (error) {
    console.error("游戏条目没有读出来:", error instanceof Error ? error.message : error);
    failed = true;
  }

  const empty = result.unknownKind
    ? "没有这个类别。"
    : query.q || query.kind
      ? "没有对上的条目。"
      : game.id === UNSORTED_GAME_ID
        ? "没有还没分到游戏的公开条目。"
        : "还没有公开的攻略、技巧、知识或文档。";

  return (
    <PageShell backHref="/games" backLabel="游戏">
      <PageContainer className="max-w-3xl">
        <p className="text-[11px] tracking-[0.18em] text-lab-primary">02 / {game.title}</p>
        <h1 className="mt-3 text-display-section text-balance">{game.title}</h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-lab-ink-muted">{game.blurb}</p>
        {game.tools.length > 0 ? (
          <nav aria-label="工具" className="mt-6">
            <p className="text-[11px] tracking-[0.18em] text-lab-ink-subtle">工具，不是正文</p>
            <ul className="mt-1 flex flex-wrap gap-x-4">
              {game.tools.map((tool) => (
                <li key={tool.href}>
                  <Link
                    href={tool.href}
                    className="inline-flex min-h-11 items-center text-sm text-lab-ink outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
                  >
                    {tool.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        <GameSearch gameId={game.id} query={query} />
        {failed ? (
          <p className="mt-10 text-[15px] text-lab-ink">这一页没有读出来。过一会儿再打开。</p>
        ) : (
          <GameEntryList
            gameId={game.id}
            entries={result.entries}
            query={query}
            page={result.page}
            pages={result.pages}
            empty={empty}
          />
        )}
      </PageContainer>
    </PageShell>
  );
}
