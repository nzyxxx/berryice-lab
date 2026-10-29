"use client";

import { XiaomeiProp } from "@/components/xiaomei/xiaomei-prop";
import type { XiaomeiPropKind } from "@/lib/xiaomei-actions";
import { XIAOMEI_SPRITE, type XiaomeiMood } from "@/lib/xiaomei-lines";
import { cn } from "@/lib/utils";
import Image from "next/image";

/** 立绘、接触阴影、道具。不决定下一拍，也不写存储。 */
export function XiaomeiStage({
  mood,
  motionClass,
  prop,
  liftShadow,
}: {
  mood: XiaomeiMood;
  motionClass: string | null;
  prop: XiaomeiPropKind | null;
  liftShadow: boolean;
}) {
  return (
    <>
      <span aria-hidden className={cn("xiaomei-ground", !liftShadow && "xiaomei-ground-still")} />
      <Image
        src={XIAOMEI_SPRITE[mood]}
        alt=""
        width={256}
        height={351}
        unoptimized
        draggable={false}
        className={cn(
          "pointer-events-none relative z-[1] h-full w-full object-contain [filter:drop-shadow(0_0_1px_rgba(255,255,255,0.55))_drop-shadow(0_2px_5px_rgba(0,0,0,0.45))]",
          motionClass,
        )}
      />
      {prop ? <XiaomeiProp kind={prop} /> : null}
    </>
  );
}
