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
import { useEffect, useRef, useState, type AnimationEvent, type CSSProperties } from "react";

const SPRITE_FILTER =
  "[filter:drop-shadow(0_0_1px_rgba(244,246,251,0.2))_drop-shadow(0_6px_5px_rgba(0,0,0,0.45))]";

export type XiaomeiGroundMode = "float" | "walk" | "still";

type SwapPhase = "idle" | "hide" | "show" | "crossfade";

/** 分层眨眼也算站姿：与站立情绪软切，回待机不走 motion-hide 压弹。 */
function isStandingExpression(face: XiaomeiFace): boolean {
  return !face.startsWith("pose_");
}

/**
 * 整身绕脚微倾。脸板禁止单独 translate：身体不跟着走时，远光标的
 * translate3d(-3px,-3px) rotate(-2.5deg) 会把五官抬到头罩左上。
 * 不改外层 left/top。
 */
function gazeStyle(gaze: XiaomeiGaze | null | undefined): CSSProperties | undefined {
  if (!gaze || gaze.movesPlace || gaze.tiltDeg === 0) return undefined;
  return {
    transform: `rotate(${gaze.tiltDeg}deg)`,
    transformOrigin: "50% 100%",
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
    const look = gazeStyle(gaze);
    return (
      <span
        className={cn(
          "xiaomei-stack pointer-events-none relative z-[1] h-full w-full",
          look && "xiaomei-gaze",
          SPRITE_FILTER,
          className,
        )}
        data-xiaomei-face={face}
        data-xiaomei-sprite="layered"
        data-xiaomei-gaze={look ? "rigid" : "off"}
        style={look}
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
        {/* 三张脸层常驻，只切 is-active；绝不换 src / remount，避免眨眼空一拍。
            脸板不挂 transform，和身体同一套注册。 */}
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
            data-xiaomei-gaze="off"
            className={cn(
              "xiaomei-stack-face pointer-events-none absolute inset-0 z-[1] h-full w-full object-contain object-bottom",
              layer === active ? "is-active" : "is-idle",
            )}
          />
        ))}
      </span>
    );
  }

  const look = gazeStyle(gaze);
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
        look && "xiaomei-gaze",
        SPRITE_FILTER,
        className,
      )}
      style={look}
      data-xiaomei-gaze={look ? "rigid" : "off"}
    />
  );
}

/**
 * 立绘、接触阴影、道具。不决定下一拍，也不写存储。
 * 分层眨眼只亮常驻脸层；同姿短交叉淡入；异姿全身切走下压→切图→弹起。
 * 飞行中只记 pending，落地再对齐，避免 crossfade 中途重启导致 opacity 连闪。
 * 收尾定时器挂在 ref 上：mood 再变只更新 pending，不能清掉这次的 timeout。
 * 否则 cleanup 把 90ms / show 收尾取消，data-xiaomei-swap 会停在 crossfade 或 show。
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
  /** 飞行标记不跟 render 回写。phaseRef 若被旧 state 盖掉，这只仍挡住下一次换图。 */
  const flightRef = useRef(false);
  const genRef = useRef(0);
  const lastSquash = useRef(0);
  const lastHeart = useRef(0);
  const lastCommitAt = useRef(0);
  const holdTimer = useRef(0);
  /** 跟 mood effect 拆开。effect cleanup 不能清这三只，否则下一次换脸会把收尾取消。 */
  const cutTimer = useRef(0);
  const endTimer = useRef(0);
  const fallbackTimer = useRef(0);
  currentRef.current = current;

  const clearSwapTimers = () => {
    window.clearTimeout(cutTimer.current);
    window.clearTimeout(endTimer.current);
    window.clearTimeout(fallbackTimer.current);
    cutTimer.current = 0;
    endTimer.current = 0;
    fallbackTimer.current = 0;
  };

  const releaseToIdle = () => {
    if (!flightRef.current && phaseRef.current === "idle") return;
    genRef.current += 1;
    clearSwapTimers();
    flightRef.current = false;
    phaseRef.current = "idle";
    setOutgoing(null);
    setPhase("idle");
    if (pendingMood.current !== currentRef.current) setKick((n) => n + 1);
  };
  const releaseRef = useRef(releaseToIdle);
  releaseRef.current = releaseToIdle;

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

    // 换图飞行中：只记 pending。这里不能 return cleanup 去清 endTimer，
    // 否则下一次 mood 会把 90ms 淡出和 motion-show 收尾一起取消，相位永远停住。
    if (flightRef.current || phaseRef.current !== "idle") return;

    const shown = currentRef.current;
    if (mood === shown) return;

    // 分层眨眼只亮常驻脸层，身体不动。
    if (isXiaomeiLayeredBlinkFace(mood) && isXiaomeiLayeredBlinkFace(shown)) {
      flightRef.current = false;
      phaseRef.current = "idle";
      setCurrent(mood);
      setOutgoing(null);
      setPhase("idle");
      return;
    }

    if (reducedMotion) {
      flightRef.current = false;
      phaseRef.current = "idle";
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
        if (flightRef.current || phaseRef.current !== "idle") return;
        if (pendingMood.current === currentRef.current) return;
        setKick((n) => n + 1);
      }, XIAOMEI_MIN_HOLD_MS - held);
      return;
    }

    clearSwapTimers();
    const gen = ++genRef.current;
    lastCommitAt.current = now;
    flightRef.current = true;

    const still = () => genRef.current === gen && flightRef.current;

    fallbackTimer.current = window.setTimeout(() => {
      if (!still()) return;
      currentRef.current = pendingMood.current;
      setCurrent(pendingMood.current);
      releaseRef.current();
    }, XIAOMEI_MOTION_HIDE_TIMEOUT_MS);

    // 同站姿（含分层眨眼↔站立情绪）：短交叉淡入，不压弹。
    if (isStandingExpression(mood) && isStandingExpression(shown)) {
      phaseRef.current = "crossfade";
      setOutgoing(shown);
      setCurrent(mood);
      setPhase("crossfade");
      endTimer.current = window.setTimeout(() => {
        if (!still()) return;
        releaseRef.current();
      }, XIAOMEI_CROSSFADE_MS);
      return;
    }

    // 异姿全身切：下压 → 切图 → 弹起。单层，不叠两张全身。
    phaseRef.current = "hide";
    setOutgoing(null);
    setPhase("hide");
    cutTimer.current = window.setTimeout(() => {
      if (!still() || phaseRef.current !== "hide") return;
      phaseRef.current = "show";
      setCurrent(pendingMood.current);
      setPhase("show");
    }, XIAOMEI_MOTION_HIDE_DOWN_MS);
    endTimer.current = window.setTimeout(() => {
      if (!still()) return;
      releaseRef.current();
    }, XIAOMEI_MOTION_HIDE_DOWN_MS + XIAOMEI_MOTION_HIDE_UP_MS);
  }, [mood, reducedMotion, kick]);

  // 相位自己的保底。mood 变化不会重跑这只，所以 crossfade / show 不可能停过各自的时长。
  useEffect(() => {
    if (phase === "idle") return;
    const armed = phase;
    const ms =
      armed === "crossfade"
        ? XIAOMEI_CROSSFADE_MS
        : armed === "hide"
          ? XIAOMEI_MOTION_HIDE_DOWN_MS
          : XIAOMEI_MOTION_HIDE_UP_MS;
    const id = window.setTimeout(() => {
      if (phaseRef.current !== armed) return;
      if (armed === "hide") {
        phaseRef.current = "show";
        setCurrent(pendingMood.current);
        setPhase("show");
        return;
      }
      releaseRef.current();
    }, ms);
    return () => window.clearTimeout(id);
  }, [phase]);

  useEffect(
    () => () => {
      window.clearTimeout(holdTimer.current);
      window.clearTimeout(cutTimer.current);
      window.clearTimeout(endTimer.current);
      window.clearTimeout(fallbackTimer.current);
    },
    [],
  );

  const onActorAnimationEnd = (event: AnimationEvent<HTMLSpanElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.animationName === "xiaomei-motion-hide" && phaseRef.current === "hide") {
      phaseRef.current = "show";
      setCurrent(pendingMood.current);
      setPhase("show");
      return;
    }
    if (event.animationName === "xiaomei-motion-show" && phaseRef.current === "show") {
      releaseRef.current();
    }
  };

  const onCrossfadeEnd = (event: AnimationEvent<HTMLSpanElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.animationName !== "xiaomei-crossfade-out") return;
    releaseRef.current();
  };

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
        onAnimationEnd={onActorAnimationEnd}
      >
        <span className="xiaomei-crossfade">
          {outgoing ? (
            <span
              key={`out-${outgoing}`}
              className="xiaomei-crossfade-layer is-out"
              aria-hidden
              onAnimationEnd={onCrossfadeEnd}
            >
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
