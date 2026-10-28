/**
 * 小莓的饱腹和好感。只活在这台浏览器里，没有账号。
 * 喂一口就动一点，到顶就停，避免连点把数字打穿。
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
