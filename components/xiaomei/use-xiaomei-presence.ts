"use client";

import {
  XIAOMEI_BEAT_MS,
  XIAOMEI_BLINK_CYCLE,
  XIAOMEI_BLINK_FRAME_MS,
  XIAOMEI_DRINK_HOLD_MS,
  XIAOMEI_GREET_MS,
  XIAOMEI_GREET_WAVE_MS,
  XIAOMEI_SNACK_HOLD_MS,
  XIAOMEI_SPIN_AT_MS,
  XIAOMEI_TRAIL_MS,
  XIAOMEI_WALK_AT_MS,
  expressionTrail,
  snackFaceAt,
  spinFaceAt,
  umbrellaFaceAt,
  walkFaceAt,
  idleGapMs,
  nextIdleBeat,
  type XiaomeiIdleBeat,
  type XiaomeiTrailContext,
} from "@/lib/xiaomei-actions";
import type { XiaomeiFace } from "@/lib/xiaomei-faces";
import type { XiaomeiMood } from "@/lib/xiaomei-lines";
import {
  XIAOMEI_SLEEP_AFTER_MS,
  XIAOMEI_SLEEP_BLANK_MS,
  XIAOMEI_SLEEP_YAWN_MS,
  XIAOMEI_WAKE_MS,
  isVisuallySleeping,
  shouldEnterSleep,
  sleepPhaseFace,
  wakeFromInteraction,
  type XiaomeiSleepPhase,
} from "@/lib/xiaomei-fsm";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 待机拍、眨眼和点击/投喂的引子脸。只排 setTimeout，不挂 rAF。
 * Round3：久闲入睡三连（哈欠→空白→困脸呼吸）；任意交互重置 idleSince，睡着先醒再回底座。
 * 聊天、菜单、记忆打开时停掉下一拍。台词还在时不新开一拍，但喝水姿势可以盖过台词。
 * 进场招呼先招手再鞠躬，盖过这句的脸，短于台词。喝水和喂食进行中不打断。
 * 转圈三帧、散步左右换步都走姿势脸。不压扁，也不把右脚镜像成左脚。
 * 点心先捧着再咬，伞撑开拿着。贴纸不再叠第二只。咬完回到这句原来的表情。
 * 喂食和喝水的动作在关菜单的同一轮排上，菜单合上后接着播，不会被清掉。
 */
export function useXiaomeiPresence(options: { enabled: boolean; hungry: boolean; paused: () => boolean }) {
  const [beat, setBeat] = useState<XiaomeiIdleBeat | null>(null);
  const [beatMood, setBeatMood] = useState<XiaomeiFace | null>(null);
  const [lead, setLead] = useState<XiaomeiFace | null>(null);
  const [blinkFace, setBlinkFace] = useState<XiaomeiFace | null>(null);
  const [poseFace, setPoseFace] = useState<XiaomeiFace | null>(null);
  const [sleepPhase, setSleepPhase] = useState<XiaomeiSleepPhase>("awake");
  const [shown, setShown] = useState(options.enabled);
  if (options.enabled !== shown) {
    setShown(options.enabled);
    if (!options.enabled) {
      setBeat(null);
      setBeatMood(null);
      setLead(null);
      setBlinkFace(null);
      setPoseFace(null);
      setSleepPhase("awake");
    }
  }

  const hungryRef = useRef(options.hungry);
  const pausedRef = useRef(options.paused);

  const gapTimer = useRef(0);
  const blinkArm = useRef(0);
  const leadTimer = useRef(0);
  const beatTimers = useRef<number[]>([]);
  const blinkTimers = useRef<number[]>([]);
  const lastRef = useRef<XiaomeiIdleBeat | null>(null);
  const activeRef = useRef(false);
  const forcedRef = useRef(false);
  const idleSinceRef = useRef(typeof performance !== "undefined" ? performance.now() : Date.now());
  const sleepPhaseRef = useRef<XiaomeiSleepPhase>("awake");
  const sleepTimer = useRef(0);
  const sleepWatch = useRef(0);

  const clearBeatTimers = useCallback(() => {
    for (const id of beatTimers.current) window.clearTimeout(id);
    beatTimers.current = [];
  }, []);

  const clearLeadTimer = useCallback(() => {
    window.clearTimeout(leadTimer.current);
    leadTimer.current = 0;
  }, []);

  const clearBlinkTimers = useCallback(() => {
    for (const id of blinkTimers.current) window.clearTimeout(id);
    blinkTimers.current = [];
  }, []);

  const clearBlink = useCallback(() => {
    clearBlinkTimers();
    setBlinkFace(null);
  }, [clearBlinkTimers]);

  const stopVisual = useCallback(() => {
    clearBeatTimers();
    clearLeadTimer();
    clearBlink();
    window.clearTimeout(blinkArm.current);
    window.clearTimeout(sleepTimer.current);
    activeRef.current = false;
    forcedRef.current = false;
    sleepPhaseRef.current = "awake";
    setSleepPhase("awake");
    setBeat(null);
    setBeatMood(null);
    setLead(null);
    setPoseFace(null);
  }, [clearBeatTimers, clearBlink, clearLeadTimer]);

  const startBlink = useCallback(() => {
    clearBlinkTimers();
    let elapsed = 0;
    for (let index = 0; index < XIAOMEI_BLINK_CYCLE.length; index += 1) {
      const frame = XIAOMEI_BLINK_CYCLE[index];
      const at = elapsed;
      blinkTimers.current.push(window.setTimeout(() => setBlinkFace(frame ?? null), at));
      elapsed += XIAOMEI_BLINK_FRAME_MS[index] ?? 0;
    }
    blinkTimers.current.push(window.setTimeout(() => setBlinkFace(null), elapsed));
  }, [clearBlinkTimers]);

  const playGreet = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (forcedRef.current) return;
    clearBlink();
    clearBeatTimers();
    clearLeadTimer();
    activeRef.current = true;
    forcedRef.current = false;
    setLead(null);
    setBeat(null);
    setBeatMood(null);
    setPoseFace("pose_wave");
    beatTimers.current.push(
      window.setTimeout(() => {
        setPoseFace("pose_bow");
      }, XIAOMEI_GREET_WAVE_MS),
    );
    beatTimers.current.push(
      window.setTimeout(() => {
        activeRef.current = false;
        setBeat(null);
        setBeatMood(null);
        setPoseFace(null);
      }, XIAOMEI_GREET_MS),
    );
  }, [clearBeatTimers, clearBlink, clearLeadTimer]);

  const startActivity = useCallback((beat: "spin" | "walk") => {
    clearBlink();
    clearBeatTimers();
    clearLeadTimer();
    activeRef.current = true;
    forcedRef.current = false;
    lastRef.current = beat;
    setLead(null);
    setBeat(beat);
    setBeatMood(null);
    const cuts = beat === "spin" ? XIAOMEI_SPIN_AT_MS : XIAOMEI_WALK_AT_MS;
    const faceAt = beat === "spin" ? spinFaceAt : walkFaceAt;
    setPoseFace(faceAt(0));
    for (const at of cuts) {
      if (at === 0) continue;
      beatTimers.current.push(
        window.setTimeout(() => {
          const face = faceAt(at);
          if (face) setPoseFace(face);
        }, at),
      );
    }
    beatTimers.current.push(
      window.setTimeout(() => {
        activeRef.current = false;
        setBeat(null);
        setBeatMood(null);
        setPoseFace(null);
      }, XIAOMEI_BEAT_MS[beat]),
    );
  }, [clearBeatTimers, clearBlink, clearLeadTimer]);

  const startSnack = useCallback(() => {
    clearBlink();
    clearBeatTimers();
    clearLeadTimer();
    activeRef.current = true;
    forcedRef.current = true;
    lastRef.current = "snack";
    setLead(null);
    setBeat("snack");
    setBeatMood(null);
    setPoseFace(snackFaceAt(0));
    beatTimers.current.push(
      window.setTimeout(() => {
        setPoseFace(snackFaceAt(XIAOMEI_SNACK_HOLD_MS));
      }, XIAOMEI_SNACK_HOLD_MS),
    );
    beatTimers.current.push(
      window.setTimeout(() => {
        activeRef.current = false;
        forcedRef.current = false;
        setBeat(null);
        setBeatMood(null);
        setPoseFace(null);
      }, XIAOMEI_BEAT_MS.snack),
    );
  }, [clearBeatTimers, clearBlink, clearLeadTimer]);

  const startUmbrella = useCallback(() => {
    clearBlink();
    clearBeatTimers();
    clearLeadTimer();
    activeRef.current = true;
    forcedRef.current = false;
    lastRef.current = "umbrella";
    setLead(null);
    setBeat("umbrella");
    setBeatMood(null);
    setPoseFace(umbrellaFaceAt(0));
    beatTimers.current.push(
      window.setTimeout(() => {
        activeRef.current = false;
        setBeat(null);
        setBeatMood(null);
        setPoseFace(null);
      }, XIAOMEI_BEAT_MS.umbrella),
    );
  }, [clearBeatTimers, clearBlink, clearLeadTimer]);

  const startDrink = useCallback(() => {
    clearBlink();
    clearBeatTimers();
    clearLeadTimer();
    activeRef.current = true;
    forcedRef.current = true;
    lastRef.current = "drink";
    setLead(null);
    setBeat("drink");
    setBeatMood(null);
    setPoseFace("pose_drink_hold");
    beatTimers.current.push(
      window.setTimeout(() => {
        setPoseFace("pose_drink_sip");
      }, XIAOMEI_DRINK_HOLD_MS),
    );
    beatTimers.current.push(
      window.setTimeout(() => {
        activeRef.current = false;
        forcedRef.current = false;
        setBeat(null);
        setBeatMood(null);
        setPoseFace(null);
      }, XIAOMEI_BEAT_MS.drink),
    );
  }, [clearBeatTimers, clearBlink, clearLeadTimer]);

  const applySleepFace = useCallback((phase: XiaomeiSleepPhase) => {
    sleepPhaseRef.current = phase;
    setSleepPhase(phase);
    const face = sleepPhaseFace(phase);
    if (phase === "sleep") {
      setBeat(null);
      setBeatMood(null);
      setLead(null);
      setPoseFace(face);
      return;
    }
    if (phase === "blank") {
      setBeat(null);
      setBeatMood(face);
      setPoseFace(null);
      return;
    }
    if (phase === "yawn") {
      setBeat("yawn");
      setBeatMood(null);
      setPoseFace(face);
      return;
    }
    if (phase === "wake") {
      setBeat("stretch");
      setBeatMood(null);
      setPoseFace(face);
      return;
    }
    setBeat(null);
    setBeatMood(null);
    setPoseFace(null);
  }, []);

  const playWake = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      applySleepFace("awake");
      return;
    }
    clearBlink();
    clearBeatTimers();
    clearLeadTimer();
    window.clearTimeout(sleepTimer.current);
    activeRef.current = true;
    forcedRef.current = true;
    applySleepFace("wake");
    sleepTimer.current = window.setTimeout(() => {
      activeRef.current = false;
      forcedRef.current = false;
      applySleepFace("awake");
    }, XIAOMEI_WAKE_MS);
  }, [applySleepFace, clearBeatTimers, clearBlink, clearLeadTimer]);

  const beginSleep = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (pausedRef.current() || activeRef.current || forcedRef.current) return;
    if (sleepPhaseRef.current !== "awake") return;
    clearBlink();
    clearBeatTimers();
    clearLeadTimer();
    window.clearTimeout(sleepTimer.current);
    activeRef.current = true;
    forcedRef.current = true;
    applySleepFace("yawn");
    sleepTimer.current = window.setTimeout(() => {
      applySleepFace("blank");
      sleepTimer.current = window.setTimeout(() => {
        activeRef.current = false;
        forcedRef.current = false;
        applySleepFace("sleep");
      }, XIAOMEI_SLEEP_BLANK_MS);
    }, XIAOMEI_SLEEP_YAWN_MS);
  }, [applySleepFace, clearBeatTimers, clearBlink, clearLeadTimer]);

  /** 任意交互：重置空闲；睡着则先播醒再回底座。 */
  const noteInteraction = useCallback(() => {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    idleSinceRef.current = now;
    const decision = wakeFromInteraction({
      visuallySleeping: isVisuallySleeping(sleepPhaseRef.current),
    });
    if (decision.wake) {
      playWake();
      return;
    }
    if (sleepPhaseRef.current === "wake") return;
    if (sleepPhaseRef.current !== "awake") {
      window.clearTimeout(sleepTimer.current);
      activeRef.current = false;
      forcedRef.current = false;
      applySleepFace("awake");
    }
  }, [applySleepFace, playWake]);

  const beginIdle = useCallback(
    (next: XiaomeiIdleBeat) => {
      if (isVisuallySleeping(sleepPhaseRef.current) || sleepPhaseRef.current === "wake") return;
      clearBlink();
      if (next === "drink") {
        startDrink();
        return;
      }
      if (next === "snack") {
        startSnack();
        return;
      }
      if (next === "umbrella") {
        startUmbrella();
        return;
      }
      if (next === "spin" || next === "walk") {
        startActivity(next);
        return;
      }
      clearBeatTimers();
      clearLeadTimer();
      activeRef.current = true;
      forcedRef.current = false;
      lastRef.current = next;
      setLead(null);
      setBeat(next);
      if (next === "sip" || next === "hold") {
        setBeatMood(null);
        setPoseFace(next === "sip" ? "pose_drink_sip" : "pose_drink_hold");
        beatTimers.current.push(
          window.setTimeout(() => {
            activeRef.current = false;
            setBeat(null);
            setBeatMood(null);
            setPoseFace(null);
          }, XIAOMEI_BEAT_MS[next]),
        );
        return;
      }
      setPoseFace(null);
      if (next === "blink" || next === "blink2" || next === "slowblink") {
        setBeatMood(null);
        startBlink();
      } else {
        const trail = expressionTrail(next, "content");
        setBeatMood(trail[0]);
        if (trail[0] !== trail[1]) {
          beatTimers.current.push(window.setTimeout(() => setBeatMood(trail[1]), XIAOMEI_TRAIL_MS));
        }
      }
      beatTimers.current.push(
        window.setTimeout(() => {
          activeRef.current = false;
          setBeat(null);
          setBeatMood(null);
        }, XIAOMEI_BEAT_MS[next]),
      );
    },
    [clearBeatTimers, clearBlink, clearLeadTimer, startActivity, startBlink, startDrink, startSnack, startUmbrella],
  );

  const flashClick = useCallback(
    (settled: XiaomeiMood, context: Extract<XiaomeiTrailContext, "click" | "pet" | "mutter"> = "click") => {
      const trail = expressionTrail(context, settled);
      clearBlink();
      clearBeatTimers();
      clearLeadTimer();
      activeRef.current = false;
      forcedRef.current = false;
      setBeat(null);
      setBeatMood(null);
      setPoseFace(null);
      setLead(trail[0]);
      leadTimer.current = window.setTimeout(() => setLead(null), XIAOMEI_TRAIL_MS);
    },
    [clearBeatTimers, clearBlink, clearLeadTimer],
  );

  const playFeed = useCallback((_settled: XiaomeiMood) => {
    startSnack();
  }, [startSnack]);

  useEffect(() => {
    hungryRef.current = options.hungry;
    pausedRef.current = options.paused;
  });

  useEffect(() => {
    if (options.enabled) return;
    clearBeatTimers();
    clearLeadTimer();
    clearBlinkTimers();
    window.clearTimeout(blinkArm.current);
    activeRef.current = false;
    forcedRef.current = false;
  }, [clearBeatTimers, clearBlinkTimers, clearLeadTimer, options.enabled]);

  useEffect(() => {
    if (!options.enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    const loop = () => {
      const gap = idleGapMs(Math.random());
      window.clearTimeout(blinkArm.current);
      blinkArm.current = window.setTimeout(() => {
        if (cancelled || pausedRef.current() || activeRef.current || forcedRef.current) return;
        if (isVisuallySleeping(sleepPhaseRef.current) || sleepPhaseRef.current === "wake") return;
        startBlink();
      }, 480 + Math.round(Math.random() * 900));
      gapTimer.current = window.setTimeout(() => {
        if (cancelled) return;
        if (
          !pausedRef.current() &&
          !activeRef.current &&
          !forcedRef.current &&
          sleepPhaseRef.current === "awake"
        ) {
          beginIdle(nextIdleBeat(Math.random(), lastRef.current, hungryRef.current));
        }
        loop();
      }, gap);
    };
    loop();
    return () => {
      cancelled = true;
      window.clearTimeout(gapTimer.current);
      window.clearTimeout(blinkArm.current);
    };
  }, [beginIdle, options.enabled, startBlink]);

  // 久闲入睡看守：周期性检查 idleSince，到期走哈欠→空白→睡。
  useEffect(() => {
    if (!options.enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    idleSinceRef.current = typeof performance !== "undefined" ? performance.now() : Date.now();
    const tick = () => {
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      if (
        shouldEnterSleep({
          idleSince: idleSinceRef.current,
          now,
          sleepPhase: sleepPhaseRef.current,
          reducedMotion: false,
          chatPinned: pausedRef.current(),
        })
      ) {
        beginSleep();
      }
      sleepWatch.current = window.setTimeout(tick, 4000);
    };
    sleepWatch.current = window.setTimeout(tick, 4000);
    return () => {
      window.clearTimeout(sleepWatch.current);
      window.clearTimeout(sleepTimer.current);
    };
  }, [beginSleep, options.enabled]);

  useEffect(
    () => () => {
      window.clearTimeout(gapTimer.current);
      window.clearTimeout(blinkArm.current);
      window.clearTimeout(sleepTimer.current);
      window.clearTimeout(sleepWatch.current);
      clearBeatTimers();
      clearBlinkTimers();
      clearLeadTimer();
    },
    [clearBeatTimers, clearBlinkTimers, clearLeadTimer],
  );

  return {
    beat,
    beatMood,
    lead,
    blinkFace,
    poseFace,
    sleepPhase,
    flashClick,
    playFeed,
    playDrink: startDrink,
    playGreet,
    noteInteraction,
    clear: stopVisual,
  };
}
