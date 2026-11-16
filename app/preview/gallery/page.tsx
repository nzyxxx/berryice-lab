import { MediaGallery } from "@/components/preview/media-gallery";
import { SiteHeader } from "@/components/lab/site-header";
import { SiteShell } from "@/components/lab/site-shell";
import { assembleHomeFeed } from "@/lib/content/home-feed";
import { listWikiNotes } from "@/lib/content/wiki-store";
import { articles } from "@/lib/content/writing";
import { PUBLIC_GAMES } from "@/lib/games/catalog";
import type { Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "方向 A · 画廊",
  robots: { index: false, follow: false },
};

export default async function GalleryPreviewPage() {
  await connection();
  const updates = assembleHomeFeed({
    notes: await listWikiNotes(),
    games: PUBLIC_GAMES,
    articles,
  });

  return (
    <SiteShell>
      <SiteHeader />
      <MediaGallery updates={updates} />
    </SiteShell>
  );
}
