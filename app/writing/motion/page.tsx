import { PageContainer } from "@/components/lab/page-container";
import { PageShell } from "@/components/lab/page-shell";
import { MotionStage } from "@/components/writing/motion-stage";
import { guns } from "@/lib/data/guns-catalog";
import { PUBLIC_GAMES } from "@/lib/games/catalog";
import { siteIndex } from "@/lib/site-config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "动效笔记",
  description: "这个站把视频里的十六种动效用在哪里，以及哪些只在这一页演示。",
};

export default function MotionNotePage() {
  return (
    <PageShell backHref="/writing" backLabel="写作">
      <PageContainer>
        <p className="text-[11px] tracking-[0.18em] text-lab-primary">技术笔记</p>
        <h1 className="mt-3 max-w-xl text-display-section text-balance">这些动效怎么用在这个站上</h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-lab-ink-muted">
          这不是攻略，也不进游戏目录。首页只留聚光、抬升、错峰、倾斜、磁吸和慢一层的背景。解码、打字、跑马灯和缓动对比在这一页手动播放。
        </p>
        <MotionStage guns={guns.length} channels={siteIndex.length} games={PUBLIC_GAMES.length} />
      </PageContainer>
    </PageShell>
  );
}
