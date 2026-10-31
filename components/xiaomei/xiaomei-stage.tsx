"use client";

import { XiaomeiCue } from "@/components/xiaomei/xiaomei-cue";
import { XiaomeiProp } from "@/components/xiaomei/xiaomei-prop";
import type { XiaomeiCueKind, XiaomeiPropKind, XiaomeiPropPose } from "@/lib/xiaomei-actions";
import {
  XIAOMEI_CROSSFADE_MS,
  XIAOMEI_FACE_LAYERS,
  XIAOMEI_MIN_HOLD_MS,
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
import type { XiaomeiGaze } from "@/lib/xiaomei-fsm";
import { XIAOMEI_FRAME } from "@/lib/xiaomei-place";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, type CSSProperties } from "react";

const SPRITE_FILTER =
  "[filter:drop-shadow(0_0_1px_rgba(244,246,251,0.2))_drop-shadow(0_6px_5px_rgba(0,0,0,0.45))]";

export type XiaomeiGroundMode = "float" | "walk" | "still";

type SwapPhase = "idle" | "hide" | "show" | "crossfade";

/** 分层眨眼也算站姿：与站立情绪软切，回待机不走 motion-hide 压弹。 */
function isStandingExpression(face: XiaomeiFace): boolean {
  return !face.startsWith("pose_");
}

/** 只挪脸层或绕脚微倾。不改外层 left/top。 */
function gazeStyle(gaze: XiaomeiGaze | null | undefined, mode: "face" | "feet"): CSSProperties | undefined {
  if (!gaze || gaze.movesPlace) return undefined;
  const pupilX = mode === "face" ? gaze.pupilX : 0;
  const pupilY = mode === "face" ? gaze.pupilY : 0;
  if (pupilX === 0 && pupilY === 0 && gaze.tiltDeg === 0) return undefined;
  return {
    transform: `translate3d(${pupilX}px, ${pupilY}px, 0) rotate(${gaze.tiltDeg}deg)`,
    transformOrigin: mode === "face" ? "50% 30%" : "50% 100%",
  };
}

function XiaomeiSprite({
  face,
  reducedMotion,
  className,
  gaze = null,
}: {
  face: XiaomeiFace;
  reducedMotion: boolean;
  className?: string;
  gaze?: XiaomeiGaze | null;
}) {
  // 减动效：不分层眨眼，整张用批准的 volume_v2.1。
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
    const active = xiaomeiBlinkFaceLayer(face);
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
        {/* 三张脸层常驻，只切 is-active；绝不换 src / remount，避免眨眼空一拍。 */}
        {XIAOMEI_FACE_LAYERS.map((layer) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={layer}
            src={xiaomeiFaceLayerSrc(layer)}
            alt=""
            width={XIAOMEI_FRAME.width}
            height={XIAOMEI_FRAME.height}
            draggable={false}
            decoding="sync"
            data-xiaomei-layer={layer}
            className={cn(
              "xiaomei-stack-face xiaomei-gaze pointer-events-none absolute inset-0 z-[1] h-full w-full object-contain object-bottom",
              layer === active ? "is-active" : "is-idle",
            )}
            style={gazeStyle(gaze, "face")}
            data-xiaomei-gaze={gaze && !gaze.movesPlace ? "face" : "off"}
          />
        ))}
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
        "xiaomei-gaze pointer-events-none relative z-[1] h-full w-full object-contain object-bottom",
        SPRITE_FILTER,
        className,
      )}
      style={gazeStyle(gaze, "feet")}
      data-xiaomei-gaze={gaze && !gaze.movesPlace ? "feet" : "off"}
    />
  );
}

/**
 * 立绘、接触阴影、道具。不决定下一拍，也不写存储。
 * 分层眨眼只亮常驻脸层；同姿短交叉淡入；异姿全身切走下压→切图→弹起。
 * 飞行中只记 pending，落地再对齐，避免 crossfade 中途重启导致 opacity 连闪。
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
  gaze = null,
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
  /** 瞳孔 / 微倾。不写角色坐标。 */
  gaze?: XiaomeiGaze | null;
}) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [current, setCurrent] = useState(mood);
  const [outgoing, setOutgoing] = useState<XiaomeiFace | null>(null);
  const [phase, setPhase] = useState<SwapPhase>("idle");
  const [squashOn, setSquashOn] = useState(false);
  const [hearts, setHearts] = useState<number[]>([]);
  /** 换图落地后再对齐 pending 时踢一下，避免飞行中重启。 */
  const [kick, setKick] = useState(0);
  const pendingMood = useRef(mood);
  const currentRef = useRef(current);
  const phaseRef = useRef(phase);
  const genRef = useRef(0);
  const lastSquash = useRef(0);
  const lastHeart = useRef(0);
  const lastCommitAt = useRef(0);
  const holdTimer = useRef(0);
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

    // 换图飞行中：只记 pending，绝不中途重启 crossfade / motion-hide（防 opacity 连闪）。
    if (phaseRef.current !== "idle") return;

    const shown = currentRef.current;
    if (mood === shown) return;

    // 分层眨眼只亮常驻脸层，身体不动。
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
      lastCommitAt.current = performance.now();
      return;
    }

    // 同姿/异姿最短驻留：未满 hold 只记 pending，到期再 kick（眨眼帧不受限）。
    const now = performance.now();
    const held = now - lastCommitAt.current;
    if (lastCommitAt.current > 0 && held < XIAOMEI_MIN_HOLD_MS) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = window.setTimeout(() => {
        if (phaseRef.current !== "idle") return;
        if (pendingMood.current === currentRef.current) return;
        setKick((n) => n + 1);
      }, XIAOMEI_MIN_HOLD_MS - held);
      return;
    }

    const gen = ++genRef.current;
    lastCommitAt.current = now;

    const finishIdle = () => {
      if (genRef.current !== gen) return;
      setOutgoing(null);
      setPhase("idle");
      const next = pendingMood.current;
      if (next !== currentRef.current) {
        window.setTimeout(() => {
          if (genRef.current !== gen) return;
          if (phaseRef.current !== "idle") return;
          if (pendingMood.current === currentRef.current) return;
          setKick((n) => n + 1);
        }, 0);
      }
    };

    // 同站姿（含分层眨眼↔站立情绪）：短交叉淡入，不压弹。
    if (isStandingExpression(mood) && isStandingExpression(shown)) {
      setOutgoing(shown);
      setCurrent(mood);
      setPhase("crossfade");
      const timer = window.setTimeout(finishIdle, XIAOMEI_CROSSFADE_MS);
      const fallback = window.setTimeout(() => {
        if (genRef.current !== gen) return;
        setOutgoing(null);
        setCurrent(pendingMood.current);
        setPhase("idle");
        setKick((n) => n + 1);
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
      finishIdle();
    }, XIAOMEI_MOTION_HIDE_DOWN_MS + XIAOMEI_MOTION_HIDE_UP_MS);
    const fallback = window.setTimeout(() => {
      if (genRef.current !== gen) return;
      setOutgoing(null);
      setCurrent(pendingMood.current);
      setPhase("idle");
      setKick((n) => n + 1);
    }, XIAOMEI_MOTION_HIDE_TIMEOUT_MS);
    return () => {
      window.clearTimeout(down);
      window.clearTimeout(up);
      window.clearTimeout(fallback);
    };
  }, [mood, reducedMotion, kick]);

  useEffect(
    () => () => {
      window.clearTimeout(holdTimer.current);
    },
    [],
  );

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
              <XiaomeiSprite face={outgoing} reducedMotion={reducedMotion} gaze={gaze} />
            </span>
          ) : null}
          <span key="in" className={cn("xiaomei-crossfade-layer", outgoing && "is-in")}>
            <XiaomeiSprite face={current} reducedMotion={reducedMotion} gaze={gaze} />
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
