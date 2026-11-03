"use client";

import { SizeMeter } from "@/components/stickers/kitchen/size-meter";
import { pillClass } from "@/components/stickers/shared/pill";
import { PrototypeNote } from "@/components/stickers/shared/prototype-note";
import { StickerArt } from "@/components/stickers/shared/sticker-art";
import { TagChip } from "@/components/stickers/shared/tag-chip";
import { WechatBadge } from "@/components/stickers/shared/wechat-badge";
import type { KitchenState } from "@/components/stickers/kitchen/use-sticker-kitchen";
import { glassSurfaceClass } from "@/components/uiverse/glass-surface";
import { stickerTags } from "@/data/stickers";
import { formatKB } from "@/lib/stickers/format";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

/**
 * 工坊护照：方形预览、体积对照、心情标签。
 * 只读上层状态，点按钮把指令交回去，自己不跑管线。
 */
export function PassportCard({
  state,
  saving,
  onTitle,
  onToggleTag,
  onConvert,
  onSave,
  onReset,
}: {
  state: KitchenState;
  saving: boolean;
  onTitle: (title: string) => void;
  onToggleTag: (tag: (typeof stickerTags)[number]) => void;
  onConvert: () => void;
  onSave: () => void;
  onReset: () => void;
}) {
  const { source, result, phase, title, tags, error } = state;
  if (!source) return null;

  const preview = result?.previewUrl ?? source.previewUrl;
  const outputBytes = result?.bytes ?? source.estimateBytes;
  const converted = phase === "converted" && result !== null;
  const converting = phase === "converting";
  const locked = converting || saving || phase === "reading";

  return (
    <div className={cn(glassSurfaceClass(), "rounded-3xl p-5 md:p-6")}>
      <div className="grid gap-6 md:grid-cols-[minmax(0,16rem)_1fr] md:items-start">
        <StickerArt src={preview} alt={title || source.file.name} />

        <div className="relative flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-lab-primary">护照</p>
            {converted ? <WechatBadge bytes={result.bytes} /> : null}
            {result?.mode === "first-frame" ? (
              <span className="rounded-full border border-white/12 px-2.5 py-1 text-[11px] text-lab-ink-subtle">
                只取了首帧
              </span>
            ) : null}
          </div>

          <label className="block">
            <span className="text-xs text-lab-ink-subtle">标题</span>
            <input
              type="text"
              maxLength={24}
              value={title}
              disabled={locked}
              onChange={(event) => onTitle(event.target.value)}
              className={cn(
                "mt-1 min-h-11 w-full rounded-2xl border border-white/12 bg-lab-surface-1/60 px-4 text-[15px] font-medium tracking-tight text-lab-ink",
                "focus-visible:border-lab-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/30",
                "disabled:opacity-45"
              )}
            />
          </label>

          <div>
            <p className="text-xs text-lab-ink-subtle">心情标签</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {stickerTags.map((tag) => (
                <TagChip
                  key={tag}
                  label={tag}
                  active={tags.includes(tag)}
                  disabled={locked}
                  onToggle={() => onToggleTag(tag)}
                />
              ))}
            </div>
          </div>

          <SizeMeter
            sourceBytes={source.file.size}
            outputBytes={outputBytes}
            outputLabel={converted ? "微信版" : "估"}
          />

          <p className="font-mono text-[11px] text-lab-ink-tertiary">
            {source.probe.width}×{source.probe.height}
            {converted ? ` → ${result.edge}² · ${result.frames} 帧 · ${formatKB(result.bytes)}` : ` · 估 ${formatKB(source.estimateBytes)}`}
          </p>

          {error ? <p className="text-sm text-lab-error">{error}</p> : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={locked || phase !== "ready"}
              onClick={onConvert}
              className={pillClass("primary")}
            >
              {converting ? <Loader2 className="size-4 animate-spin" /> : null}
              {converting ? "正在做成微信版…" : "做成微信版"}
            </button>
            <button
              type="button"
              disabled={locked || !converted}
              onClick={onSave}
              className={pillClass("secondary")}
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              收入保险箱
            </button>
            <button type="button" disabled={locked} onClick={onReset} className={pillClass("ghost")}>
              换一张
            </button>
          </div>

          <PrototypeNote>
            方形和体积在这台浏览器里算。动图拆帧靠 Chromium 的 ImageDecoder；没有它、或视频逐帧，只取首帧。真转码交给 Webby / ffmpeg。
          </PrototypeNote>
        </div>
      </div>
    </div>
  );
}
