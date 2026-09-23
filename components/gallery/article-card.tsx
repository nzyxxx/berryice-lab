import { glassSurfaceClass } from "@/components/uiverse/glass-surface";
import type { Article } from "@/lib/content/writing";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Clock } from "lucide-react";
import Link from "next/link";

export function ArticleCard({ article, index = 0 }: { article: Article; index?: number }) {
  const external = article.href.startsWith("http");

  return (
    <Link
      href={article.href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(
        glassSurfaceClass(),
        "group animate-tile-in block rounded-2xl p-5",
        "transition-transform duration-200 hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/30"
      )}
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-medium tracking-tight text-lab-ink">{article.title}</h3>
        <ArrowUpRight className="size-4 shrink-0 text-lab-ink-tertiary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-lab-primary" />
      </div>

      <p className="mt-2 text-sm leading-relaxed text-lab-ink-subtle">{article.summary}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-lab-ink-tertiary">
        <span>{article.publishedAt}</span>
        <span className="flex items-center gap-1">
          <Clock className="size-3" />
          {article.readingTime}
        </span>
        {article.tags.map((tag) => (
          <span key={tag} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5">
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
