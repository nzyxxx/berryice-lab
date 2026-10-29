/**
 * A1 立绘。都是 256×438 全身，文件名就是脸的 id。
 * 眨眼和十二张情绪的身体锁在 blank 上，换 src 就等于换脸。
 * 喝水两张是新姿势，不能再叠一只杯子。
 * Batch B 十张站姿同样全身换 src：歪头、招手、鞠躬、偷看。
 * Batch C 九张活动也是全身：哈欠、伸懒腰、转圈三帧、左右迈步。
 * Batch D 点心和伞也是全身。菜单图标用 png，不再叠第二只。
 * 五张线上情绪仍由 xiaomei-lines 的 XiaomeiMood 管台词。
 */

import { XIAOMEI_SPRITE_VERSION, type XiaomeiMood } from "./xiaomei-lines";

/** Batch B 站姿。和喝水一样，id 就是去掉 .webp 的文件名。 */
export const XIAOMEI_STAND_POSES = [
  "pose_tilt_l",
  "pose_tilt_r",
  "pose_wave",
  "pose_cheek",
  "pose_peace",
  "pose_heart",
  "pose_bow",
  "pose_clasp",
  "pose_peek",
  "pose_point",
] as const;

/** Batch C 活动。转圈三帧、左右各两步，都不是镜像。 */
export const XIAOMEI_ACTIVITY_POSES = [
  "pose_yawn",
  "pose_stretch",
  "pose_spin_1",
  "pose_spin_2",
  "pose_spin_3",
  "pose_walk_l_1",
  "pose_walk_l_2",
  "pose_walk_r_1",
  "pose_walk_r_2",
] as const;

/** Batch D。点心先捧着再咬，伞是撑开的一把。 */
export const XIAOMEI_ITEM_POSES = ["pose_snack_hold", "pose_snack_bite", "pose_umbrella_hold"] as const;

export const XIAOMEI_A1_FACES = [
  "blink_open",
  "blink_half",
  "blink_closed",
  "mood_surprised",
  "mood_thinking",
  "mood_sleepy",
  "mood_shy",
  "mood_smug",
  "mood_puff",
  "mood_love",
  "mood_wink",
  "mood_cry",
  "mood_cool",
  "mood_eager",
  "mood_soft",
  "pose_drink_hold",
  "pose_drink_sip",
  ...XIAOMEI_STAND_POSES,
  ...XIAOMEI_ACTIVITY_POSES,
  ...XIAOMEI_ITEM_POSES,
] as const;

export type XiaomeiA1Face = (typeof XIAOMEI_A1_FACES)[number];

export type XiaomeiFace = XiaomeiMood | XiaomeiA1Face;

export type XiaomeiDrinkPose = "pose_drink_hold" | "pose_drink_sip";

export type XiaomeiStandPose = (typeof XIAOMEI_STAND_POSES)[number];

export type XiaomeiActivityPose = (typeof XIAOMEI_ACTIVITY_POSES)[number];

export type XiaomeiItemPose = (typeof XIAOMEI_ITEM_POSES)[number];

const A1_FACE_SET: ReadonlySet<string> = new Set(XIAOMEI_A1_FACES);

export function isXiaomeiA1Face(value: string): value is XiaomeiA1Face {
  return A1_FACE_SET.has(value);
}

/** 菜单上的杯子。喝水姿势里已经端着杯，不再浮第二只。 */
export const XIAOMEI_CUP_SRC = `/xiaomei/prop_cup.png?v=${XIAOMEI_SPRITE_VERSION}`;

/** 菜单上的点心。咬的姿势里已经拿着，不再浮第二块。 */
export const XIAOMEI_SNACK_SRC = `/xiaomei/prop_snack.png?v=${XIAOMEI_SPRITE_VERSION}`;

/** 伞的图标。撑伞姿势里已经举着，不再浮第二把。 */
export const XIAOMEI_UMBRELLA_SRC = `/xiaomei/prop_umbrella.png?v=${XIAOMEI_SPRITE_VERSION}`;

export function xiaomeiFaceSrc(face: XiaomeiFace): string {
  return `/xiaomei/${face}.webp?v=${XIAOMEI_SPRITE_VERSION}`;
}
