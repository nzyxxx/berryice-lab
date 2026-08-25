import { StreamersView } from "@/components/delta-gun/streamers-view";
import { SectionZone } from "@/components/gallery/section-zone";
import { PageContainer } from "@/components/lab/page-container";
import { ensureStreamerTables, listStreamers } from "@/lib/repositories/streamersRepo";
import type { StoredStreamer } from "@/lib/types/streamer";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "主播改枪码 · 三角洲",
  description: "职业选手与抖音主播的三角洲行动改枪方案，按平台筛选，一键复制或导入改枪台。",
};

async function loadStreamers(): Promise<StoredStreamer[]> {
  try {
    await ensureStreamerTables();
    return await listStreamers();
  } catch (error) {
    console.error("加载主播列表失败:", error);
    return [];
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
        description="职业选手、抖音主播与改枪 UP 主的实战配装，点进任意一位查看全部方案。"
        className="mb-8"
      />
      <StreamersView streamers={streamers} />
      <p className="mt-6 text-center text-xs text-lab-ink-tertiary">数据来自 yunmaku.com，每日同步</p>
    </PageContainer>
  );
}
