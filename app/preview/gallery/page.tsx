import { MediaGallery } from "@/components/preview/media-gallery";
import { SiteHeader } from "@/components/lab/site-header";
import { SiteShell } from "@/components/lab/site-shell";
import { listWikiNotes } from "@/lib/content/wiki-store";
import type { Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "方向 A · 画廊",
  robots: { index: false, follow: false },
};

export default async function GalleryPreviewPage() {
  await connection();
  const notes = await listWikiNotes();

  return (
    <SiteShell>
      <SiteHeader />
      <MediaGallery notes={notes.slice(0, 3)} />
    </SiteShell>
  );
}
