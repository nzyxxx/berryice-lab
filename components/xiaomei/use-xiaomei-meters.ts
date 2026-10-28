"use client";

import {
  XIAOMEI_METERS_KEY,
  XIAOMEI_METER_DEFAULT,
  feedXiaomei,
  metersFromStored,
  type XiaomeiFeedResult,
  type XiaomeiMeters,
} from "@/lib/xiaomei-meters";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

const FEED_LOCK_MS = 480;
const METERS_EVENT = "xiaomei-meters";

const SERVER_METERS: XiaomeiMeters = {
  fullness: XIAOMEI_METER_DEFAULT.fullness,
  affection: XIAOMEI_METER_DEFAULT.affection,
};

let cache: { raw: string | null; value: XiaomeiMeters } = { raw: null, value: SERVER_METERS };
let session: XiaomeiMeters | null = null;

function readMeters(): XiaomeiMeters {
  if (session) return session;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(XIAOMEI_METERS_KEY);
  } catch {
    raw = null;
  }
  if (cache.raw === raw) return cache.value;
  const value = metersFromStored(raw);
  cache = { raw, value };
  return value;
}

function writeMeters(next: XiaomeiMeters) {
  const raw = JSON.stringify(next);
  try {
    localStorage.setItem(XIAOMEI_METERS_KEY, raw);
    session = null;
    if (cache.raw !== raw) cache = { raw, value: next };
  } catch {
    session = next;
  }
  window.dispatchEvent(new Event(METERS_EVENT));
}

function subscribeMeters(onChange: () => void) {
  window.addEventListener(METERS_EVENT, onChange);
  return () => window.removeEventListener(METERS_EVENT, onChange);
}

/** 喂食锁在钩子里。锁住的那一下直接丢掉，不叠第二口。 */
export function useXiaomeiMeters() {
  const meters = useSyncExternalStore(subscribeMeters, readMeters, () => SERVER_METERS);
  const lock = useRef(false);
  const lockTimer = useRef(0);

  useEffect(() => () => window.clearTimeout(lockTimer.current), []);

  const feed = useCallback((): XiaomeiFeedResult | null => {
    if (lock.current) return null;
    lock.current = true;
    window.clearTimeout(lockTimer.current);
    lockTimer.current = window.setTimeout(() => {
      lock.current = false;
    }, FEED_LOCK_MS);
    const result = feedXiaomei(readMeters());
    writeMeters(result.meters);
    return result;
  }, []);

  return { meters, feed };
}
