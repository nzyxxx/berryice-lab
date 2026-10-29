"use client";

import {
  XIAOMEI_BEAT_MS,
  XIAOMEI_TRAIL_MS,
  expressionTrail,
  idleGapMs,
  nextIdleBeat,
  type XiaomeiIdleBeat,
} from "@/lib/xiaomei-actions";
import type { XiaomeiMood } from "@/lib/xiaomei-lines";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 待机拍和点击/投喂的引子脸。只排 setTimeout，不挂 rAF。
 * 聊天、菜单、记忆打开时停掉下一拍。台词还在时不新开一拍。
 * 喂食的点心拍在关菜单的同一轮排上，菜单合上后接着播，不会被清掉。
 */
export function useXiaomeiPresence(options: { enabled: boolean; hungry: boolean; paused: () => boolean }) {
  const [beat, setBeat] = useState<XiaomeiIdleBeat | null>(null);
  const [beatMood, setBeatMood] = useState<XiaomeiMood | null>(null);
  const [lead, setLead] = useState<XiaomeiMood | null>(null);
  const [shown, setShown] = useState(options.enabled);
  if (options.enabled !== shown) {
    setShown(options.enabled);
    if (!options.enabled) {
      setBeat(null);
      setBeatMood(null);
      setLead(null);
    }
  }

  const hungryRef = useRef(options.hungry);
  const pausedRef = useRef(options.paused);

  const gapTimer = useRef(0);
  const leadTimer = useRef(0);
  const beatTimers = useRef<number[]>([]);
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

  const stopVisual = useCallback(() => {
    clearBeatTimers();
    clearLeadTimer();
    activeRef.current = false;
    forcedRef.current = false;
    setBeat(null);
    setBeatMood(null);
    setLead(null);
  }, [clearBeatTimers, clearLeadTimer]);

  const beginIdle = useCallback(
    (next: XiaomeiIdleBeat) => {
      const trail = expressionTrail(next, "content");
      clearBeatTimers();
      clearLeadTimer();
      activeRef.current = true;
      forcedRef.current = false;
      lastRef.current = next;
      setLead(null);
      setBeat(next);
      setBeatMood(trail[0]);
      if (trail[0] !== trail[1]) {
        beatTimers.current.push(window.setTimeout(() => setBeatMood(trail[1]), XIAOMEI_TRAIL_MS));
      }
      beatTimers.current.push(
        window.setTimeout(() => {
          activeRef.current = false;
          setBeat(null);
          setBeatMood(null);
        }, XIAOMEI_BEAT_MS[next]),
      );
    },
    [clearBeatTimers, clearLeadTimer],
  );

  const flashClick = useCallback(
    (settled: XiaomeiMood) => {
      const trail = expressionTrail("click", settled);
      clearBeatTimers();
      clearLeadTimer();
      activeRef.current = false;
      forcedRef.current = false;
      setBeat(null);
      setBeatMood(null);
      setLead(trail[0]);
      leadTimer.current = window.setTimeout(() => setLead(null), XIAOMEI_TRAIL_MS);
    },
    [clearBeatTimers, clearLeadTimer],
  );

  const playFeed = useCallback(
    (settled: XiaomeiMood) => {
      const trail = expressionTrail("feed", settled);
      clearBeatTimers();
      clearLeadTimer();
      activeRef.current = true;
      forcedRef.current = true;
      lastRef.current = "snack";
      setBeat("snack");
      setBeatMood(null);
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
    [clearBeatTimers, clearLeadTimer],
  );

  useEffect(() => {
    hungryRef.current = options.hungry;
    pausedRef.current = options.paused;
  });

  useEffect(() => {
    if (options.enabled) return;
    clearBeatTimers();
    clearLeadTimer();
    activeRef.current = false;
    forcedRef.current = false;
  }, [clearBeatTimers, clearLeadTimer, options.enabled]);

  useEffect(() => {
    if (!options.enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    const loop = () => {
      gapTimer.current = window.setTimeout(() => {
        if (cancelled) return;
        if (!pausedRef.current() && !activeRef.current && !forcedRef.current) {
          beginIdle(nextIdleBeat(Math.random(), lastRef.current, hungryRef.current));
        }
        loop();
      }, idleGapMs(Math.random()));
    };
    loop();
    return () => {
      cancelled = true;
      window.clearTimeout(gapTimer.current);
    };
  }, [beginIdle, options.enabled]);

  useEffect(
    () => () => {
      window.clearTimeout(gapTimer.current);
      clearBeatTimers();
      clearLeadTimer();
    },
    [clearBeatTimers, clearLeadTimer],
  );

  return { beat, beatMood, lead, flashClick, playFeed, clear: stopVisual };
}
