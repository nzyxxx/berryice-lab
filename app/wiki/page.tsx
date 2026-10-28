import { SectionZone } from "@/components/gallery/section-zone";
import { PageContainer } from "@/components/lab/page-container";
import { PageShell } from "@/components/lab/page-shell";
import { WikiEmpty } from "@/components/wiki/wiki-empty";
import { WikiNoteRow } from "@/components/wiki/wiki-note-row";
import { listWikiNotes } from "@/lib/content/wiki-store";
import type { Metadata } from "next";
import { connection } from "next/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "知识库",
  description: "Bear 收录进 BerryIce 的笔记。",
};

export default async function WikiPage() {
  // 文件是运行时写的。不在这里挡住的话，构建会把当时的目录烤进静态页。
  await connection();
  const notes = await listWikiNotes();

  return (
    <PageShell>
      <PageContainer className="w-full max-w-6xl selection:bg-lab-primary/25 selection:text-lab-ink">
        <SectionZone index="01" label="Brief">
          <h1 className="text-display-section text-balance">知识库</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-lab-ink-muted">
            Bear 收录进来的笔记。
          </p>
        </SectionZone>

        {notes.length === 0 ? (
          <WikiEmpty />
        ) : (
          <SectionZone
            index="02"
            label="Notes"
            title="笔记"
            description={`${notes.length} 篇，按入库时间，新的在前。`}
            className="mt-16"
          >
            <ul className="border-t border-lab-hairline">
              {notes.map((note) => (
                <WikiNoteRow key={note.slug} note={note} />
              ))}
            </ul>
          </SectionZone>
        )}
      </PageContainer>
    </PageShell>
  );
}
