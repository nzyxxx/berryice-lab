"use client";

import { XiaomeiCue } from "@/components/xiaomei/xiaomei-cue";
import { XiaomeiProp } from "@/components/xiaomei/xiaomei-prop";
import type { XiaomeiCueKind, XiaomeiPropKind } from "@/lib/xiaomei-actions";
import { XIAOMEI_SPRITE, type XiaomeiMood } from "@/lib/xiaomei-lines";
import { XIAOMEI_FRAME } from "@/lib/xiaomei-place";
import { cn } from "@/lib/utils";
import Image from "next/image";

/** 立绘、接触阴影、道具。不决定下一拍，也不写存储。 */
export function XiaomeiStage({
  mood,
  motionClass,
  prop,
  cue,
  liftShadow,
}: {
  mood: XiaomeiMood;
  motionClass: string | null;
  prop: XiaomeiPropKind | null;
  cue: XiaomeiCueKind | null;
  liftShadow: boolean;
}) {
  return (
    <>
      <span aria-hidden className={cn("xiaomei-ground", !liftShadow && "xiaomei-ground-still")} />
      <Image
        src={XIAOMEI_SPRITE[mood]}
        alt=""
        width={XIAOMEI_FRAME.width}
        height={XIAOMEI_FRAME.height}
        unoptimized
        draggable={false}
        className={cn(
          "pointer-events-none relative z-[1] h-full w-full object-contain object-bottom [filter:drop-shadow(0_8px_6px_rgba(0,0,0,0.28))]",
          motionClass,
        )}
      />
      {prop ? <XiaomeiProp kind={prop} /> : null}
      {cue ? <XiaomeiCue kind={cue} /> : null}
    </>
  );
}
