import { MediaGallery } from "@/components/preview/media-gallery";
import { SiteHeader } from "@/components/lab/site-header";
import { SiteShell } from "@/components/lab/site-shell";
import { listWikiNotes } from "@/lib/content/wiki-store";
import { publicWikiNotes } from "@/lib/games/knowledge";
import { siteDescription, siteTitle } from "@/lib/site-config";
import type { Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: { absolute: siteTitle },
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    title: siteTitle,
    description: siteDescription,
  },
};

export default async function HomePage() {
  await connection();
  const notes = publicWikiNotes(await listWikiNotes());

  return (
    <SiteShell>
      <SiteHeader />
      <MediaGallery notes={notes.slice(0, 3)} />
    </SiteShell>
  );
}
