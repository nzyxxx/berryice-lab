import { PageContainer } from "@/components/lab/page-container";
import { PageShell } from "@/components/lab/page-shell";
import Link from "next/link";

export default function GameNotFound() {
  return (
    <PageShell backHref="/games" backLabel="游戏">
      <PageContainer className="max-w-3xl">
        <h1 className="text-display-section text-balance">没有这一页</h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-lab-ink-muted">
          这条不属于这个游戏，还没公开，或者游戏还没有写进来。
        </p>
        <Link
          href="/games"
          className="mt-8 inline-flex min-h-11 items-center text-sm text-lab-ink outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
        >
          回到游戏
        </Link>
      </PageContainer>
    </PageShell>
  );
}
