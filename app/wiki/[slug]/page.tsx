import { SectionZone } from "@/components/gallery/section-zone";
import { PageContainer } from "@/components/lab/page-container";
import { PageShell } from "@/components/lab/page-shell";
import { WikiDeleteButton } from "@/components/wiki/wiki-delete-button";
import { WikiInline, WikiMarkdown } from "@/components/wiki/wiki-markdown";
import { glassSurfaceClass } from "@/components/uiverse/glass-surface";
import { readWikiNote } from "@/lib/content/wiki-store";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

async function loadNote(params: PageProps["params"]) {
  await connection();
  const { slug } = await params;
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    return null;
  }
  return readWikiNote(decoded);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const note = await loadNote(params);
  if (!note) return { title: "笔记不存在" };
  return {
    title: note.title,
    description: note.summary || note.title,
  };
}

export default async function WikiNotePage({ params }: PageProps) {
  const note = await loadNote(params);
  if (!note) notFound();

  const extra = note.bullets.filter((bullet) => bullet.label !== "作者" && bullet.label !== "入库");

  return (
    <PageShell backHref="/wiki" backLabel="知识库">
      <PageContainer className="max-w-[40rem]">
        <SectionZone index="01" label="Note" title={note.title} headingLevel="h1">
          <div className={cn(glassSurfaceClass(), "rounded-2xl px-4 py-3 text-sm leading-relaxed")}>
            {note.author ? <p className="text-lab-ink-muted">作者 · {note.author}</p> : null}
            {note.ingestedAt ? (
              <p className={cn("text-lab-ink-subtle", note.author && "mt-1")}>入库 · {note.ingestedAt}</p>
            ) : null}
            {extra.length > 0 ? (
              <ul className="mt-3 space-y-2 border-t border-white/[0.08] pt-3">
                {extra.map((bullet) => (
                  <li key={bullet.label}>
                    <span className="text-xs text-lab-ink-tertiary">{bullet.label}</span>
                    <span className="mt-0.5 block text-lab-ink-muted">
                      <WikiInline text={bullet.value} />
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="mt-4">
            <WikiDeleteButton slug={note.slug} title={note.title} redirectTo="/wiki" />
          </div>
        </SectionZone>

        <div className="mt-10">
          <WikiMarkdown source={note.body} />
        </div>
      </PageContainer>
    </PageShell>
  );
}
