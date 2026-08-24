import type { GunType } from "@/lib/types/gun";

/** g.aitags.cn WordPress weapon_category term id */
export const WP_CATEGORY_TO_TYPE: Record<number, GunType> = {
  2: "assault",
  3: "smg",
  4: "shotgun",
  5: "lmg",
  6: "marksman",
  7: "sniper",
  9: "pistol",
  10: "special",
};

/** 工坊 second_class → GunType */
export const SECOND_CLASS_TO_TYPE: Record<string, GunType> = {
  gunRifle: "assault",
  gunSMG: "smg",
  gunSniper: "sniper",
  gunShotgun: "shotgun",
  gunPistol: "pistol",
  gunLMG: "lmg",
  gunMP: "marksman",
  special: "special",
};
