import { ShelfDirection } from "@/components/preview/shelf-direction";
import { SiteHeader } from "@/components/lab/site-header";
import { SiteShell } from "@/components/lab/site-shell";
import { listWikiNotes } from "@/lib/content/wiki-store";
import { publicWikiNotes } from "@/lib/games/knowledge";
import type { Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "方向 B · 书架",
  robots: { index: false, follow: false },
};

export default async function ShelfPreviewPage() {
  await connection();
  const notes = publicWikiNotes(await listWikiNotes());

  return (
    <SiteShell>
      <SiteHeader />
      <ShelfDirection notes={notes.slice(0, 3)} />
    </SiteShell>
  );
}
