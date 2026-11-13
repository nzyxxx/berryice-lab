import { PageContainer } from "@/components/lab/page-container";
import { PageShell } from "@/components/lab/page-shell";
import { PUBLIC_GAMES, UNSORTED_GAME_ID } from "@/lib/games/catalog";
import { filterGameEntries } from "@/lib/games/knowledge";
import { listGameIndex } from "@/lib/games/store";
import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "游戏",
  description: "按游戏分开记的攻略、技巧、知识和文档。",
};

export default async function GamesPage() {
  await connection();
  let entries: Awaited<ReturnType<typeof listGameIndex>> = [];
  let failed = false;
  try {
    entries = await listGameIndex(undefined, PUBLIC_GAMES);
  } catch (error) {
    console.error("游戏目录没有读出来:", error instanceof Error ? error.message : error);
    failed = true;
  }

  const unsorted = filterGameEntries(entries, UNSORTED_GAME_ID, {});

  return (
    <PageShell backHref="/" backLabel="首页">
      <PageContainer className="max-w-3xl">
        <p className="text-[11px] tracking-[0.18em] text-lab-primary">01 / 游戏</p>
        <h1 className="mt-3 text-display-section text-balance">游戏</h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-lab-ink-muted">
          每款游戏分开记攻略、技巧、知识和文档。没有确认在玩的游戏不会出现在这里。
        </p>
        {failed ? <p className="mt-10 text-[15px] text-lab-ink">这一页没有读出来。过一会儿再打开。</p> : null}
        <ul className="mt-12 border-t border-lab-hairline">
          {PUBLIC_GAMES.map((game) => {
            const page = filterGameEntries(entries, game.id, {});
            return (
              <li key={game.id} className="border-b border-lab-hairline py-6">
                <h2 className="text-xl font-medium tracking-tight text-lab-ink">
                  <Link
                    href={`/games/${game.id}`}
                    className="outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
                  >
                    {game.title}
                  </Link>
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-lab-ink-subtle">{game.blurb}</p>
                <p className="mt-3 text-sm text-lab-ink-muted">
                  {page.total === 0 ? "还没有公开条目。" : `${page.total} 条公开条目。`}
                </p>
              </li>
            );
          })}
        </ul>
        <p className="mt-8 text-sm leading-relaxed text-lab-ink-subtle">
          {unsorted.total === 0 ? (
            "没有还没分到游戏的公开条目。"
          ) : (
            <Link
              href="/games/unsorted"
              className="inline-flex min-h-11 items-center text-lab-ink outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
            >
              未归类 {unsorted.total} 条
            </Link>
          )}
        </p>
      </PageContainer>
    </PageShell>
  );
}
