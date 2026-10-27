import { EmptyState } from "@/components/gallery/empty-state";
import { SectionZone } from "@/components/gallery/section-zone";
import { PageContainer } from "@/components/lab/page-container";
import { PageShell } from "@/components/lab/page-shell";
import { WikiNoteCard } from "@/components/wiki/wiki-note-card";
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
      <PageContainer className="max-w-[40rem]">
        <SectionZone
          index="01"
          label="Brief"
          title="知识库"
          headingLevel="h1"
          description="Bear 收录的笔记。手机上翻阅，不想留的可以从卡片上删掉。"
        />

        {notes.length === 0 ? (
          <div className="mt-12">
            <EmptyState
              title="知识库还是空的"
              description="收录进来的笔记会出现在这里。没有的时候就空着，不摆占位文章。"
            />
          </div>
        ) : (
          <SectionZone
            index="02"
            label="Notes"
            title="笔记"
            description={`${notes.length} 篇，按入库时间新的在前。`}
            className="mt-12"
          >
            <ul className="grid grid-cols-1 gap-3">
              {notes.map((note, index) => (
                <li key={note.slug}>
                  <WikiNoteCard note={note} index={index} />
                </li>
              ))}
            </ul>
          </SectionZone>
        )}
      </PageContainer>
    </PageShell>
  );
}
