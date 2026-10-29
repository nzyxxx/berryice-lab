"use client";

import {
  XIAOMEI_FEED_DAILY_CAP,
  XIAOMEI_HUNGER_MS,
  XIAOMEI_METERS_KEY,
  XIAOMEI_METER_DEFAULT,
  feedXiaomei,
  nextFeedClock,
  petXiaomei,
  projectXiaomeiMeters,
  readFeedClock,
  readPetClock,
  serializeXiaomeiMeters,
  warmXiaomei,
  type XiaomeiFeedClock,
  type XiaomeiFeedResult,
  type XiaomeiMeters,
  type XiaomeiPetClock,
  type XiaomeiPetOutcome,
} from "@/lib/xiaomei-meters";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

const FEED_LOCK_MS = 480;
const METERS_EVENT = "xiaomei-meters";

const SERVER_METERS: XiaomeiMeters = {
  fullness: XIAOMEI_METER_DEFAULT.fullness,
  affection: XIAOMEI_METER_DEFAULT.affection,
};

let clock = 0;
let feedClock: XiaomeiFeedClock = { feedDay: "", feedCountToday: 0 };
let petClock: XiaomeiPetClock = { petDay: "", petCountToday: 0 };
let session: XiaomeiMeters | null = null;
let cache: { raw: string | null; bucket: number; value: XiaomeiMeters } = {
  raw: null,
  bucket: -1,
  value: SERVER_METERS,
};

function safeGet(): string | null {
  try {
    return localStorage.getItem(XIAOMEI_METERS_KEY);
  } catch {
    return null;
  }
}

function publish(
  meters: XiaomeiMeters,
  touchedAt: number,
  nextFeed: XiaomeiFeedClock,
  nextPet: XiaomeiPetClock,
) {
  feedClock = nextFeed;
  petClock = nextPet;
  const raw = serializeXiaomeiMeters({
    fullness: meters.fullness,
    affection: meters.affection,
    touchedAt,
    feedDay: nextFeed.feedDay,
    feedCountToday: nextFeed.feedCountToday,
    petDay: nextPet.petDay,
    petCountToday: nextPet.petCountToday,
  });
  clock = touchedAt;
  cache = { raw, bucket: Math.floor(Date.now() / XIAOMEI_HUNGER_MS), value: meters };
  try {
    localStorage.setItem(XIAOMEI_METERS_KEY, raw);
    session = null;
  } catch {
    session = meters;
  }
  window.dispatchEvent(new Event(METERS_EVENT));
}

function readMeters(): XiaomeiMeters {
  if (session) return session;
  const raw = safeGet();
  const now = Date.now();
  const bucket = Math.floor(now / XIAOMEI_HUNGER_MS);
  if (cache.raw === raw && cache.bucket === bucket) return cache.value;
  const projected = projectXiaomeiMeters(raw, now);
  clock = projected.touchedAt;
  const date = new Date(now);
  feedClock = readFeedClock(raw, date);
  petClock = readPetClock(raw, date);
  cache = { raw, bucket, value: projected.meters };
  return cache.value;
}

function subscribeMeters(onChange: () => void) {
  window.addEventListener(METERS_EVENT, onChange);
  return () => window.removeEventListener(METERS_EVENT, onChange);
}

/** 喂食和摸头各有一把锁。锁住的那一下直接丢掉，不叠第二下。聊天加的好感不走这两把锁。 */
export function useXiaomeiMeters() {
  const meters = useSyncExternalStore(subscribeMeters, readMeters, () => SERVER_METERS);
  const lock = useRef(false);
  const lockTimer = useRef(0);
  const petLock = useRef(false);
  const petTimer = useRef(0);

  useEffect(
    () => () => {
      window.clearTimeout(lockTimer.current);
      window.clearTimeout(petTimer.current);
    },
    [],
  );

  const feed = useCallback((): (XiaomeiFeedResult & { tooMuch: boolean }) | null => {
    if (lock.current) return null;
    lock.current = true;
    window.clearTimeout(lockTimer.current);
    lockTimer.current = window.setTimeout(() => {
      lock.current = false;
    }, FEED_LOCK_MS);
    const now = Date.now();
    const date = new Date(now);
    const raw = safeGet();
    const result = feedXiaomei(readMeters());
    const next = nextFeedClock(session ? feedClock : readFeedClock(raw, date), date);
    const petKept = session ? petClock : readPetClock(raw, date);
    publish(result.meters, now, next, petKept);
    return { ...result, tooMuch: next.feedCountToday >= XIAOMEI_FEED_DAILY_CAP };
  }, []);

  const pet = useCallback((): XiaomeiPetOutcome | null => {
    if (petLock.current) return null;
    petLock.current = true;
    window.clearTimeout(petTimer.current);
    petTimer.current = window.setTimeout(() => {
      petLock.current = false;
    }, FEED_LOCK_MS);
    const now = Date.now();
    const date = new Date(now);
    const raw = safeGet();
    const feedKept = session ? feedClock : readFeedClock(raw, date);
    const currentPet = session ? petClock : readPetClock(raw, date);
    const outcome = petXiaomei(readMeters(), currentPet, date);
    if (outcome.kind === "capped") return outcome;
    const touchedAt = session ? clock || now : projectXiaomeiMeters(raw, now).touchedAt;
    publish(outcome.meters, touchedAt, feedKept, outcome.clock);
    return outcome;
  }, []);

  const warm = useCallback(() => {
    const now = Date.now();
    const date = new Date(now);
    const raw = safeGet();
    const feedKept = session ? feedClock : readFeedClock(raw, date);
    const petKept = session ? petClock : readPetClock(raw, date);
    if (session) {
      publish(warmXiaomei(session), clock || now, feedKept, petKept);
      return;
    }
    const projected = projectXiaomeiMeters(raw, now);
    publish(warmXiaomei(projected.meters), projected.touchedAt, feedKept, petKept);
  }, []);

  return { meters, feed, pet, warm, feedCountToday: feedClock.feedCountToday };
}
