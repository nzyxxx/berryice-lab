/**
 * 公开游戏只列站上已经确认、并且另有工具页的游戏。
 * 测试可以再传入别的 id，那些 id 不会出现在这个清单里。
 */
export const PUBLIC_GAMES = [
  {
    id: "delta",
    title: "三角洲行动",
    blurb: "按游戏整理攻略与技巧，保留来源与适用版本。",
    tools: [
      { href: "/delta-gun", label: "工具总览" },
      { href: "/delta-gun/guns", label: "枪械库" },
      { href: "/delta-gun/community", label: "社区改枪码" },
      { href: "/delta-gun/streamers", label: "主播配装" },
    ],
  },
] as const;

export type PublicGame = (typeof PUBLIC_GAMES)[number];

export type GameRef = { id: string; title: string };

export const UNSORTED_GAME_ID = "unsorted";

export function publicGame(id: string): PublicGame | null {
  return PUBLIC_GAMES.find((game) => game.id === id) ?? null;
}
