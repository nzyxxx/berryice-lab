"use client";

import { WeaponPortrait } from "@/components/delta-gun/weapon-portrait";
import { getGameModeTheme } from "@/lib/delta-gun/game-mode-theme";
import { buildGunImportUrl } from "@/lib/delta-gun/weapon-utils";
import { cn } from "@/lib/utils";
import { Check, Copy, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export interface CommunityCodeItem {
  id: number;
  game: string;
  weapon: string;
  fullCode: string;
  description: string;
  valueText: string;
  copyCount: number;
  collectedAt: string;
  author?: string;
  source?: string;
  sourceUrl?: string;
}

function sourceCredit(item: CommunityCodeItem): { href: string; label: string } | null {
  const url = item.sourceUrl?.trim() ?? "";
  if (/^https?:\/\//.test(url)) {
    return { href: url, label: item.source?.trim() || "来源" };
  }
  const source = item.source?.trim() ?? "";
  if (!source || source === "本地") return null;
  return { href: source.startsWith("http") ? source : `https://${source}`, label: source };
}

function formatPopularity(count: number): string {
  if (count >= 10_000) return `${(count / 10_000).toFixed(1)}万`;
  return count.toLocaleString("zh-CN");
}

export function CommunityCodeCard({
  item,
  rank,
  featured,
  onCopy,
}: {
  item: CommunityCodeItem;
  rank?: number;
  featured?: boolean;
  onCopy: (code: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const theme = getGameModeTheme(item.game);
  const importHref = buildGunImportUrl(item.weapon, item.fullCode);
  const credit = sourceCredit(item);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onCopy(item.fullCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article
      className={cn(
        "group relative flex overflow-hidden rounded-lg border bg-lab-surface-1 transition-colors hover:bg-lab-surface-2",
        featured ? theme.cardFeatured : theme.cardBorder
      )}
    >
      <div className={cn("w-1 shrink-0", theme.stripe)} aria-hidden />

      {rank !== undefined && rank <= 3 && (
        <div
          className={cn(
            "absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold shadow-lg",
            rank === 1 && theme.rankFirst,
            rank === 2 && "bg-lab-surface-3 text-lab-ink ring-1 ring-lab-hairline",
            rank === 3 && "bg-lab-surface-2 text-lab-ink-muted ring-1 ring-lab-hairline"
          )}
        >
          {rank}
        </div>
      )}

      <div className="relative flex min-w-0 flex-1 gap-3 p-3.5 sm:gap-4 sm:p-4">
        <WeaponPortrait name={item.weapon} size="md" className="hidden sm:flex" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <WeaponPortrait name={item.weapon} size="sm" className="sm:hidden" />
            <h2 className="truncate text-base font-medium tracking-tight text-lab-ink">
              {item.weapon}
            </h2>
            <span
              className={cn(
                "shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-medium",
                theme.badge
              )}
            >
              {theme.label}
            </span>
          </div>

          {item.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-lab-ink-subtle">{item.description}</p>
          ) : null}

          <div
            className={cn(
              "mt-2.5 flex items-start gap-1.5 rounded-md border px-2.5 py-2",
              theme.codeBox
            )}
          >
            <span
              className={cn(
                "min-w-0 flex-1 break-all font-mono text-[11px] leading-relaxed tracking-wide sm:text-xs",
                theme.codeText
              )}
            >
              {item.fullCode}
            </span>
            <button
              type="button"
              onClick={(e) => void handleCopy(e)}
              title={copied ? "已复制" : "复制枪码"}
              aria-label={copied ? "已复制" : "复制枪码"}
              className={cn(
                "relative shrink-0 rounded-md p-1 transition-colors",
                // 图标只有 14px，用不占布局的伪元素把可点区域撑到 44px
                "after:absolute after:left-1/2 after:top-1/2 after:size-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']",
                theme.copyBtn
              )}
            >
              {copied ? (
                <Check className="size-3.5 text-lab-success" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-lab-ink-tertiary">
            {item.valueText ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-lab-hairline/80 bg-lab-canvas/50 px-2 py-0.5">
                <Wallet className="size-3" />
                {item.valueText}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 rounded-md border border-lab-hairline/80 bg-lab-canvas/50 px-2 py-0.5">
              <TrendingUp className="size-3" />
              {formatPopularity(item.copyCount)}
            </span>
            {item.author ? <span>作者 {item.author}</span> : null}
            {credit ? (
              <a
                href={credit.href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-lab-hairline underline-offset-2 hover:text-lab-ink"
              >
                来源 {credit.label}
              </a>
            ) : null}
            <Link href={importHref} className="hover:text-lab-ink">
              在改枪台打开
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export function CommunityCodeCardSkeleton() {
  return (
    <div className="flex overflow-hidden rounded-lg border border-lab-hairline bg-lab-surface-1">
      <div className="w-1 shrink-0 bg-lab-surface-3" />
      <div className="flex flex-1 gap-4 p-4">
        <div className="hidden size-16 rounded-lg bg-lab-surface-2 sm:block" />
        <div className="flex-1 space-y-2.5">
          <div className="h-5 w-40 rounded bg-lab-surface-2" />
          <div className="h-10 rounded-md bg-lab-surface-2" />
          <div className="h-4 w-28 rounded bg-lab-surface-2" />
        </div>
      </div>
    </div>
  );
}
