import { PageContainer } from "@/components/lab/page-container";
import { PageShell } from "@/components/lab/page-shell";
import { WikiListSkeleton } from "@/components/wiki/wiki-skeleton";

export default function WikiLoading() {
  return (
    <PageShell>
      <PageContainer className="w-full max-w-6xl">
        <WikiListSkeleton />
      </PageContainer>
    </PageShell>
  );
}
