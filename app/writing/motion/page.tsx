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
        <h1 className="mt-3 max-w-xl text-display-section text-balance">把一段六分钟的动效课用到这个站上</h1>
        <p className="mt-4 max-w-xl text-[15px] leading-7 text-lab-ink-muted">
          课是小刷 AI 全栈 2026 年 11 月 12 日的那条，约六分半。作者没有指定要用哪一套动画库。下面按视频顺序写清每一项在画面里做什么、这个站把它放在哪、怎样触发和停下。首页只留少数会跟着指针或滚动发生的效果。会循环、会改字的，留在这一页，点了才播放。
        </p>
        <MotionStage guns={guns.length} channels={siteIndex.length} games={PUBLIC_GAMES.length} />
      </PageContainer>
    </PageShell>
  );
}
