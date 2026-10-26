"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";

const SLOTS = [
  { src: "/support/wechat.png", label: "微信" },
  { src: "/support/alipay.png", label: "支付宝" },
] as const;

function QrSlot({ src, label, active }: { src: string; label: string; active: boolean }) {
  const [ok, setOk] = useState<boolean | null>(null);

  return (
    <figure className="flex flex-col items-center gap-2">
      <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
        {active && ok !== false ? (
          <img
            src={src}
            alt=""
            className={cn("h-full w-full object-contain p-3", ok ? "opacity-100" : "opacity-0")}
            onLoad={() => setOk(true)}
            onError={() => setOk(false)}
          />
        ) : null}
        {ok === false ? (
          <div className="px-3 text-center">
            <p className="text-sm text-lab-ink">码还在路上</p>
          </div>
        ) : null}
      </div>
      <figcaption className="text-xs text-lab-ink-subtle">{label}</figcaption>
    </figure>
  );
}

/** 顶栏的投喂。码图放在 /public/support/，缺文件就写「码还在路上」。 */
export function SupportButton() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState({ top: 64, left: 16 });

  const place = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(448, window.innerWidth - 32);
    const left = Math.max(16, Math.min(rect.right - width, window.innerWidth - width - 16));
    setAnchor({ top: rect.bottom + 8, left });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) place();
        setOpen(next);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          place();
          setOpen(true);
        }}
        className="inline-flex h-11 items-center rounded-full border border-lab-primary/40 bg-lab-primary/15 px-3.5 text-sm text-lab-primary"
      >
        投喂
      </button>
      <DialogContent
        showCloseButton={false}
        style={{ top: anchor.top, left: anchor.left, transformOrigin: "top right" }}
        className="w-[min(28rem,calc(100vw-2rem))] max-w-none origin-top-right !translate-x-0 !translate-y-0 border border-white/15 bg-lab-canvas/75 p-5 text-lab-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-lg sm:max-w-none"
      >
        <DialogHeader>
          <DialogTitle className="text-lab-ink">投喂</DialogTitle>
          <DialogDescription>微信或支付宝，扫码就好。</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {SLOTS.map((slot) => (
            <QrSlot key={slot.src} src={slot.src} label={slot.label} active={open} />
          ))}
        </div>
        <DialogClose className="absolute top-3 right-3 inline-flex h-11 items-center rounded-full px-3 text-xs text-lab-ink-subtle hover:text-lab-ink">
          关闭
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
