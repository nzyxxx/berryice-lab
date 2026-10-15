"use client";

import {
  CURRENT_SEASON,
  formatPostDate,
  inferFocusTags,
  recommendationFromCopies,
  type FocusTag,
} from "@/lib/delta-gun/season";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CodeMetaRow({
  description = "",
  focusTags,
  recommendation,
  copyCount = 0,
  rank,
  mode,
  season,
  postedAt,
  stale = false,
  code,
}: {
  description?: string;
  focusTags?: string[];
  recommendation?: number | null;
  copyCount?: number;
  rank?: number | null;
  mode: string;
  season?: string | null;
  postedAt?: string | null;
  stale?: boolean;
  code: string;
}) {
  const [copied, setCopied] = useState(false);
  const tags: string[] = focusTags && focusTags.length > 0 ? focusTags : inferFocusTags(description);
  const stars = recommendation && recommendation >= 1 && recommendation <= 5
    ? recommendation
    : recommendationFromCopies(copyCount);
  const seasonLabel = season?.trim() || CURRENT_SEASON;

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {(tags.length > 0 ? tags : ["方向未标"]).map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-lab-hairline bg-lab-canvas/70 px-2 py-0.5 text-[11px] text-lab-ink-subtle"
          >
            {tag as FocusTag | string}
          </span>
        ))}
        {stale ? (
          <span className="rounded-full border border-lab-error/30 px-2 py-0.5 text-[11px] text-lab-error">过季</span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-lab-ink-tertiary">
        <span aria-label={`推荐 ${stars} 星`} className="tracking-wide text-lab-ink">
          {"★".repeat(stars)}
          <span className="text-lab-ink-tertiary">{"★".repeat(5 - stars)}</span>
        </span>
        <span>{rank && rank > 0 ? `版本排行 #${rank}` : "版本排行 未入榜"}</span>
        <span>{mode}</span>
        <span>{seasonLabel}</span>
        <span>{formatPostDate(postedAt)}</span>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-lab-ink hover:bg-lab-surface-2"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "已复制" : "复制"}
        </button>
      </div>
    </div>
  );
}
