"use client";

import { XiaomeiCue } from "@/components/xiaomei/xiaomei-cue";
import { XiaomeiProp } from "@/components/xiaomei/xiaomei-prop";
import type { XiaomeiCueKind, XiaomeiPropKind, XiaomeiPropPose } from "@/lib/xiaomei-actions";
import {
  XIAOMEI_CROSSFADE_MS,
  isXiaomeiLayeredBlinkFace,
  xiaomeiBlinkFaceLayer,
  xiaomeiBodyNeutralSrc,
  xiaomeiFaceLayerSrc,
  xiaomeiFaceSrc,
  xiaomeiIdleVolumeSrc,
  type XiaomeiFace,
} from "@/lib/xiaomei-faces";
import { XIAOMEI_FRAME } from "@/lib/xiaomei-place";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const SPRITE_FILTER =
  "[filter:drop-shadow(0_0_1px_rgba(244,246,251,0.2))_drop-shadow(0_6px_5px_rgba(0,0,0,0.45))]";

export type XiaomeiGroundMode = "float" | "walk" | "still";

function XiaomeiSprite({
  face,
  reducedMotion,
  className,
}: {
  face: XiaomeiFace;
  reducedMotion: boolean;
  className?: string;
}) {
  // 减动效：不分层眨眼，落回烘焙发量全身。
  if (reducedMotion && isXiaomeiLayeredBlinkFace(face)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={xiaomeiIdleVolumeSrc()}
        alt=""
        width={XIAOMEI_FRAME.width}
        height={XIAOMEI_FRAME.height}
        draggable={false}
        decoding="sync"
        data-xiaomei-face={face}
        data-xiaomei-sprite="idle-volume"
        className={cn(
          "pointer-events-none relative z-[1] h-full w-full object-contain object-bottom",
          SPRITE_FILTER,
          className,
        )}
      />
    );
  }

  if (isXiaomeiLayeredBlinkFace(face)) {
    const layer = xiaomeiBlinkFaceLayer(face);
    return (
      <span
        className={cn("xiaomei-stack pointer-events-none relative z-[1] h-full w-full", SPRITE_FILTER, className)}
        data-xiaomei-face={face}
        data-xiaomei-sprite="layered"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={xiaomeiBodyNeutralSrc()}
          alt=""
          width={XIAOMEI_FRAME.width}
          height={XIAOMEI_FRAME.height}
          draggable={false}
          decoding="sync"
          data-xiaomei-layer="body"
          className="xiaomei-stack-body pointer-events-none absolute inset-0 h-full w-full object-contain object-bottom"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={xiaomeiFaceLayerSrc(layer)}
          alt=""
          width={XIAOMEI_FRAME.width}
          height={XIAOMEI_FRAME.height}
          draggable={false}
          decoding="sync"
          data-xiaomei-layer={layer}
          className="xiaomei-stack-face pointer-events-none absolute inset-0 z-[1] h-full w-full object-contain object-bottom"
        />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={xiaomeiFaceSrc(face)}
      alt=""
      width={XIAOMEI_FRAME.width}
      height={XIAOMEI_FRAME.height}
      draggable={false}
      decoding="sync"
      data-xiaomei-face={face}
      data-xiaomei-sprite="fullbody"
      className={cn(
        "pointer-events-none relative z-[1] h-full w-full object-contain object-bottom",
        SPRITE_FILTER,
        className,
      )}
    />
  );
}

/** 立绘、接触阴影、道具。不决定下一拍，也不写存储。分层眨眼只换脸层；全身换 src 走短交叉淡入。 */
export function XiaomeiStage({
  mood,
  motionClass,
  prop,
  pose,
  cue,
  liftShadow,
  groundMode = "float",
}: {
  mood: XiaomeiFace;
  motionClass: string | null;
  prop: XiaomeiPropKind | null;
  pose: XiaomeiPropPose | null;
  cue: XiaomeiCueKind | null;
  liftShadow: boolean;
  groundMode?: XiaomeiGroundMode;
}) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [current, setCurrent] = useState(mood);
  const [outgoing, setOutgoing] = useState<XiaomeiFace | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (mood === current) return;

    // 分层眨眼只换脸层，身体不动，不做全身交叉淡入。
    if (isXiaomeiLayeredBlinkFace(mood) && isXiaomeiLayeredBlinkFace(current)) {
      setCurrent(mood);
      setOutgoing(null);
      return;
    }

    if (reducedMotion) {
      setCurrent(mood);
      setOutgoing(null);
      return;
    }

    setOutgoing(current);
    setCurrent(mood);
    const timer = window.setTimeout(() => setOutgoing(null), XIAOMEI_CROSSFADE_MS);
    return () => window.clearTimeout(timer);
  }, [mood, current, reducedMotion]);

  return (
    <>
      <span
        aria-hidden
        className={cn(
          "xiaomei-ground",
          (!liftShadow || groundMode === "still") && "xiaomei-ground-still",
          liftShadow && groundMode === "walk" && "xiaomei-ground-walk",
          liftShadow && groundMode === "float" && "xiaomei-ground-breath",
        )}
      />
      <span className={cn("xiaomei-actor", motionClass)}>
        <span className="xiaomei-crossfade">
          {outgoing ? (
            <span key={`out-${outgoing}`} className="xiaomei-crossfade-layer is-out" aria-hidden>
              <XiaomeiSprite face={outgoing} reducedMotion={reducedMotion} />
            </span>
          ) : null}
          <span
            key={`in-${current}`}
            className={cn("xiaomei-crossfade-layer", outgoing && "is-in")}
          >
            <XiaomeiSprite face={current} reducedMotion={reducedMotion} />
          </span>
        </span>
        {prop ? <XiaomeiProp kind={prop} pose={pose} /> : null}
        {cue ? <XiaomeiCue kind={cue} /> : null}
      </span>
    </>
  );
}
