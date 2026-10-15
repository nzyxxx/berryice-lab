import type { MetadataRoute } from "next";

import { getGuns } from "@/lib/data/guns";
import { ensureStreamerTables, listStreamers } from "@/lib/repositories/streamersRepo";
import { getSiteUrl } from "@/lib/site-config";

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
  { path: "/delta-gun", changeFrequency: "daily", priority: 0.9 },
  { path: "/delta-gun/guns", changeFrequency: "weekly", priority: 0.8 },
  { path: "/delta-gun/community", changeFrequency: "daily", priority: 0.8 },
  { path: "/delta-gun/streamers", changeFrequency: "daily", priority: 0.8 },
  { path: "/delta-gun/my-loadouts", changeFrequency: "monthly", priority: 0.4 },
];

async function streamerEntries(siteUrl: string): Promise<MetadataRoute.Sitemap> {
  try {
    await ensureStreamerTables();
    const streamers = await listStreamers();
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
    console.warn(
      "sitemap: 主播页未写入（没有数据库时跳过）:",
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  return [...staticEntries, ...gunEntries, ...(await streamerEntries(siteUrl))];
}
