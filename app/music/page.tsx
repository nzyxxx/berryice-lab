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
            曲名、歌手，和一条官方链接。这份清单只留在这台浏览器。
          </p>
        </SectionZone>
        <PlaylistDraft />
      </PageContainer>
    </PageShell>
  );
}
