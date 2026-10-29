"use client";

import { XiaomeiCue } from "@/components/xiaomei/xiaomei-cue";
import { XiaomeiProp } from "@/components/xiaomei/xiaomei-prop";
import type { XiaomeiCueKind, XiaomeiPropKind, XiaomeiPropPose } from "@/lib/xiaomei-actions";
import { xiaomeiFaceSrc, type XiaomeiFace } from "@/lib/xiaomei-faces";
import { XIAOMEI_FRAME } from "@/lib/xiaomei-place";
import { cn } from "@/lib/utils";

/** 立绘、接触阴影、道具。不决定下一拍，也不写存储。换 src 换脸。道具跟身体一起动。 */
export function XiaomeiStage({
  mood,
  motionClass,
  prop,
  pose,
  cue,
  liftShadow,
}: {
  mood: XiaomeiFace;
  motionClass: string | null;
  prop: XiaomeiPropKind | null;
  pose: XiaomeiPropPose | null;
  cue: XiaomeiCueKind | null;
  liftShadow: boolean;
}) {
  return (
    <>
      <span aria-hidden className={cn("xiaomei-ground", !liftShadow && "xiaomei-ground-still")} />
      <span className={cn("xiaomei-actor", motionClass)}>
        {/* 眨眼一帧只有几十毫秒，next/image 换 key 会空一拍。 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={xiaomeiFaceSrc(mood)}
          alt=""
          width={XIAOMEI_FRAME.width}
          height={XIAOMEI_FRAME.height}
          draggable={false}
          decoding="sync"
          data-xiaomei-face={mood}
          className="pointer-events-none relative z-[1] h-full w-full object-contain object-bottom [filter:drop-shadow(0_0_1px_rgba(244,246,251,0.2))_drop-shadow(0_6px_5px_rgba(0,0,0,0.45))]"
        />
        {prop ? <XiaomeiProp kind={prop} pose={pose} /> : null}
        {cue ? <XiaomeiCue kind={cue} /> : null}
      </span>
    </>
  );
}
