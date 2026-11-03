import { WECHAT_STICKER_LIMIT_BYTES } from "@/data/stickers";
import { formatKB } from "@/lib/stickers/format";
import { cn } from "@/lib/utils";

/**
 * 原始 / 微信版两根体积条，标尺满格 = 两者较大值和 300KB 线里更大的那个，
 * 300KB 那条竖线始终画出来，压没压进去一眼看到。
 */
export function SizeMeter({
  sourceBytes,
  outputBytes,
  outputLabel,
}: {
  sourceBytes: number;
  outputBytes: number;
  outputLabel: string;
}) {
  const scale = Math.max(sourceBytes, outputBytes, WECHAT_STICKER_LIMIT_BYTES) * 1.08;
  const limitAt = (WECHAT_STICKER_LIMIT_BYTES / scale) * 100;
  const rows = [
    { label: "原始", bytes: sourceBytes, tone: "bg-lab-ink-tertiary/60" },
    {
      label: outputLabel,
      bytes: outputBytes,
      tone: outputBytes <= WECHAT_STICKER_LIMIT_BYTES ? "bg-lab-success/80" : "bg-lab-error/80",
    },
  ];

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[4.5rem_1fr_4.5rem] items-center gap-3">
          <span className="text-xs text-lab-ink-subtle">{row.label}</span>
          <div className="relative h-2 rounded-full bg-white/[0.06]">
            <div
              className={cn("h-full rounded-full transition-[width] duration-500", row.tone)}
              style={{ width: `${Math.max(2, (row.bytes / scale) * 100)}%` }}
            />
            <span
              aria-hidden
              className="absolute -top-1 h-4 w-px bg-lab-primary/70"
              style={{ left: `${limitAt}%` }}
            />
          </div>
          <span className="text-right font-mono text-[11px] text-lab-ink-muted">{formatKB(row.bytes)}</span>
        </div>
      ))}
      <p className="pl-[5.25rem] font-mono text-[10px] text-lab-primary/80">│ 300 KB 微信上限</p>
    </div>
  );
}
