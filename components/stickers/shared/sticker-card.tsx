import type { Sticker } from "@/data/stickers";
import { glassSurfaceClass } from "@/components/uiverse/glass-surface";
import { StickerArt } from "@/components/stickers/shared/sticker-art";
import { WechatBadge } from "@/components/stickers/shared/wechat-badge";
import { formatKB } from "@/lib/stickers/format";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function StickerCard({
  sticker,
  actions,
  index = 0,
  className,
}: {
  sticker: Sticker;
  actions?: ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <article
      className={cn(
        glassSurfaceClass(),
        "animate-tile-in flex flex-col gap-3 rounded-2xl p-3 transition-transform duration-200 hover:-translate-y-0.5",
        className
      )}
      style={{ animationDelay: `${Math.min(index, 6) * 0.04}s` }}
    >
      <div className="relative">
        <StickerArt src={sticker.src} alt={sticker.title} />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          {sticker.visibility === "showcase" ? (
            <span className="rounded-full border border-lab-primary/40 bg-lab-canvas/70 px-2 py-0.5 text-[10px] font-medium text-lab-primary">
              橱窗中
            </span>
          ) : null}
          {sticker.source === "feed-stub" ? (
            <span className="rounded-full border border-lab-accent-glow/40 bg-lab-canvas/70 px-2 py-0.5 text-[10px] font-medium text-lab-accent-glow">
              Webby 投喂 · 示意
            </span>
          ) : null}
        </div>
      </div>
      <div className="relative px-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-medium tracking-tight text-lab-ink">{sticker.title}</h3>
          <WechatBadge bytes={sticker.bytes} className="shrink-0" />
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-lab-ink-subtle">{sticker.mood}</p>
        <p className="mt-2 font-mono text-[11px] text-lab-ink-tertiary">
          {formatKB(sticker.bytes)} · {sticker.edge}² · {sticker.frames > 1 ? `${sticker.frames} 帧` : "静态"}
        </p>
        {sticker.tags.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="心情标签">
            {sticker.tags.map((tag) => (
              <li key={tag} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-lab-ink-muted">
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {actions ? <div className="relative mt-auto flex flex-wrap gap-2 px-1 pb-1">{actions}</div> : null}
    </article>
  );
}
