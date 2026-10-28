"use client";

import { glassSurfaceClass } from "@/components/uiverse/glass-surface";
import { XIAOMEI_NAME } from "@/lib/xiaomei-lines";
import { cn } from "@/lib/utils";

const ITEM =
  "flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm text-lab-ink hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40";

function Meter({ label, value, tone }: { label: string; value: number; tone: "full" | "fond" }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1">
      <span className="w-7 shrink-0 text-[11px] text-lab-ink-subtle">{label}</span>
      <span className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
        <span
          className={cn("block h-full rounded-full", tone === "fond" ? "bg-lab-accent-glow" : "bg-lab-primary")}
          style={{ width: `${value}%` }}
        />
      </span>
      <span className="w-6 shrink-0 text-right text-[11px] tabular-nums text-lab-ink-subtle">{value}</span>
    </div>
  );
}

/** 右键 / 长按菜单。只抛动作，不自己改位置、不写存储、不去请求。 */
export function XiaomeiMenu({
  muted,
  align,
  placement,
  fullness,
  affection,
  onTalk,
  onMutter,
  onFeed,
  onMute,
  onCorner,
  onAbout,
  onHide,
}: {
  muted: boolean;
  align: "left" | "right";
  placement: "up" | "down";
  fullness: number;
  affection: number;
  onTalk: () => void;
  onMutter: () => void;
  onFeed: () => void;
  onMute: () => void;
  onCorner: () => void;
  onAbout: () => void;
  onHide: () => void;
}) {
  return (
    <div
      role="menu"
      aria-label={XIAOMEI_NAME}
      className={cn(
        glassSurfaceClass("overflow-y-auto"),
        "absolute z-20 w-52 rounded-2xl p-1.5",
        "max-h-[min(24rem,calc(100dvh-5rem))]",
        align === "right" ? "right-0" : "left-0",
        placement === "up" ? "bottom-full mb-2" : "top-full mt-2",
      )}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button type="button" role="menuitem" className={ITEM} onClick={onTalk}>
        对话
      </button>
      <button type="button" role="menuitem" className={ITEM} onClick={onMutter}>
        让{XIAOMEI_NAME}说点什么
      </button>
      <button type="button" role="menuitem" className={ITEM} onClick={onFeed}>
        喂食
      </button>
      <div className="py-1" role="group" aria-label={`饱腹度 ${fullness}，好感度 ${affection}`}>
        <Meter label="饱腹" value={fullness} tone="full" />
        <Meter label="好感" value={affection} tone="fond" />
      </div>
      <button type="button" role="menuitem" className={ITEM} onClick={onMute}>
        {muted ? "取消静音" : "静音"}
      </button>
      <button type="button" role="menuitem" className={ITEM} onClick={onCorner}>
        回到角落
      </button>
      <button type="button" role="menuitem" className={ITEM} onClick={onAbout}>
        关于{XIAOMEI_NAME}
      </button>
      <button type="button" role="menuitem" className={ITEM} onClick={onHide}>
        收起
      </button>
    </div>
  );
}
