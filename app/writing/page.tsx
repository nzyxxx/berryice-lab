import { ArticleCard } from "@/components/gallery/article-card";
import { EmptyState } from "@/components/gallery/empty-state";
import { NoteCard } from "@/components/gallery/note-card";
import { SectionZone } from "@/components/gallery/section-zone";
import { PageContainer } from "@/components/lab/page-container";
import { PageShell } from "@/components/lab/page-shell";
import { articles, notes } from "@/lib/content/writing";
import { socialLinks } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "写作",
  description: "BerryIce 的长文与随记。",
};

export default function WritingPage() {
  const empty = articles.length === 0 && notes.length === 0;
  const github = socialLinks.find((s) => s.id === "github");

  return (
    <PageShell>
      <PageContainer>
        <SectionZone
          index="01"
          label="Brief"
          title="写作"
          description="长文和随记放在一起。写完才会出现在这儿。"
          headingLevel="h1"
        />

        {empty ? (
          <div className="mt-12">
            <EmptyState
              title="还没有公开的文章"
              description="在写，但没写完的东西不往这儿摆。真正在跑的东西在三角洲那边。"
              action={
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/delta-gun"
                    className={cn(
                      "inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-medium",
                      "border border-lab-primary/35 bg-lab-primary/12 text-lab-primary",
                      "transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-lab-primary/18",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40"
                    )}
                  >
                    去三角洲实验室
                    <ArrowUpRight className="size-4" />
                  </Link>
                  {github && (
                    <Link
                      href={github.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-medium",
                        "border border-white/12 bg-white/5 text-lab-ink",
                        "transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-white/10",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40"
                      )}
                    >
                      看 GitHub
                      <ArrowUpRight className="size-4" />
                    </Link>
                  )}
                </div>
              }
            />
          </div>
        ) : (
          <>
            {articles.length > 0 && (
              <SectionZone index="02" label="Longform" title="长文" className="mt-12">
                <div className="grid grid-cols-1 gap-3">
                  {articles.map((article, index) => (
                    <ArticleCard key={article.id} article={article} index={index} />
                  ))}
                </div>
              </SectionZone>
            )}

            {notes.length > 0 && (
              <SectionZone
                index={articles.length > 0 ? "03" : "02"}
                label="Notes"
                title="随记"
                className="mt-12"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {notes.map((note, index) => (
                    <NoteCard key={note.id} note={note} index={index} />
                  ))}
                </div>
              </SectionZone>
            )}
          </>
        )}
      </PageContainer>
    </PageShell>
  );
}
