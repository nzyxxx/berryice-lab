import { Suspense } from "react";
import { CommunityCodesView } from "@/components/delta-gun/community-codes-view";
import { PageContainer } from "@/components/lab/page-container";

export default function CommunityCodesPage() {
  return (
    <PageContainer className="!pt-8">
      <Suspense fallback={<p className="text-lab-ink-subtle">加载社区改枪码…</p>}>
        <CommunityCodesView />
      </Suspense>
    </PageContainer>
  );
}
