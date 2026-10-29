"use client";

import {
  XIAOMEI_BEAT_MS,
  XIAOMEI_BLINK_CYCLE,
  XIAOMEI_BLINK_FRAME_MS,
  XIAOMEI_DRINK_HOLD_MS,
  XIAOMEI_TRAIL_MS,
  expressionTrail,
  idleGapMs,
  nextIdleBeat,
  type XiaomeiIdleBeat,
  type XiaomeiTrailContext,
} from "@/lib/xiaomei-actions";
import type { XiaomeiFace } from "@/lib/xiaomei-faces";
import type { XiaomeiMood } from "@/lib/xiaomei-lines";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 待机拍、眨眼和点击/投喂的引子脸。只排 setTimeout，不挂 rAF。
 * 聊天、菜单、记忆打开时停掉下一拍。台词还在时不新开一拍，但喝水姿势可以盖过台词。
 * 喂食和喝水的动作在关菜单的同一轮排上，菜单合上后接着播，不会被清掉。
 */
export function useXiaomeiPresence(options: { enabled: boolean; hungry: boolean; paused: () => boolean }) {
  const [beat, setBeat] = useState<XiaomeiIdleBeat | null>(null);
  const [beatMood, setBeatMood] = useState<XiaomeiFace | null>(null);
  const [lead, setLead] = useState<XiaomeiFace | null>(null);
  const [blinkFace, setBlinkFace] = useState<XiaomeiFace | null>(null);
  const [poseFace, setPoseFace] = useState<XiaomeiFace | null>(null);
  const [shown, setShown] = useState(options.enabled);
  if (options.enabled !== shown) {
    setShown(options.enabled);
    if (!options.enabled) {
      setBeat(null);
      setBeatMood(null);
      setLead(null);
      setBlinkFace(null);
      setPoseFace(null);
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
    activeRef.current = false;
    forcedRef.current = false;
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

  const beginIdle = useCallback(
    (next: XiaomeiIdleBeat) => {
      clearBlink();
      if (next === "drink") {
        startDrink();
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
    [clearBeatTimers, clearBlink, clearLeadTimer, startBlink, startDrink],
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

  const playFeed = useCallback(
    (settled: XiaomeiMood) => {
      const trail = expressionTrail("feed", settled);
      clearBlink();
      clearBeatTimers();
      clearLeadTimer();
      activeRef.current = true;
      forcedRef.current = true;
      lastRef.current = "snack";
      setBeat("snack");
      setBeatMood(null);
      setPoseFace(null);
      setLead(trail[0]);
      leadTimer.current = window.setTimeout(() => setLead(null), XIAOMEI_TRAIL_MS);
      beatTimers.current.push(
        window.setTimeout(() => {
          activeRef.current = false;
          forcedRef.current = false;
          setBeat(null);
          setBeatMood(null);
        }, XIAOMEI_BEAT_MS.snack),
      );
    },
    [clearBeatTimers, clearBlink, clearLeadTimer],
  );

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
        startBlink();
      }, 480 + Math.round(Math.random() * 900));
      gapTimer.current = window.setTimeout(() => {
        if (cancelled) return;
        if (!pausedRef.current() && !activeRef.current && !forcedRef.current) {
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

  useEffect(
    () => () => {
      window.clearTimeout(gapTimer.current);
      window.clearTimeout(blinkArm.current);
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
    flashClick,
    playFeed,
    playDrink: startDrink,
    clear: stopVisual,
  };
}
