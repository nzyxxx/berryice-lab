export interface Attachment {
  id: string;
  name: string;
  type: "muzzle" | "barrel" | "grip" | "stock" | "magazine" | "sight" | "laser";
  icon?: string;
}

export interface WeaponStats {
  meatHarm: number;
  shootDistance: number;
  recoil: number;
  control: number;
  stable: number;
  hipShot: number;
  armorHarm: number;
  fireSpeed: number;
  capacity: number;
  fireMode?: string;
  muzzleVelocity?: number;
  soundDistance?: number;
  caliber?: string;
}

export type GunType =
  | "assault"
  | "smg"
  | "marksman"
  | "sniper"
  | "shotgun"
  | "pistol"
  | "lmg"
  | "special";

export interface Gun {
  id: string;
  name: string;
  type: GunType;
  description?: string;
  imageUrl?: string;
  thumbUrl?: string;
  attachments: Attachment[];
  stats?: WeaponStats;
  sourceUrl?: string;
}
