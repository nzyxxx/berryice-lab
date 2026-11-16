import { MediaGallery } from "@/components/preview/media-gallery";
import { SiteHeader } from "@/components/lab/site-header";
import { SiteShell } from "@/components/lab/site-shell";
import { assembleHomeFeed } from "@/lib/content/home-feed";
import { listWikiNotes } from "@/lib/content/wiki-store";
import { articles } from "@/lib/content/writing";
import { PUBLIC_GAMES } from "@/lib/games/catalog";
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
  // 线上笔记在请求时从 WIKI_CONTENT_DIR 或 content/wiki 现读，多数不在 git 里。
  // connection() 让构建停在请求阶段，不会把构建当时的目录烤进静态页。
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
