import { PageContainer } from "@/components/lab/page-container";
import { PageShell } from "@/components/lab/page-shell";

export default function GamesLoading() {
  return (
    <PageShell backHref="/games" backLabel="游戏">
      <PageContainer className="max-w-3xl">
        <p className="text-[15px] text-lab-ink-muted">正在打开这一页。</p>
      </PageContainer>
    </PageShell>
  );
}
