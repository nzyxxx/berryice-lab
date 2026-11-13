import { PageContainer } from "@/components/lab/page-container";
import { PageShell } from "@/components/lab/page-shell";
import { WikiMarkdown } from "@/components/wiki/wiki-markdown";
import { PUBLIC_GAMES, UNSORTED_GAME_ID, publicGame } from "@/lib/games/catalog";
import { gameKindLabel, readGameEntry } from "@/lib/games/knowledge";
import { readWikiNote } from "@/lib/content/wiki-store";
import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ gameId: string; slug: string }> };

async function load(params: PageProps["params"]) {
  const { gameId, slug } = await params;
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    return null;
  }
  if (gameId !== UNSORTED_GAME_ID && !publicGame(gameId)) return null;
  const note = await readWikiNote(decoded);
  if (!note) return null;
  const entry = readGameEntry(note, PUBLIC_GAMES);
  if (!entry || entry.visibility !== "public" || entry.gameId !== gameId) return null;
  return entry;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const entry = await load(params);
  if (!entry) notFound();
  return { title: entry.title, description: entry.summary || entry.title };
}

export default async function GameEntryPage({ params }: PageProps) {
  const entry = await load(params);
  if (!entry) notFound();
  await connection();
  const game = entry.gameId === UNSORTED_GAME_ID ? null : publicGame(entry.gameId);
  const backHref = entry.gameId === UNSORTED_GAME_ID ? "/games/unsorted" : `/games/${entry.gameId}`;
  const sourceOk = entry.sourceHref?.startsWith("https://") ?? false;

  return (
      <PageShell backHref={backHref} backLabel={game ? `回到${game.title}` : "回到待整理"}>
      <PageContainer className="max-w-[40rem]">
        <p className="text-[11px] tracking-[0.18em] text-lab-primary">
          {gameKindLabel(entry.kind)} · 版本 {entry.season || "未知"}
        </p>
        <h1 className="mt-3 text-balance text-[1.75rem] font-semibold leading-[1.22] tracking-tight text-lab-ink">
          {entry.title}
        </h1>
        {entry.summary ? (
          <p className="mt-4 text-[15px] leading-relaxed text-lab-ink-muted">{entry.summary}</p>
        ) : null}
        <dl className="mt-6 space-y-2 text-sm leading-relaxed text-lab-ink-subtle">
          {entry.unresolvedGame ? (
            <div>
              <dt className="inline">游戏：</dt>
              <dd className="inline">{entry.unresolvedGame}</dd>
            </div>
          ) : null}
          {entry.tags.length > 0 ? (
            <div>
              <dt className="inline">标签：</dt>
              <dd className="inline">{entry.tags.join("、")}</dd>
            </div>
          ) : null}
          {entry.sourceLabel ? (
            <div>
              <dt className="inline">来源：</dt>
              <dd className="inline">
                {sourceOk && entry.sourceHref ? (
                  <a
                    href={entry.sourceHref}
                    className="text-lab-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-lab-primary"
                  >
                    {entry.sourceLabel}
                  </a>
                ) : (
                  entry.sourceLabel
                )}
              </dd>
            </div>
          ) : (
            <div>来源没有写。</div>
          )}
          {entry.ingestedAt ? <div>收录 {entry.ingestedAt}</div> : <div>收录时间未知。</div>}
          {entry.updatedAt ? <div>更新 {entry.updatedAt}</div> : null}
        </dl>
        {entry.prose ? (
          <div className="mt-12">
            <WikiMarkdown source={entry.prose} />
          </div>
        ) : null}
        <p className="mt-16 border-t border-lab-hairline pt-4">
          <Link
            href={backHref}
            className="inline-flex min-h-11 items-center text-sm text-lab-ink-subtle outline-none hover:text-lab-ink focus-visible:ring-2 focus-visible:ring-lab-primary"
          >
            {game ? `回到${game.title}` : "回到待整理"}
          </Link>
        </p>
      </PageContainer>
    </PageShell>
  );
}
