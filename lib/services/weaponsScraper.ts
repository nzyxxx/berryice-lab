import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { SECOND_CLASS_TO_TYPE, WP_CATEGORY_TO_TYPE } from "@/lib/delta-gun/weapon-categories";
import { inferWeaponType } from "@/lib/delta-gun/weapon-utils";
import type { Gun, GunType, WeaponStats } from "@/lib/types/gun";

const AITAGS_WP_API = "https://g.aitags.cn/wp-json/wp/v2/weapon";
const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
  Accept: "application/json",
};

interface WpWeaponPost {
  slug: string;
  link: string;
  title: { rendered: string };
  weapon_category: number[];
  _embedded?: {
    "wp:featuredmedia"?: Array<{ source_url?: string }>;
  };
}

interface StatsSeedRow {
  name: string;
  pic?: string;
  prePic?: string;
  meatHarm: number;
  shootDistance: number;
  recoil: number;
  control: number;
  stable: number;
  hipShot: number;
  armorHarm: number;
  fireSpeed: number;
  capacity: number;
  fireMode?: string;
  muzzleVelocity?: number;
  soundDistance?: number;
  caliber?: string;
  secondClass?: string;
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/突击步枪|射手步枪|狙击步枪|冲锋枪|霰弹枪|战斗步枪|杠杆步枪|通用机枪|双管霰弹枪/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fff]/gi, "");
}

function resolveType(
  wpCategories: number[],
  statsRow?: StatsSeedRow
): GunType {
  if (statsRow?.secondClass && SECOND_CLASS_TO_TYPE[statsRow.secondClass]) {
    return SECOND_CLASS_TO_TYPE[statsRow.secondClass];
  }
  for (const catId of wpCategories) {
    const mapped = WP_CATEGORY_TO_TYPE[catId];
    if (mapped) return mapped;
  }
  return inferWeaponType(statsRow?.name ?? "");
}

function buildDescription(stats?: WeaponStats, name?: string): string {
  if (!stats) {
    return `${name ?? "该武器"}的社区改枪方案与配件搭配可在改枪台查看。`;
  }
  const parts: string[] = [];
  if (stats.caliber) parts.push(`口径 ${stats.caliber}`);
  if (stats.fireMode) parts.push(stats.fireMode);
  if (stats.capacity) parts.push(`弹匣 ${stats.capacity} 发`);
  return parts.length > 0 ? parts.join(" · ") : `${name} 基础性能数据`;
}

function seedRowToStats(row: StatsSeedRow): WeaponStats {
  return {
    meatHarm: row.meatHarm,
    shootDistance: row.shootDistance,
    recoil: row.recoil,
    control: row.control,
    stable: row.stable,
    hipShot: row.hipShot,
    armorHarm: row.armorHarm,
    fireSpeed: row.fireSpeed,
    capacity: row.capacity,
    fireMode: row.fireMode,
    muzzleVelocity: row.muzzleVelocity,
    soundDistance: row.soundDistance,
    caliber: row.caliber,
  };
}

function matchStatsRow(
  title: string,
  slug: string,
  statsIndex: Map<string, StatsSeedRow>
): StatsSeedRow | undefined {
  const keys = [
    normalizeName(title),
    normalizeName(slug),
    slug.toLowerCase().replace(/-/g, ""),
  ];
  for (const key of keys) {
    const hit = statsIndex.get(key);
    if (hit) return hit;
  }
  for (const [key, row] of statsIndex) {
    if (key.includes(normalizeName(slug)) || normalizeName(title).includes(key)) {
      return row;
    }
    if (normalizeName(row.name).includes(normalizeName(slug))) return row;
  }
  return undefined;
}

async function loadStatsSeed(): Promise<Map<string, StatsSeedRow>> {
  const seedPath = path.join(process.cwd(), "data/weapon-stats.seed.json");
  const raw = await readFile(seedPath, "utf8");
  const rows = JSON.parse(raw) as StatsSeedRow[];
  const index = new Map<string, StatsSeedRow>();
  for (const row of rows) {
    index.set(normalizeName(row.name), row);
  }
  return index;
}

async function fetchAllWpWeapons(): Promise<WpWeaponPost[]> {
  const all: WpWeaponPost[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const url = `${AITAGS_WP_API}?per_page=100&page=${page}&_embed`;
    const response = await fetch(url, { headers: FETCH_HEADERS, next: { revalidate: 0 } });
    if (!response.ok) {
      throw new Error(`武器列表抓取失败: HTTP ${response.status}`);
    }
    const totalPagesHeader = response.headers.get("x-wp-totalpages");
    totalPages = totalPagesHeader ? Number(totalPagesHeader) : 1;
    const batch = (await response.json()) as WpWeaponPost[];
    all.push(...batch);
    page += 1;
  }

  return all;
}

async function fetchStatsFromApi(): Promise<StatsSeedRow[] | null> {
  const base = process.env.DELTA_STATS_BASE_URL?.replace(/\/$/, "");
  if (!base) return null;

  const url = `${base}/api/gf/v1/system_public_data?type=weapon`;
  const headers: Record<string, string> = { ...FETCH_HEADERS, Accept: "application/json" };
  const apiKey = process.env.DELTA_STATS_API_KEY;
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  try {
    const response = await fetch(url, { headers, next: { revalidate: 0 } });
    const json = (await response.json()) as {
      code?: number;
      data?: { system_weapons?: Array<Record<string, unknown>> } | string;
    };
    if (json.code !== 0 || typeof json.data === "string") return null;
    const list = json.data?.system_weapons;
    if (!Array.isArray(list)) return null;

    return list.map((row) => ({
      name: String(row.name ?? ""),
      pic: row.pic as string | undefined,
      prePic: row.pre_pic as string | undefined,
      meatHarm: Number(row.meat_harm ?? 0),
      shootDistance: Number(row.shoot_distance ?? 0),
      recoil: Number(row.recoil ?? 0),
      control: Number(row.control ?? 0),
      stable: Number(row.stable ?? 0),
      hipShot: Number(row.hip_shot ?? 0),
      armorHarm: Number(row.armor_harm ?? 0),
      fireSpeed: Number(row.fire_speed ?? 0),
      capacity: Number(row.capacity ?? 0),
      fireMode: row.fire_mode as string | undefined,
      muzzleVelocity: Number(row.muzzle_velocity ?? 0),
      soundDistance: Number(row.sound_distance ?? 0),
      caliber: row.caliber as string | undefined,
      secondClass: row.second_class as string | undefined,
    }));
  } catch {
    return null;
  }
}

async function buildStatsIndex(): Promise<Map<string, StatsSeedRow>> {
  const apiRows = await fetchStatsFromApi();
  if (apiRows?.length) {
    const index = new Map<string, StatsSeedRow>();
    for (const row of apiRows) index.set(normalizeName(row.name), row);
    return index;
  }
  return loadStatsSeed();
}

export async function scrapeWeapons(): Promise<Gun[]> {
  const [wpPosts, statsIndex] = await Promise.all([fetchAllWpWeapons(), buildStatsIndex()]);
  const guns: Gun[] = [];

  for (const post of wpPosts) {
    const title = post.title.rendered.trim();
    const statsRow = matchStatsRow(title, post.slug, statsIndex);
    const stats = statsRow ? seedRowToStats(statsRow) : undefined;
    const type = resolveType(post.weapon_category ?? [], statsRow);
    const embeddedImage = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;

    guns.push({
      id: post.slug,
      name: title,
      type,
      description: buildDescription(stats, title),
      imageUrl: statsRow?.pic ?? embeddedImage,
      thumbUrl: statsRow?.prePic ?? embeddedImage,
      attachments: [],
      stats,
      sourceUrl: post.link,
    });
  }

  guns.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  return guns;
}

export async function writeWeaponsCatalog(guns: Gun[]): Promise<string> {
  const outPath = path.join(process.cwd(), "data/guns.json");
  await writeFile(outPath, `${JSON.stringify(guns, null, 2)}\n`, "utf8");
  return outPath;
}

export async function scrapeAndSaveWeapons(): Promise<{ count: number; path: string }> {
  const guns = await scrapeWeapons();
  const outPath = await writeWeaponsCatalog(guns);
  return { count: guns.length, path: outPath };
}
