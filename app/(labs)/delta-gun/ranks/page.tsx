import { PageContainer } from "@/components/lab/page-container";
import { getGuns } from "@/lib/data/guns";
import { weaponTypeShortLabel } from "@/lib/delta-gun/weapon-utils";
import { CURRENT_SEASON } from "@/lib/delta-gun/season";
import { listSeasonRanks, type SeasonRank } from "@/lib/repositories/seasonRanksRepo";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SeasonRanksPage() {
  const guns = await getGuns();
  let ranks: SeasonRank[] = [];
  try {
    ranks = await listSeasonRanks(CURRENT_SEASON);
  } catch (error) {
    console.error("读取版本排行失败:", error);
  }

  const byId = new Map(ranks.map((rank) => [rank.weaponId, rank]));
  const byName = new Map(ranks.map((rank) => [rank.weaponName, rank]));
  const rows = guns
    .map((gun) => ({
      gun,
      rank: byId.get(gun.id) ?? byName.get(gun.name) ?? null,
    }))
    .sort((a, b) => {
      if (a.rank && b.rank) return a.rank.rankPosition - b.rank.rankPosition;
      if (a.rank) return -1;
      if (b.rank) return 1;
      return a.gun.name.localeCompare(b.gun.name, "zh-CN");
    });

  const ranked = rows.filter((row) => row.rank);
  const unranked = rows.filter((row) => !row.rank);

  return (
    <PageContainer className="!pt-8">
      <p className="font-mono text-[11px] tracking-[0.28em] text-lab-ink-subtle">TIER · {CURRENT_SEASON}</p>
      <h1 className="mt-3 text-5xl font-semibold tracking-tight text-lab-ink">版本排行</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-lab-ink-subtle">
        只排本季。名次来自 weapon_season_ranks，没有录入的枪放在未入榜。
      </p>

      <ol className="mt-8 divide-y divide-lab-hairline overflow-hidden rounded-3xl border border-lab-hairline">
        {ranked.map(({ gun, rank }) => (
          <li key={gun.id}>
            <Link href={`/delta-gun/guns/${gun.id}`} className="flex min-h-16 items-center gap-4 px-5 py-3 transition hover:bg-lab-surface-1">
              <span className="w-14 font-mono text-lg text-lab-ink">#{rank?.rankPosition}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-lg text-lab-ink">{gun.name}</span>
                <span className="text-xs text-lab-ink-tertiary">{weaponTypeShortLabel(gun.type)}</span>
              </span>
              {rank?.tier ? <span className="rounded-full border border-lab-hairline px-2 py-1 text-xs">{rank.tier}</span> : null}
            </Link>
          </li>
        ))}
      </ol>

      {ranked.length === 0 ? (
        <p className="mt-6 text-sm text-lab-ink-subtle">本季排行还没录入。</p>
      ) : null}

      <h2 className="mt-12 text-xl font-medium text-lab-ink">未入榜</h2>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {unranked.map(({ gun }) => (
          <li key={gun.id}>
            <Link href={`/delta-gun/guns/${gun.id}`} className="flex min-h-11 items-center justify-between rounded-2xl border border-lab-hairline px-4 text-sm text-lab-ink-subtle hover:text-lab-ink">
              <span>{gun.name}</span>
              <span>{weaponTypeShortLabel(gun.type)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </PageContainer>
  );
}
