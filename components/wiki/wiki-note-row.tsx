import { WikiDeleteButton } from "@/components/wiki/wiki-delete-button";
import type { WikiNote } from "@/lib/content/wiki-store";
import { cn } from "@/lib/utils";
import Link from "next/link";

function indexDate(note: WikiNote): string | null {
  return note.ingestedSort?.slice(0, 10) ?? null;
}

/** 一篇笔记在列表里的一行。分隔靠发丝线，不靠卡片盒子。 */
export function WikiNoteRow({ note }: { note: WikiNote }) {
  const date = indexDate(note);
  const meta = [note.author, note.sourceLabel].filter(Boolean);

  return (
    <li className="border-b border-lab-hairline">
      <div className="-mx-2 flex items-start rounded-lg px-2 transition-colors hover:bg-lab-surface-3/70">
        <Link
          href={`/wiki/${encodeURIComponent(note.slug)}`}
          className={cn(
            "group min-w-0 flex-1 rounded-md py-6 pr-2",
            "outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40"
          )}
        >
          {date ? (
            <p className="font-mono text-xs tabular-nums text-lab-ink-subtle">{date}</p>
          ) : null}
          <h3
            className={cn(
              "text-balance text-[17px] font-medium leading-snug tracking-tight text-lab-ink",
              "transition-colors group-hover:text-lab-primary",
              date && "mt-1.5"
            )}
          >
            {note.title}
          </h3>
          {note.summary ? (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-lab-ink-muted">{note.summary}</p>
          ) : null}
          {meta.length > 0 ? (
            <p className="mt-3 text-xs leading-relaxed text-lab-ink-subtle">{meta.join(" · ")}</p>
          ) : null}
        </Link>
        <div className="shrink-0 pt-4">
          <WikiDeleteButton appearance="row" slug={note.slug} title={note.title} />
        </div>
      </div>
    </li>
  );
}
