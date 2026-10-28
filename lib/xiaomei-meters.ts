/**
 * 小莓的饱腹和好感。只活在这台浏览器里，没有账号。
 * 喂一口就动一点，到顶就停，避免连点把数字打穿。
 */

export const XIAOMEI_METERS_KEY = "berryice.xiaomei.meters";

export const XIAOMEI_METER_MAX = 100;

export const XIAOMEI_METER_DEFAULT = Object.freeze({ fullness: 46, affection: 22 });

const BITE_FULLNESS = 7;
const BITE_AFFECTION = 4;
const SOFT_AFFECTION = 3;

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
