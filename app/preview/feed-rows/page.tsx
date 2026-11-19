import { HomeFeed } from "@/components/preview/home-feed";
import { PageContainer } from "@/components/lab/page-container";
import { PageShell } from "@/components/lab/page-shell";
import type { HomeUpdate } from "@/lib/content/home-feed";

const LONG = "测试数据 这是一条故意写得很长的标题，用来确认手机上也还是同一行";

const FIXTURE: HomeUpdate[] = [
  ["wiki", "知识库", "/wiki/fixture-0"],
  ["game", "游戏知识", "/games/delta/fixture-1"],
  ["writing", "写作", "/writing"],
  ["wiki", "知识库", "/wiki/fixture-3"],
  ["game", "游戏知识", "/games/delta/fixture-4"],
  ["writing", "写作", "/writing"],
  ["wiki", "知识库", "/wiki/fixture-6"],
  ["game", "游戏知识", "/games/palworld/fixture-7"],
].map(([kind, source, href], index) => ({
  id: `${kind}:fixture-${index}`,
  kind: kind as HomeUpdate["kind"],
  sourceLabel: source,
  title: `${LONG} ${index}`,
  summary: "",
  href,
  at: index === 3 ? null : `2026-11-${String(10 + index).padStart(2, "0")} 00:00`,
}));

/** 只给布局验收。不进首页，也不代表线上条数。 */
export default function FeedRowsPreview() {
  return (
    <PageShell backHref="/" backLabel="首页">
      <PageContainer>
        <p className="text-sm text-lab-ink-subtle">八条夹具，用来看手机是不是同一行。不是线上的动态。</p>
        <HomeFeed updates={FIXTURE} />
      </PageContainer>
    </PageShell>
  );
}
