import { SectionZone } from "@/components/gallery/section-zone";
import { PageContainer } from "@/components/lab/page-container";
import { articles } from "@/lib/content/articles";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Clock, Tag } from "lucide-react";
import Link from "next/link";

export default function ArticlesPage() {
  const featured = articles.find((a) => a.featured);
  const rest = articles.filter((a) => a.id !== featured?.id);

  return (
    <PageContainer>
      <SectionZone
        index="01"
        label="Brief"
        title="文章"
        description="项目复盘与技术长文。"
      />

      {featured && (
        <section className="mt-12">
          <Link
            href={featured.href}
            className={cn(
              "group relative block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md sm:p-8",
              "transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
            )}
          >
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-lab-primary/25 bg-lab-primary/10 px-2.5 py-1 text-[11px] text-lab-primary">
              <Tag className="size-3" />
              精选
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
            </div>
            <ArrowUpRight className="absolute right-5 top-5 size-5 text-lab-ink-tertiary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-lab-primary" />
          </Link>
        </section>
      )}

      <SectionZone index="02" label="Archive" className="mt-12">
        <div className="grid grid-cols-1 gap-2">
          {rest.map((article) => (
            <Link
              key={article.id}
              href={article.href}
              className={cn(
                "group flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md",
                "transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-medium tracking-tight text-lab-ink">{article.title}</h3>
                <ArrowUpRight className="size-4 shrink-0 text-lab-ink-tertiary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-lab-primary" />
              </div>
              <p className="text-sm leading-relaxed text-lab-ink-subtle">{article.summary}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-lab-ink-tertiary">
                <span>{article.publishedAt}</span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {article.readingTime}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </SectionZone>
    </PageContainer>
  );
}
