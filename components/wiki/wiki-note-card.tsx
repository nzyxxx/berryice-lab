import { WikiDeleteButton } from "@/components/wiki/wiki-delete-button";
import { glassSurfaceClass } from "@/components/uiverse/glass-surface";
import type { WikiNote } from "@/lib/content/wiki-store";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function WikiNoteCard({ note, index }: { note: WikiNote; index: number }) {
  const byline = [note.author, note.sourceLabel].filter(Boolean).join(" · ");

  return (
    <article
      className={cn(glassSurfaceClass(), "animate-tile-in rounded-2xl")}
      style={{ animationDelay: `${Math.min(index, 3) * 0.05}s` }}
    >
      <Link
        href={`/wiki/${encodeURIComponent(note.slug)}`}
        className="block p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lab-primary/40"
      >
        <h3 className="text-[15px] font-medium tracking-tight text-lab-ink">{note.title}</h3>
        {note.summary ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-lab-ink-subtle">{note.summary}</p>
        ) : (
          <p className="mt-2 text-sm text-lab-ink-tertiary">这篇没有「这条讲什么」</p>
        )}
        <p className="mt-3 text-xs leading-relaxed text-lab-ink-tertiary">
          {byline ? <span className="text-lab-ink-subtle">{byline}</span> : null}
          {byline ? <span aria-hidden> · </span> : null}
          {note.ingestedAt ? <span>入库 {note.ingestedAt}</span> : <span>没有入库时间</span>}
        </p>
      </Link>
      <div className="border-t border-white/[0.08] px-3 py-1">
        <WikiDeleteButton slug={note.slug} title={note.title} className="w-full" />
      </div>
    </article>
  );
}
