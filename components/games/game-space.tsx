import { controlClass, fieldClass } from "@/components/lab/control";
import { GAME_KINDS, gameKindLabel, gameSpaceHref, type GameEntryIndex, type GameQuery } from "@/lib/games/knowledge";
import Link from "next/link";

export function GameSearch({ gameId, query }: { gameId: string; query: GameQuery }) {
  return (
    <form action={gameId === "unsorted" ? "/games/unsorted" : `/games/${gameId}`} method="get" className="mt-8" role="search">
      <label htmlFor="game-q" className="text-[11px] tracking-[0.18em] text-lab-primary">
        搜索
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <input
          id="game-q"
          name="q"
          defaultValue={query.q ?? ""}
          placeholder="标题、摘要或标签"
          className={fieldClass}
        />
        {query.kind ? <input type="hidden" name="kind" value={query.kind} /> : null}
        <button
          type="submit"
          className={controlClass.primary}
        >
          查找
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <KindLink gameId={gameId} query={query} kind="" label="全部" />
        {GAME_KINDS.map((kind) => (
          <KindLink key={kind.id} gameId={gameId} query={query} kind={kind.id} label={kind.label} />
        ))}
      </div>
    </form>
  );
}

function KindLink({
  gameId,
  query,
  kind,
  label,
}: {
  gameId: string;
  query: GameQuery;
  kind: string;
  label: string;
}) {
  const current = (query.kind ?? "") === kind;
  return (
    <Link
      href={gameSpaceHref(gameId, { q: query.q, kind: kind || undefined, page: 1 })}
      aria-current={current ? "page" : undefined}
      className={`inline-flex min-h-11 items-center rounded-full px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-lab-primary ${
        current ? "text-lab-primary" : "text-lab-ink-subtle hover:text-lab-ink"
      }`}
    >
      {label}
    </Link>
  );
}

export function GameEntryList({
  gameId,
  entries,
  query,
  page,
  pages,
  empty,
}: {
  gameId: string;
  entries: readonly GameEntryIndex[];
  query: GameQuery;
  page: number;
  pages: number;
  empty: string;
}) {
  if (entries.length === 0) {
    return (
      <p className="mt-10 border-t border-lab-hairline pt-8 text-[15px] leading-relaxed text-lab-ink-muted">{empty}</p>
    );
  }

  return (
    <>
      <ul className="mt-8 border-t border-lab-hairline">
        {entries.map((entry) => (
          <li key={entry.slug} className="border-b border-lab-hairline">
            <Link
              href={`/games/${gameId === "unsorted" ? "unsorted" : gameId}/${encodeURIComponent(entry.slug)}`}
              className="block py-4 outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
            >
              <span className="text-[11px] tracking-[0.18em] text-lab-primary">
                {gameKindLabel(entry.kind)}
                {entry.season ? ` · 版本 ${entry.season}` : ""}
              </span>
              <span className="mt-1 block text-[15px] font-medium tracking-tight text-lab-ink">{entry.title}</span>
              {entry.summary ? (
                <span className="mt-1 block text-sm leading-relaxed text-lab-ink-subtle">{entry.summary}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
      {pages > 1 ? (
        <nav aria-label="分页" className="mt-6 flex gap-4 text-sm">
          {page > 1 ? (
            <Link
              href={gameSpaceHref(gameId, { ...query, page: page - 1 })}
              className="inline-flex min-h-11 items-center text-lab-ink-subtle outline-none hover:text-lab-ink focus-visible:ring-2 focus-visible:ring-lab-primary"
            >
              上一页
            </Link>
          ) : null}
          <span className="inline-flex min-h-11 items-center text-lab-ink-subtle">
            {page} / {pages}
          </span>
          {page < pages ? (
            <Link
              href={gameSpaceHref(gameId, { ...query, page: page + 1 })}
              className="inline-flex min-h-11 items-center text-lab-ink-subtle outline-none hover:text-lab-ink focus-visible:ring-2 focus-visible:ring-lab-primary"
            >
              下一页
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
