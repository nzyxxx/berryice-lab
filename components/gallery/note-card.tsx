import type { Note } from "@/lib/content/writing";
import { cn } from "@/lib/utils";
import { Quote } from "lucide-react";

export function NoteCard({ note, index = 0 }: { note: Note; index?: number }) {
  return (
    <article
      className={cn(
        "animate-tile-in relative rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md",
        "transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
      )}
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <Quote className="absolute right-4 top-4 size-5 text-lab-ink-tertiary/50" />
      <p className="pr-6 text-sm leading-relaxed text-lab-ink-subtle">{note.content}</p>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-lab-ink-tertiary">
        <span>{note.createdAt}</span>
        {note.source && <span className="rounded-md bg-white/5 px-2 py-0.5">{note.source}</span>}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {note.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-lab-ink-subtle"
          >
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}
