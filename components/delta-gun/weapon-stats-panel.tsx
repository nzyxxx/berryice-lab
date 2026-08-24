import type { WeaponStats } from "@/lib/types/gun";
import { cn } from "@/lib/utils";

const STAT_ROWS: {
  key: keyof WeaponStats;
  label: string;
  unit?: string;
  max?: number;
}[] = [
  { key: "meatHarm", label: "肉伤", max: 100 },
  { key: "armorHarm", label: "甲伤", max: 100 },
  { key: "shootDistance", label: "有效射程", unit: "m", max: 200 },
  { key: "recoil", label: "后坐力", max: 100 },
  { key: "control", label: "操控", max: 100 },
  { key: "stable", label: "稳定", max: 100 },
  { key: "hipShot", label: "腰射", max: 100 },
  { key: "fireSpeed", label: "射速", unit: "RPM", max: 1200 },
  { key: "capacity", label: "弹匣", unit: "发", max: 150 },
  { key: "muzzleVelocity", label: "初速", unit: "m/s", max: 1000 },
  { key: "soundDistance", label: "枪声传播", unit: "m", max: 800 },
];

function StatBar({
  label,
  value,
  max,
  unit,
}: {
  label: string;
  value: number;
  max: number;
  unit?: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-lab-ink-subtle">{label}</span>
        <span className="font-mono tabular-nums text-lab-ink">
          {value}
          {unit ? <span className="ml-0.5 text-lab-ink-tertiary">{unit}</span> : null}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-lab-surface-3">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-lab-primary/80 to-lab-accent-glow/80 transition-all"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function WeaponStatsPanel({ stats }: { stats: WeaponStats }) {
  return (
    <div className="space-y-4">
      {(stats.caliber || stats.fireMode) && (
        <dl className="grid grid-cols-2 gap-3 rounded-lg border border-lab-hairline bg-lab-surface-2/50 p-4 text-sm sm:grid-cols-3">
          {stats.caliber && (
            <div>
              <dt className="text-lab-ink-tertiary">口径</dt>
              <dd className="mt-0.5 font-medium text-lab-ink">{stats.caliber}</dd>
            </div>
          )}
          {stats.fireMode && (
            <div>
              <dt className="text-lab-ink-tertiary">射击模式</dt>
              <dd className="mt-0.5 font-medium text-lab-ink">{stats.fireMode}</dd>
            </div>
          )}
          <div>
            <dt className="text-lab-ink-tertiary">弹匣容量</dt>
            <dd className="mt-0.5 font-medium text-lab-ink">{stats.capacity} 发</dd>
          </div>
        </dl>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {STAT_ROWS.map((row) => {
          const value = stats[row.key];
          if (typeof value !== "number" || value === 0) return null;
          return (
            <StatBar
              key={row.key}
              label={row.label}
              value={value}
              max={row.max ?? 100}
              unit={row.unit}
            />
          );
        })}
      </div>
    </div>
  );
}
