"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { glassSurfaceClass } from "@/components/uiverse/glass-surface";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

const SLOTS = [
  { src: "/support/wechat.png", label: "微信" },
  { src: "/support/alipay.png", label: "支付宝" },
] as const;

function subscribeCompact(onChange: () => void) {
  const media = window.matchMedia("(max-width: 639px)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function readCompact() {
  return window.matchMedia("(max-width: 639px)").matches;
}

function QrSlot({ src, label, active }: { src: string; label: string; active: boolean }) {
  const [ok, setOk] = useState<boolean | null>(null);

  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-center text-xs tracking-tight text-lab-ink-muted">{label}</figcaption>
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[inset_0_0_0_1px_rgba(15,18,24,0.06)]">
        {active && ok !== false ? (
          <span className="absolute inset-2.5">
            <Image
              src={src}
              alt=""
              fill
              unoptimized
              sizes="160px"
              className={cn("object-contain", ok ? "opacity-100" : "opacity-0")}
              onLoad={() => setOk(true)}
              onError={() => setOk(false)}
            />
          </span>
        ) : null}
        {ok === false ? (
          <p className="px-3 text-center text-sm text-lab-ink dark:text-lab-canvas">码还在路上</p>
        ) : null}
      </div>
    </figure>
  );
}

/** 顶栏的投喂。码图放在 /public/support/，缺文件就写「码还在路上」。 */
export function SupportButton() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState({ top: 64, left: 16 });
  const compact = useSyncExternalStore(subscribeCompact, readCompact, () => false);

  const place = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(416, window.innerWidth - 32);
    const left = Math.max(16, Math.min(rect.right - width, window.innerWidth - width - 16));
    setAnchor({ top: rect.bottom + 10, left });
  }, []);

  useEffect(() => {
    if (!open || compact) return;
    place();
  }, [compact, open, place]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next && !readCompact()) place();
        setOpen(next);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (!readCompact()) place();
          setOpen(true);
        }}
        className="inline-flex h-11 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.07] px-3.5 text-sm text-lab-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] hover:border-white/30 hover:bg-white/[0.12]"
      >
        <span aria-hidden className="size-1.5 rounded-full bg-lab-accent-glow" />
        投喂
      </button>
      <DialogContent
        showCloseButton={false}
        style={
          compact
            ? {
                position: "fixed",
                top: "auto",
                right: 16,
                bottom: "max(0.75rem, env(safe-area-inset-bottom))",
                left: 16,
                width: "auto",
              }
            : { position: "fixed", top: anchor.top, left: anchor.left }
        }
        className={cn(
          glassSurfaceClass(),
          "fixed z-50 max-h-[min(36rem,calc(100dvh-1.5rem))] max-w-none gap-0 overflow-y-auto rounded-3xl p-0 text-lab-ink ring-0 sm:max-w-none",
          "translate-x-0 translate-y-0",
          compact ? "top-auto" : "w-[min(26rem,calc(100vw-2rem))]",
        )}
      >
        <div className="px-5 pt-4 pb-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] tracking-[0.18em] text-lab-ink-subtle">小小心意</p>
            <DialogClose className="inline-flex h-11 shrink-0 items-center rounded-full px-3 text-xs text-lab-ink-subtle hover:text-lab-ink">
              关闭
            </DialogClose>
          </div>
          <DialogHeader className="mt-1 gap-1.5">
            <DialogTitle className="text-[15px] font-medium tracking-tight text-lab-ink">投喂</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-lab-ink-muted">
              哼，才不是开口要。路过的话，微信或支付宝扫一下就好。
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {SLOTS.map((slot) => (
              <QrSlot key={slot.src} src={slot.src} label={slot.label} active={open} />
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-lab-ink-subtle">到了我就装没看见。谢谢你。</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
