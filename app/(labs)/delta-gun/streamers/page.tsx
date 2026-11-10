import { StreamersView } from "@/components/delta-gun/streamers-view";
import { SectionZone } from "@/components/gallery/section-zone";
import { PageContainer } from "@/components/lab/page-container";
import { deferWithoutDatabase, readStreamersCached } from "@/lib/runtime-database";
import type { StoredStreamer } from "@/lib/types/streamer";
import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";

// 主播名单按日更新。force-dynamic 会让每个访问都打库；
// 静态预渲染又会给出 s-maxage=31536000，nginx 能存一年。
// 一小时 ISR：共享缓存到期就回源，小机器不用每次查库。
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "主播改枪码 · 三角洲",
  description: "职业选手与抖音主播的三角洲行动改枪方案，按平台筛选，一键复制或导入改枪台。",
};

async function loadStreamers(): Promise<StoredStreamer[]> {
  await deferWithoutDatabase();
  try {
    return await readStreamersCached();
  } catch (error) {
    unstable_rethrow(error);
    console.error("加载主播列表失败:", error);
    // 连不上库就抛出。ISR 才会留着上一份页面，而不是把空列表存一小时。
    throw error;
  }
}

export default async function StreamersPage() {
  const streamers = await loadStreamers();

  return (
    <PageContainer>
      <SectionZone
        index="01"
        label="Players"
        title="主播改枪码"
        headingLevel="h1"
        description="S11 已核对的主播改枪方案。每条都能看到方向、推荐、赛季、发布日期和来源。"
        className="mb-8"
      />
      <StreamersView streamers={streamers} />
      <p className="mt-6 text-center text-xs text-lab-ink-tertiary">只列出 S11 核对方案。更早或其他赛季的枪码已归档，仍留在库里。</p>
    </PageContainer>
  );
}
