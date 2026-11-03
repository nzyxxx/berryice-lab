"use client";

import SpotlightCard from "@/components/SpotlightCard";
import { pillClass } from "@/components/stickers/shared/pill";
import { glassSurfaceClass } from "@/components/uiverse/glass-surface";
import { ACCEPTED_SOURCE_TYPES } from "@/lib/stickers/wechat-pipeline";
import { cn } from "@/lib/utils";
import { ImageUp, Link2, Loader2 } from "lucide-react";
import { useId, useRef, useState, type DragEvent, type FormEvent } from "react";

/**
 * 素材入口：拖进来、点选文件、粘贴链接。只负责把 File / URL 交出去，
 * 读不读、怎么读由上层决定。本地状态只有拖拽高亮和输入框文字。
 */
export function SourceIntake({
  busy,
  onFile,
  onUrl,
  sampleUrl,
}: {
  busy: boolean;
  onFile: (file: File) => void;
  onUrl: (url: string) => void;
  sampleUrl: string;
}) {
  const inputId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [url, setUrl] = useState("");

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (busy) return;
    const file = event.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !url.trim()) return;
    onUrl(url.trim());
  };

  return (
    <div className="flex flex-col gap-4">
      <SpotlightCard
        className="!rounded-3xl !border-0 !bg-transparent !p-0"
        spotlightColor="rgba(56, 189, 248, 0.16)"
      >
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!busy) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            glassSurfaceClass(),
            "flex min-h-64 flex-col items-center justify-center gap-4 rounded-3xl border-dashed px-6 py-10 text-center",
            dragging && "dark:border-lab-primary/60"
          )}
        >
          <span className="relative flex size-12 items-center justify-center rounded-2xl border border-white/15 bg-lab-primary/10 text-lab-primary">
            {busy ? <Loader2 className="size-5 animate-spin" /> : <ImageUp className="size-5" />}
          </span>
          <div className="relative">
            <p className="text-[15px] font-medium tracking-tight text-lab-ink">
              {busy ? "正在读素材…" : "把动图拖到这里"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-lab-ink-subtle">GIF / WebP / PNG / JPG / MP4，20MB 以内</p>
          </div>
          <div className="relative flex flex-wrap items-center justify-center gap-2">
            <label htmlFor={inputId} className={cn(pillClass("primary"), busy && "pointer-events-none opacity-45")}>
              选一个文件
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={() => onUrl(sampleUrl)}
              className={pillClass("ghost")}
            >
              用示意素材试一下
            </button>
          </div>
          <input
            ref={fileInput}
            id={inputId}
            type="file"
            accept={ACCEPTED_SOURCE_TYPES}
            disabled={busy}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onFile(file);
              if (fileInput.current) fileInput.current.value = "";
            }}
          />
        </div>
      </SpotlightCard>

      <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor={`${inputId}-url`}>
          动图链接
        </label>
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-lab-ink-tertiary" />
          <input
            id={`${inputId}-url`}
            type="url"
            inputMode="url"
            placeholder="或者粘贴一个 GIF 链接"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            disabled={busy}
            className={cn(
              "min-h-11 w-full rounded-full border border-white/12 bg-lab-surface-1/60 pl-10 pr-4 text-sm text-lab-ink",
              "placeholder:text-lab-ink-tertiary focus-visible:border-lab-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/30",
              "disabled:opacity-45"
            )}
          />
        </div>
        <button type="submit" disabled={busy || !url.trim()} className={pillClass("secondary")}>
          读取链接
        </button>
      </form>
    </div>
  );
}
