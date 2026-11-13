import { PageContainer } from "@/components/lab/page-container";
import { PageShell } from "@/components/lab/page-shell";
import { PlaylistDraft } from "@/components/music/playlist-draft";
import { SectionZone } from "@/components/gallery/section-zone";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "歌单",
  description: "只保存在这台浏览器里的曲目草稿，链接跳到官方页面。",
};

export default function MusicPage() {
  return (
    <PageShell>
      <PageContainer>
        <SectionZone index="01" label="Draft" headingLevel="h1" title="歌单">
          <p className="max-w-xl text-[15px] leading-relaxed text-lab-ink-muted">
            写下曲名、歌手，再放一条官方 https 链接。列表只存在这台浏览器，不会公开，也不会去抓音频。
          </p>
        </SectionZone>
        <PlaylistDraft />
        <p className="mt-12 max-w-xl text-sm leading-relaxed text-lab-ink-subtle">
          语音没有成片。这一页不做录音，也不上传。
        </p>
      </PageContainer>
    </PageShell>
  );
}
