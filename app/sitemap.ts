import type { MetadataRoute } from "next";

import { listWikiNotes } from "@/lib/content/wiki-store";
import { PUBLIC_GAMES } from "@/lib/games/catalog";
import { publicWikiNotes } from "@/lib/games/knowledge";
import { listGameIndex } from "@/lib/games/store";
import { getGuns } from "@/lib/data/guns";
import { deferWithoutDatabase, readStreamersCached } from "@/lib/runtime-database";
import { getSiteUrl } from "@/lib/site-config";
import { unstable_rethrow } from "next/navigation";

/** 主播名单每天变。站点地图跟着 ISR，不要在构建时冻成一年。 */
export const revalidate = 3600;

const STATIC_ROUTES: {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/writing", changeFrequency: "weekly", priority: 0.6 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/music", changeFrequency: "monthly", priority: 0.3 },
  { path: "/dafeiyu", changeFrequency: "monthly", priority: 0.4 },
  { path: "/stickers", changeFrequency: "monthly", priority: 0.4 },
  { path: "/games", changeFrequency: "weekly", priority: 0.6 },
  { path: "/games/delta", changeFrequency: "weekly", priority: 0.6 },
  { path: "/delta-gun", changeFrequency: "daily", priority: 0.9 },
  { path: "/delta-gun/guns", changeFrequency: "weekly", priority: 0.8 },
  { path: "/delta-gun/community", changeFrequency: "daily", priority: 0.8 },
  { path: "/delta-gun/streamers", changeFrequency: "daily", priority: 0.8 },
  { path: "/delta-gun/my-loadouts", changeFrequency: "monthly", priority: 0.4 },
];

async function wikiEntries(siteUrl: string): Promise<MetadataRoute.Sitemap> {
  const index: MetadataRoute.Sitemap[number] = {
    url: `${siteUrl}/wiki`,
    changeFrequency: "daily",
    priority: 0.6,
  };
  try {
    const notes = publicWikiNotes(await listWikiNotes());
    return [
      index,
      ...notes.map((note) => ({
        url: `${siteUrl}/wiki/${encodeURIComponent(note.slug)}`,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      })),
    ];
  } catch (error) {
    console.warn(
      "sitemap: 知识库笔记未写入:",
      error instanceof Error ? error.message : error
    );
    return [index];
  }
}

async function streamerEntries(siteUrl: string): Promise<MetadataRoute.Sitemap> {
  try {
    const streamers = await readStreamersCached();
    return streamers.map((streamer) => {
      const updated = new Date(streamer.collectedAt);
      return {
        url: `${siteUrl}/delta-gun/streamers/${encodeURIComponent(streamer.slug)}`,
        lastModified: Number.isNaN(updated.getTime()) ? undefined : updated,
        changeFrequency: "daily" as const,
        priority: 0.6,
      };
    });
  } catch (error) {
    unstable_rethrow(error);
    console.warn(
      "sitemap: 主播页未写入:",
      error instanceof Error ? error.message : error
    );
    throw error;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await deferWithoutDatabase();
  const siteUrl = getSiteUrl();
  const guns = await getGuns();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const gunEntries: MetadataRoute.Sitemap = guns.flatMap((gun) => [
    {
      url: `${siteUrl}/delta-gun/guns/${encodeURIComponent(gun.id)}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${siteUrl}/delta-gun/guns/${encodeURIComponent(gun.id)}/loadout`,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    },
  ]);

  let gameEntries: MetadataRoute.Sitemap = [];
  try {
    const entries = await listGameIndex(undefined, PUBLIC_GAMES);
    gameEntries = entries
      .filter((entry) => entry.visibility === "public")
      .map((entry) => ({
        url: `${siteUrl}/games/${entry.gameId}/${encodeURIComponent(entry.slug)}`,
        changeFrequency: "weekly" as const,
        priority: 0.4,
      }));
  } catch (error) {
    console.warn("sitemap: 游戏条目未写入:", error instanceof Error ? error.message : error);
  }

  return [
    ...staticEntries,
    ...(await wikiEntries(siteUrl)),
    ...gameEntries,
    ...gunEntries,
    ...(await streamerEntries(siteUrl)),
  ];
}
