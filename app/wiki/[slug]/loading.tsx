import { PageContainer } from "@/components/lab/page-container";
import { PageShell } from "@/components/lab/page-shell";
import { WikiArticleSkeleton } from "@/components/wiki/wiki-skeleton";

export default function WikiNoteLoading() {
  return (
    <PageShell backHref="/wiki" backLabel="知识库">
      <PageContainer className="max-w-[40rem]">
        <WikiArticleSkeleton />
      </PageContainer>
    </PageShell>
  );
}
