import { SectionZone } from "@/components/gallery/section-zone";
import { PageContainer } from "@/components/lab/page-container";
import { PageShell } from "@/components/lab/page-shell";
import { arcs, articles } from "@/lib/content/articles";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Clock, TvMinimalPlay } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * 正文没就绪的剧集不渲染成链接：悬停抬起和箭头都是「可点」的暗示，
 * 点了却停在原地，比不给入口更伤。
 */
function ArticleSurface({
  href,
  className,
  children,
}: {
  href?: string;
  className?: string;
  children: ReactNode;
}) {
  const base = cn(
    "group relative block overflow-hidden border border-white/10 bg-white/[0.03] backdrop-blur-md",
    className
  );

  if (!href) return <div className={base}>{children}</div>;

  return (
    <Link
      href={href}
      className={cn(
        base,
        "transition-[border-color,background-color,transform] duration-200",
        "hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40"
      )}
    >
      {children}
    </Link>
  );
}

function ArticleStatus({ href }: { href?: string }) {
  if (href) return null;
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-lab-ink-tertiary">
      全文撰写中
    </span>
  );
}

export default function ArticlesPage() {
  const featured = articles.find((a) => a.featured);
  const rest = articles.filter((a) => a.id !== featured?.id);
  const arcCounts = new Map<string, number>();
  for (const a of articles) {
    arcCounts.set(a.arcId, (arcCounts.get(a.arcId) || 0) + 1);
  }

  return (
    <PageShell>
      <PageContainer>
        <SectionZone
          index="01"
          label="Brief"
          title="希腊神话剧场"
          description="把荷马史诗拆成短剧集，像追剧一样读神话。"
          headingLevel="h1"
        />

        <section className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {arcs.map((arc) => (
            <div
              key={arc.id}
              className={cn(
                "rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md",
                "transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
              )}
            >
              <div className="text-xs text-lab-ink-tertiary">{arc.title}</div>
              <div className="mt-1 text-2xl font-semibold tracking-tight text-lab-ink" style={{ color: arc.color }}>
                {arcCounts.get(arc.id) ?? arc.count}
              </div>
              <div className="mt-1 text-[11px] text-lab-ink-subtle">已更新</div>
            </div>
          ))}
        </section>

        {featured && (
          <section className="mt-10">
            <ArticleSurface
              href={featured.href}
              className="rounded-2xl border-lab-primary/25 p-6 sm:p-8"
            >
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-lab-primary/25 bg-lab-primary/10 px-2.5 py-1 text-[11px] text-lab-primary">
                <TvMinimalPlay className="size-3" />
                {featured.arc} · 第 {featured.episode} / {featured.totalEpisodes} 集
              </span>
              <h2 className="text-2xl font-semibold tracking-tight text-lab-ink sm:text-3xl">
                {featured.title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-lab-ink-subtle sm:text-base">
                {featured.summary}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-lab-ink-tertiary">
                <span>{featured.publishedAt}</span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {featured.readingTime}
                </span>
                <ArticleStatus href={featured.href} />
              </div>
              {featured.href ? (
                <ArrowUpRight className="absolute right-5 top-5 size-5 text-lab-ink-tertiary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-lab-primary" />
              ) : null}
            </ArticleSurface>
          </section>
        )}

        <SectionZone index="02" label="Episodes" className="mt-12">
          <div className="grid grid-cols-1 gap-3">
            {rest.map((article) => {
              const arcMeta = arcs.find((a) => a.id === article.arcId);
              return (
                <ArticleSurface
                  key={article.id}
                  href={article.href}
                  className="flex flex-col gap-2 rounded-2xl p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-lab-ink-subtle"
                      style={{ borderColor: `${arcMeta?.color ?? "#fff"}30`, color: arcMeta?.color ?? "#fff" }}
                    >
                      {article.arc} · {article.episode}/{article.totalEpisodes}
                    </span>
                    {article.href ? (
                      <ArrowUpRight className="size-4 shrink-0 text-lab-ink-tertiary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-lab-primary" />
                    ) : null}
                  </div>
                  <h3 className="text-lg font-medium tracking-tight text-lab-ink">{article.title}</h3>
                  <p className="text-sm leading-relaxed text-lab-ink-subtle">{article.summary}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-lab-ink-tertiary">
                    <span>{article.publishedAt}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {article.readingTime}
                    </span>
                    <ArticleStatus href={article.href} />
                  </div>
                </ArticleSurface>
              );
            })}
          </div>
        </SectionZone>
      </PageContainer>
    </PageShell>
  );
}
