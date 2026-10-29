/**
 * 小莓的饱腹和好感。只活在这台浏览器里，没有账号。
 * 喂一口就动一点，到顶就停，避免连点把数字打穿。
 * 摸头只加一点点好感，和喂食共用同一套日键，一天有次数。
 * 聊完好感加一点。饱腹按上次进食或聊天的时刻慢慢掉，没有定时器。
 */

export const XIAOMEI_METERS_KEY = "berryice.xiaomei.meters";

export const XIAOMEI_METER_MAX = 100;

export const XIAOMEI_METER_DEFAULT = Object.freeze({ fullness: 46, affection: 22 });

const BITE_FULLNESS = 7;
const BITE_AFFECTION = 4;
const SOFT_AFFECTION = 3;
const CHAT_AFFECTION = 1;

/** 六小时掉一点饱腹。读的时候算，不留定时器。 */
export const XIAOMEI_HUNGER_MS = 6 * 60 * 60 * 1000;
export const XIAOMEI_HUNGER_DROP = 8;
export const XIAOMEI_HUNGER_STEPS = 12;

export type XiaomeiMeters = {
  fullness: number;
  affection: number;
};

export type XiaomeiFeedKind = "bite" | "soft" | "full";

export type XiaomeiFeedResult = {
  meters: XiaomeiMeters;
  kind: XiaomeiFeedKind;
};

export function clampXiaomeiMeter(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(XIAOMEI_METER_MAX, Math.max(0, Math.round(value)));
}

export function metersFromStored(raw: string | null): XiaomeiMeters {
  if (!raw) return { ...XIAOMEI_METER_DEFAULT };
  try {
    const parsed = JSON.parse(raw) as Partial<XiaomeiMeters>;
    if (typeof parsed.fullness !== "number" || typeof parsed.affection !== "number") {
      return { ...XIAOMEI_METER_DEFAULT };
    }
    return {
      fullness: clampXiaomeiMeter(parsed.fullness),
      affection: clampXiaomeiMeter(parsed.affection),
    };
  } catch {
    return { ...XIAOMEI_METER_DEFAULT };
  }
}

export function readXiaomeiMeters(read: () => string | null): XiaomeiMeters {
  try {
    return metersFromStored(read());
  } catch {
    return { ...XIAOMEI_METER_DEFAULT };
  }
}

export function feedXiaomei(current: XiaomeiMeters): XiaomeiFeedResult {
  const fullness = clampXiaomeiMeter(current.fullness);
  const affection = clampXiaomeiMeter(current.affection);
  if (fullness >= XIAOMEI_METER_MAX && affection >= XIAOMEI_METER_MAX) {
    return { meters: { fullness, affection }, kind: "full" };
  }
  if (fullness >= XIAOMEI_METER_MAX) {
    return {
      meters: { fullness, affection: clampXiaomeiMeter(affection + SOFT_AFFECTION) },
      kind: "soft",
    };
  }
  return {
    meters: {
      fullness: clampXiaomeiMeter(fullness + BITE_FULLNESS),
      affection: clampXiaomeiMeter(affection + BITE_AFFECTION),
    },
    kind: "bite",
  };
}

/**
 * 内部差值的可读形式。气泡和菜单都不贴这行。
 * 没变化就返回空，避免把「没动」说成又吃了一口。
 */
export function formatMeterDelta(fullness: number, affection: number): string | null {
  const parts: string[] = [];
  if (fullness !== 0) parts.push(`饱腹 ${fullness > 0 ? `+${fullness}` : fullness}`);
  if (affection !== 0) parts.push(`好感 ${affection > 0 ? `+${affection}` : affection}`);
  if (parts.length === 0) return null;
  return parts.join(" · ");
}

/** 一轮说完的对话，好感加一点。饱腹不动。到顶就停。 */
export function warmXiaomei(current: XiaomeiMeters): XiaomeiMeters {
  return {
    fullness: clampXiaomeiMeter(current.fullness),
    affection: clampXiaomeiMeter(clampXiaomeiMeter(current.affection) + CHAT_AFFECTION),
  };
}

export type XiaomeiMeterProjection = {
  meters: XiaomeiMeters;
  touchedAt: number;
  persist: boolean;
};

function readTouchedAt(raw: string | null): number | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { touchedAt?: unknown };
    if (typeof parsed.touchedAt !== "number" || !Number.isFinite(parsed.touchedAt)) return null;
    return parsed.touchedAt;
  } catch {
    return null;
  }
}

/** 同一天喂到这个次数，本地台词改口嫌撑。 */
export const XIAOMEI_FEED_DAILY_CAP = 6;

export type XiaomeiFeedClock = {
  feedDay: string;
  feedCountToday: number;
};

export function dayKey(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function readFeedClock(raw: string | null, now: Date): XiaomeiFeedClock {
  const today = dayKey(now);
  if (!raw) return { feedDay: today, feedCountToday: 0 };
  try {
    const parsed = JSON.parse(raw) as { feedDay?: unknown; feedCountToday?: unknown };
    const day = typeof parsed.feedDay === "string" ? parsed.feedDay : "";
    const count =
      typeof parsed.feedCountToday === "number" && Number.isFinite(parsed.feedCountToday)
        ? Math.max(0, Math.floor(parsed.feedCountToday))
        : 0;
    if (day !== today) return { feedDay: today, feedCountToday: 0 };
    return { feedDay: today, feedCountToday: count };
  } catch {
    return { feedDay: today, feedCountToday: 0 };
  }
}

export function nextFeedClock(clock: XiaomeiFeedClock, now: Date): XiaomeiFeedClock {
  const today = dayKey(now);
  const count = clock.feedDay === today ? clock.feedCountToday + 1 : 1;
  return { feedDay: today, feedCountToday: count };
}

/** 摸头和喂食同一天历、同一上限。超过之后好感不再涨，避免长按把数字刷满。 */
export const XIAOMEI_PET_DAILY_CAP = XIAOMEI_FEED_DAILY_CAP;

export type XiaomeiPetClock = {
  petDay: string;
  petCountToday: number;
};

export type XiaomeiPetKind = "pet" | "full" | "capped";

export type XiaomeiPetOutcome = {
  meters: XiaomeiMeters;
  kind: XiaomeiPetKind;
  /** 这一下实际加上的好感。到顶或超过今日次数就是 0。 */
  gain: number;
  clock: XiaomeiPetClock;
};

export type XiaomeiMeterBlob = {
  fullness: number;
  affection: number;
  touchedAt: number;
  feedDay: string;
  feedCountToday: number;
  petDay: string;
  petCountToday: number;
};

export function readPetClock(raw: string | null, now: Date): XiaomeiPetClock {
  const today = dayKey(now);
  if (!raw) return { petDay: today, petCountToday: 0 };
  try {
    const parsed = JSON.parse(raw) as { petDay?: unknown; petCountToday?: unknown };
    const day = typeof parsed.petDay === "string" ? parsed.petDay : "";
    const count =
      typeof parsed.petCountToday === "number" && Number.isFinite(parsed.petCountToday)
        ? Math.max(0, Math.floor(parsed.petCountToday))
        : 0;
    if (day !== today) return { petDay: today, petCountToday: 0 };
    return { petDay: today, petCountToday: count };
  } catch {
    return { petDay: today, petCountToday: 0 };
  }
}

/**
 * 摸头：好感 +1 或 +2，饱腹不动。
 * 今天已经摸满，就停在原数字上，时钟也不再往上加。
 * 好感到顶仍记一次，方便和「次数用完」分开说。
 */
export function petXiaomei(
  current: XiaomeiMeters,
  clock: XiaomeiPetClock,
  now: Date,
  random: () => number = Math.random,
): XiaomeiPetOutcome {
  const today = dayKey(now);
  const used = clock.petDay === today ? Math.max(0, Math.floor(clock.petCountToday)) : 0;
  const fullness = clampXiaomeiMeter(current.fullness);
  const affection = clampXiaomeiMeter(current.affection);
  if (used >= XIAOMEI_PET_DAILY_CAP) {
    return {
      meters: { fullness, affection },
      kind: "capped",
      gain: 0,
      clock: { petDay: today, petCountToday: used },
    };
  }
  const nextClock = { petDay: today, petCountToday: used + 1 };
  if (affection >= XIAOMEI_METER_MAX) {
    return { meters: { fullness, affection }, kind: "full", gain: 0, clock: nextClock };
  }
  const roll = random();
  const bump = typeof roll === "number" && roll < 0.5 ? 1 : 2;
  const nextAffection = clampXiaomeiMeter(affection + bump);
  return {
    meters: { fullness, affection: nextAffection },
    kind: "pet",
    gain: nextAffection - affection,
    clock: nextClock,
  };
}

/** 喂食和摸头写进同一条存档。缺任何一边，下一次写入都会把另一边冲掉。 */
export function serializeXiaomeiMeters(blob: XiaomeiMeterBlob): string {
  return JSON.stringify({
    fullness: clampXiaomeiMeter(blob.fullness),
    affection: clampXiaomeiMeter(blob.affection),
    touchedAt: blob.touchedAt,
    feedDay: blob.feedDay,
    feedCountToday: Math.max(0, Math.floor(blob.feedCountToday) || 0),
    petDay: blob.petDay,
    petCountToday: Math.max(0, Math.floor(blob.petCountToday) || 0),
  });
}

/**
 * 没记过时刻就先不上饿，等第一次喂食或聊完再开始算。
 * 好感不掉。饱腹按经过的整段往下减，避免连着打开页面重复扣。
 */
export function projectXiaomeiMeters(raw: string | null, now: number): XiaomeiMeterProjection {
  const meters = metersFromStored(raw);
  const touchedAt = readTouchedAt(raw);
  if (touchedAt === null || touchedAt > now) {
    return { meters, touchedAt: now, persist: touchedAt !== now };
  }
  const steps = Math.min(XIAOMEI_HUNGER_STEPS, Math.floor((now - touchedAt) / XIAOMEI_HUNGER_MS));
  if (steps <= 0) return { meters, touchedAt, persist: false };
  return {
    meters: {
      fullness: clampXiaomeiMeter(meters.fullness - steps * XIAOMEI_HUNGER_DROP),
      affection: meters.affection,
    },
    touchedAt: touchedAt + steps * XIAOMEI_HUNGER_MS,
    persist: true,
  };
}
