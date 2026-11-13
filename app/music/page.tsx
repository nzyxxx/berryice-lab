import { PageContainer } from "@/components/lab/page-container";
import { PageShell } from "@/components/lab/page-shell";
import { PlaylistDraft } from "@/components/music/playlist-draft";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "歌单",
  description: "只保存在这台浏览器里的曲目草稿，链接跳到官方页面。",
};

export default function MusicPage() {
  return (
    <PageShell>
      <PageContainer>
        <header className="max-w-xl">
          <p className="text-[11px] tracking-[0.18em] text-lab-primary">BerryIce</p>
          <h1 className="mt-3 text-display-section">歌单</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-lab-ink-muted">
            曲名、歌手，和一条官方链接。这份清单只留在这台浏览器。
          </p>
        </header>
        <PlaylistDraft />
      </PageContainer>
    </PageShell>
  );
}
