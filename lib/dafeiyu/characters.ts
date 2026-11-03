/** 实验室对照角色。默认大肥鱼；小莓是同一播放器里的空槽，不是首页角标。 */
export const LAB_CHARACTER_IDS = ["dafeiyu", "xiaomei"] as const;

export type LabCharacterId = (typeof LAB_CHARACTER_IDS)[number];

export const LAB_CHARACTERS: readonly { id: LabCharacterId; label: string }[] = [
  { id: "dafeiyu", label: "大肥鱼" },
  { id: "xiaomei", label: "小莓" },
];

export function parseLabCharacterId(value: string | null | undefined): LabCharacterId {
  return value === "xiaomei" ? "xiaomei" : "dafeiyu";
}

export function parseLabCharacterSearch(search: string): LabCharacterId {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  return parseLabCharacterId(new URLSearchParams(raw).get("character"));
}
