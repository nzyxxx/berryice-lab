import { NoteCard } from "@/components/gallery/note-card";
import { SectionZone } from "@/components/gallery/section-zone";
import { PageContainer } from "@/components/lab/page-container";
import { PageShell } from "@/components/lab/page-shell";
import { notes } from "@/lib/content/notes";

export default function NotesPage() {
  return (
    <PageShell>
      <PageContainer>
        <SectionZone
          index="01"
          label="Brief"
          title="笔记"
          description="短想法、片段、随记。不系统，但真实。"
        />

        <SectionZone index="02" label="Stream" className="mt-12">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {notes.map((note, index) => (
              <NoteCard key={note.id} note={note} index={index} />
            ))}
          </div>
        </SectionZone>
      </PageContainer>
    </PageShell>
  );
}
