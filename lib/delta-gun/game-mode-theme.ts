import { isBeaconMode, type GameMode } from "@/lib/delta-gun/game-modes";

/** Tab：内部值 + 界面展示名 */
export const GAME_MODE_TABS: { value: GameMode; label: string }[] = [
  { value: "大战场", label: "大战场" },
  { value: "烽火", label: "烽火地带" },
];

export function gameModeDisplayLabel(game: string): string {
  return isBeaconMode(game) ? "烽火地带" : "大战场";
}

export interface GameModeTheme {
  label: string;
  /** 卡片左侧色条 */
  stripe: string;
  badge: string;
  codeBox: string;
  codeText: string;
  cardBorder: string;
  cardFeatured: string;
  ring: string;
  /** 覆盖 shadcn TabsTrigger 的 data-active 默认背景 */
  tabTrigger: string;
  copyBtn: string;
  titleHover: string;
  rankFirst: string;
}

/** 大战场：琥珀战术色 — 暖色、偏「大规模战场」质感 */
const WARFIELD_THEME: GameModeTheme = {
  label: "大战场",
  stripe: "bg-gradient-to-b from-amber-400 via-lab-accent-tactical to-amber-600/60",
  badge:
    "border-amber-500/35 bg-amber-500/10 text-amber-300 shadow-[inset_0_1px_0_rgba(251,191,36,0.12)]",
  codeBox: "border-amber-500/20 bg-amber-950/25",
  codeText: "text-amber-200",
  cardBorder: "border-lab-hairline hover:border-amber-500/30",
  cardFeatured: "border-amber-500/35 ring-1 ring-amber-500/20",
  ring: "ring-amber-500/20",
  tabTrigger:
    "text-lab-ink-subtle hover:text-amber-200 data-active:!border-transparent data-active:!bg-gradient-to-r data-active:from-amber-600 data-active:to-lab-accent-tactical data-active:!text-lab-canvas data-active:shadow-sm",
  copyBtn: "text-amber-400/80 hover:bg-amber-500/15 hover:text-amber-300",
  titleHover: "group-hover:text-amber-300",
  rankFirst: "bg-gradient-to-br from-amber-500 to-lab-accent-tactical text-lab-canvas",
};

/** 烽火地带：极光青紫 — 与站点主视觉一致 */
const BEACON_THEME: GameModeTheme = {
  label: "烽火地带",
  stripe: "bg-gradient-to-b from-lab-primary via-lab-accent-glow to-sky-500/50",
  badge:
    "border-lab-primary/40 bg-lab-primary/10 text-lab-primary shadow-[inset_0_1px_0_rgba(56,189,248,0.15)]",
  codeBox: "border-lab-primary/25 bg-lab-primary/5",
  codeText: "text-sky-200",
  cardBorder: "border-lab-hairline hover:border-lab-primary/35",
  cardFeatured: "border-lab-primary/40 ring-1 ring-lab-primary/25",
  ring: "ring-lab-primary/20",
  tabTrigger:
    "text-lab-ink-subtle hover:text-lab-primary data-active:!border-transparent data-active:!bg-gradient-to-r data-active:from-lab-primary data-active:to-lab-accent-glow/90 data-active:!text-lab-canvas data-active:shadow-sm",
  copyBtn: "text-lab-primary/80 hover:bg-lab-primary/15 hover:text-lab-primary",
  titleHover: "group-hover:text-lab-primary",
  rankFirst: "bg-gradient-to-br from-lab-primary to-lab-accent-glow text-lab-canvas",
};

export function getGameModeTheme(game: string): GameModeTheme {
  return isBeaconMode(game) ? BEACON_THEME : WARFIELD_THEME;
}

export function getGameModeThemeByValue(mode: GameMode): GameModeTheme {
  return mode === "烽火" ? BEACON_THEME : WARFIELD_THEME;
}
