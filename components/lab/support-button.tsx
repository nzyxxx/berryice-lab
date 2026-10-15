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
import { useState } from "react";

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
            <p className="font-mono text-[11px] tracking-[0.18em] text-lab-ink uppercase">Coming soon</p>
          </div>
        ) : null}
      </div>
      <figcaption className="text-xs text-lab-ink-subtle">{label}</figcaption>
    </figure>
  );
}

/** 顶栏的投喂。码图放在 /public/support/，缺文件就留一句 Coming soon。 */
export function SupportButton() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center rounded-full border border-white/10 bg-white/5 px-3.5 text-xs tracking-[0.14em] text-lab-ink-subtle transition-colors hover:border-white/25 hover:text-lab-ink"
      >
        投喂
      </button>
      <DialogContent
        showCloseButton={false}
        className="max-w-md border border-white/15 bg-lab-canvas/75 p-5 text-lab-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-lg sm:max-w-md"
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
