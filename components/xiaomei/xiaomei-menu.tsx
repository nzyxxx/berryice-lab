"use client";

import { glassSurfaceClass } from "@/components/uiverse/glass-surface";
import { cn } from "@/lib/utils";

const ITEM =
  "flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm text-lab-ink hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40";

/** 右键 / 长按菜单。只抛动作，不自己改位置或去请求。 */
export function XiaomeiMenu({
  muted,
  align,
  placement,
  onTalk,
  onMute,
  onCorner,
  onAbout,
  onHide,
}: {
  muted: boolean;
  align: "left" | "right";
  placement: "up" | "down";
  onTalk: () => void;
  onMute: () => void;
  onCorner: () => void;
  onAbout: () => void;
  onHide: () => void;
}) {
  return (
    <div
      role="menu"
      aria-label="小莓"
      className={cn(
        glassSurfaceClass(),
        "absolute z-20 w-40 rounded-2xl p-1.5",
        align === "right" ? "right-0" : "left-0",
        placement === "up" ? "bottom-full mb-2" : "top-full mt-2",
      )}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button type="button" role="menuitem" className={ITEM} onClick={onTalk}>
        对话
      </button>
      <button type="button" role="menuitem" className={ITEM} onClick={onMute}>
        {muted ? "取消静音" : "静音"}
      </button>
      <button type="button" role="menuitem" className={ITEM} onClick={onCorner}>
        回到角落
      </button>
      <button type="button" role="menuitem" className={ITEM} onClick={onAbout}>
        关于小莓
      </button>
      <button type="button" role="menuitem" className={ITEM} onClick={onHide}>
        收起
      </button>
    </div>
  );
}
