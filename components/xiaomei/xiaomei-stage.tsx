"use client";

import { XiaomeiCue } from "@/components/xiaomei/xiaomei-cue";
import { XiaomeiProp } from "@/components/xiaomei/xiaomei-prop";
import type { XiaomeiCueKind, XiaomeiPropKind, XiaomeiPropPose } from "@/lib/xiaomei-actions";
import {
  XIAOMEI_CROSSFADE_MS,
  XIAOMEI_MOTION_HIDE_DOWN_MS,
  XIAOMEI_MOTION_HIDE_TIMEOUT_MS,
  XIAOMEI_MOTION_HIDE_UP_MS,
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
import { useEffect, useRef, useState } from "react";

const SPRITE_FILTER =
  "[filter:drop-shadow(0_0_1px_rgba(244,246,251,0.2))_drop-shadow(0_6px_5px_rgba(0,0,0,0.45))]";

export type XiaomeiGroundMode = "float" | "walk" | "still";

type SwapPhase = "idle" | "hide" | "show" | "crossfade";

/** 站姿表情（非 pose_*、非分层眨眼）≈ 同姿，可走 #31 短交叉淡入。 */
function isStandingExpression(face: XiaomeiFace): boolean {
  return !face.startsWith("pose_") && !isXiaomeiLayeredBlinkFace(face);
}

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

/**
 * 立绘、接触阴影、道具。不决定下一拍，也不写存储。
 * 分层眨眼只换脸层；同姿短交叉淡入保留；异姿全身切走下压→切图→弹起，避免双层叠影。
 */
export function XiaomeiStage({
  mood,
  motionClass,
  prop,
  pose,
  cue,
  liftShadow,
  groundMode = "float",
  squashPulse = 0,
  heartBurst = 0,
}: {
  mood: XiaomeiFace;
  motionClass: string | null;
  prop: XiaomeiPropKind | null;
  pose: XiaomeiPropPose | null;
  cue: XiaomeiCueKind | null;
  liftShadow: boolean;
  groundMode?: XiaomeiGroundMode;
  /** 每次短点递增，触发一次 Q 弹。 */
  squashPulse?: number;
  /** 摸头时递增，冒一两颗 CSS 小心心。 */
  heartBurst?: number;
}) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [current, setCurrent] = useState(mood);
  const [outgoing, setOutgoing] = useState<XiaomeiFace | null>(null);
  const [phase, setPhase] = useState<SwapPhase>("idle");
  const [squashOn, setSquashOn] = useState(false);
  const [hearts, setHearts] = useState<number[]>([]);
  const pendingMood = useRef(mood);
  const currentRef = useRef(current);
  const phaseRef = useRef(phase);
  const genRef = useRef(0);
  const lastSquash = useRef(0);
  const lastHeart = useRef(0);
  currentRef.current = current;
  phaseRef.current = phase;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (squashPulse === lastSquash.current) return;
    lastSquash.current = squashPulse;
    if (!squashPulse || reducedMotion) return;
    setSquashOn(true);
    const id = window.setTimeout(() => setSquashOn(false), 300);
    return () => window.clearTimeout(id);
  }, [reducedMotion, squashPulse]);

  useEffect(() => {
    if (heartBurst === lastHeart.current) return;
    lastHeart.current = heartBurst;
    if (!heartBurst || reducedMotion) return;
    const stamp = heartBurst;
    setHearts([0, 1]);
    const id = window.setTimeout(() => setHearts([]), 700);
    return () => {
      window.clearTimeout(id);
      void stamp;
    };
  }, [heartBurst, reducedMotion]);

  useEffect(() => {
    pendingMood.current = mood;
    const shown = currentRef.current;
    if (mood === shown && phaseRef.current === "idle") return;

    // 换图进行中又来了新目标：只更新 pending，让超时/下一段吃到最新脸。
    if (mood === shown && phaseRef.current !== "idle") return;

    // 分层眨眼只换脸层，身体不动，不做全身交叉淡入，也不走 motion-hide。
    if (isXiaomeiLayeredBlinkFace(mood) && isXiaomeiLayeredBlinkFace(shown)) {
      setCurrent(mood);
      setOutgoing(null);
      setPhase("idle");
      return;
    }

    if (reducedMotion) {
      setCurrent(mood);
      setOutgoing(null);
      setPhase("idle");
      return;
    }

    const gen = ++genRef.current;

    // 同姿站立表情：保留 #31 ~90ms 交叉淡入。
    if (isStandingExpression(mood) && isStandingExpression(shown)) {
      setOutgoing(shown);
      setCurrent(mood);
      setPhase("crossfade");
      const timer = window.setTimeout(() => {
        if (genRef.current !== gen) return;
        setOutgoing(null);
        setPhase("idle");
      }, XIAOMEI_CROSSFADE_MS);
      const fallback = window.setTimeout(() => {
        if (genRef.current !== gen) return;
        setOutgoing(null);
        setCurrent(pendingMood.current);
        setPhase("idle");
      }, XIAOMEI_MOTION_HIDE_TIMEOUT_MS);
      return () => {
        window.clearTimeout(timer);
        window.clearTimeout(fallback);
      };
    }

    // 异姿全身切：下压 → 切图 → 弹起。单层，不叠两张全身。
    setOutgoing(null);
    setPhase("hide");
    const down = window.setTimeout(() => {
      if (genRef.current !== gen) return;
      setCurrent(pendingMood.current);
      setPhase("show");
    }, XIAOMEI_MOTION_HIDE_DOWN_MS);
    const up = window.setTimeout(() => {
      if (genRef.current !== gen) return;
      setPhase("idle");
    }, XIAOMEI_MOTION_HIDE_DOWN_MS + XIAOMEI_MOTION_HIDE_UP_MS);
    const fallback = window.setTimeout(() => {
      if (genRef.current !== gen) return;
      setOutgoing(null);
      setCurrent(pendingMood.current);
      setPhase("idle");
    }, XIAOMEI_MOTION_HIDE_TIMEOUT_MS);
    return () => {
      window.clearTimeout(down);
      window.clearTimeout(up);
      window.clearTimeout(fallback);
    };
  }, [mood, reducedMotion]);

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
      <span
        className={cn(
          "xiaomei-actor",
          motionClass,
          squashOn && "xiaomei-click-squash",
          phase === "hide" && "xiaomei-motion-hide",
          phase === "show" && "xiaomei-motion-show",
        )}
        data-xiaomei-swap={phase}
      >
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
        {hearts.length > 0 ? (
          <span className="xiaomei-hearts" aria-hidden>
            {hearts.map((i) => (
              <span key={i} className={cn("xiaomei-heart", i === 1 && "is-alt")} />
            ))}
          </span>
        ) : null}
      </span>
    </>
  );
}
