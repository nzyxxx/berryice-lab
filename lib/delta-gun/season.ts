/** 当前赛季。线上用 NEXT_PUBLIC_DELTA_SEASON 覆盖，例如 S7。 */
export const CURRENT_SEASON = process.env.NEXT_PUBLIC_DELTA_SEASON || "当季";

/** 没有赛季标记时，超过这个天数视为过季。 */
export const SEASON_FRESH_DAYS = 45;

export const FOCUS_TAGS = ["稳定", "腰射", "远程", "机动", "低后座", "满改"] as const;
export type FocusTag = (typeof FOCUS_TAGS)[number];

const FOCUS_RULES: { pattern: RegExp; tag: FocusTag }[] = [
  { pattern: /稳定|压枪/, tag: "稳定" },
  { pattern: /腰射/, tag: "腰射" },
  { pattern: /远程|远射|远距离/, tag: "远程" },
  { pattern: /机动|跑射/, tag: "机动" },
  { pattern: /后座|低后/, tag: "低后座" },
  { pattern: /满改|毕业/, tag: "满改" },
];

export function inferFocusTags(text: string): FocusTag[] {
  return FOCUS_RULES.filter((rule) => rule.pattern.test(text)).map((rule) => rule.tag);
}

export function parseFocusTags(raw: string | string[] | null | undefined): FocusTag[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[,，/\s]+/);
  const allowed = new Set<string>(FOCUS_TAGS);
  return [...new Set(parts.map((part) => part.trim()).filter((part): part is FocusTag => allowed.has(part)))];
}

export function recommendationFromCopies(copyCount: number): number {
  if (copyCount >= 10_000) return 5;
  if (copyCount >= 3_000) return 4;
  if (copyCount >= 800) return 3;
  if (copyCount >= 100) return 2;
  return 1;
}

export function clampRecommendation(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 5) return null;
  return number;
}

export function isStaleCode(input: { season?: string | null; postedAt?: string | null }): boolean {
  const season = input.season?.trim() ?? "";
  const current = CURRENT_SEASON.trim();
  // 「当季」是还没写具体赛季号时的占位。这时相信枪码自己标的赛季，避免 S11 被一律打成过季。
  const currentIsPlaceholder = current === "" || current === "当季";
  if (season && !currentIsPlaceholder && season !== current) return true;
  if (season && (currentIsPlaceholder || season === current)) return false;
  if (!input.postedAt) return true;
  const posted = new Date(input.postedAt).getTime();
  if (Number.isNaN(posted)) return true;
  return Date.now() - posted > SEASON_FRESH_DAYS * 86_400_000;
}

export function formatPostDate(value?: string | null): string {
  if (!value) return "日期未标";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "日期未标";
  return date.toLocaleDateString("zh-CN", { year: "numeric", month: "numeric", day: "numeric" });
}
