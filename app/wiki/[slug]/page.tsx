import { SectionZone } from "@/components/gallery/section-zone";
import { PageContainer } from "@/components/lab/page-container";
import { PageShell } from "@/components/lab/page-shell";
import { WikiDeleteButton } from "@/components/wiki/wiki-delete-button";
import { WikiFigure } from "@/components/wiki/wiki-figure";
import { WikiByline, WikiFacts } from "@/components/wiki/wiki-meta";
import { WikiMarkdown } from "@/components/wiki/wiki-markdown";
import { WikiShare } from "@/components/wiki/wiki-share";
import { bulletExposesPrivatePath } from "@/lib/content/wiki-media";
import { readWikiNote } from "@/lib/content/wiki-store";
import { isWikiDraft } from "@/lib/games/knowledge";
import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
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
  const note = await readWikiNote(decoded);
  if (!note || isWikiDraft(note)) return null;
  return note;
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

  const extra = note.bullets.filter(
    (bullet) =>
      bullet.label !== "作者" &&
      bullet.label !== "入库" &&
      !bulletExposesPrivatePath(bullet.value)
  );

  return (
    <PageShell backHref="/wiki" backLabel="知识库">
      <PageContainer className="max-w-[40rem] selection:bg-lab-primary/25 selection:text-lab-ink">
        <article>
          <SectionZone index="01" label="Note">
            <h1 className="text-balance text-[1.75rem] font-semibold leading-[1.22] tracking-tight text-lab-ink md:text-[2.125rem]">
              {note.title}
            </h1>
            <div className="mt-4">
              <WikiByline author={note.author} ingestedAt={note.ingestedAt} />
            </div>
            <WikiFacts bullets={extra} />
            <WikiFigure slug={note.slug} title={note.title} body={note.body} bullets={note.bullets} />
          </SectionZone>

          <div className="mt-12">
            <WikiMarkdown source={note.body} />
          </div>

          <footer className="mt-16 flex flex-col gap-1 border-t border-lab-hairline pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/wiki"
              className="inline-flex min-h-11 items-center text-sm text-lab-ink-subtle transition-colors hover:text-lab-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40"
            >
              返回列表
            </Link>
            <div className="flex flex-col gap-4 sm:items-end">
              <WikiShare title={note.title} />
              <WikiDeleteButton
                appearance="footer"
                slug={note.slug}
                title={note.title}
                redirectTo="/wiki"
              />
            </div>
          </footer>
        </article>
      </PageContainer>
    </PageShell>
  );
}
