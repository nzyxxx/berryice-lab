import { HomeCover } from "@/components/lab/home-cover";
import { SiteHeader } from "@/components/lab/site-header";
import { SiteShell } from "@/components/lab/site-shell";
import { listWikiNotes } from "@/lib/content/wiki-store";
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
  const notes = await listWikiNotes();

  return (
    <SiteShell>
      <SiteHeader />
      <HomeCover notes={notes.slice(0, 3)} />
    </SiteShell>
  );
}
