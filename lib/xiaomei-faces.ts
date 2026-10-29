/**
 * A1 立绘。都是 256×438 全身，文件名就是脸的 id。
 * 眨眼和十二张情绪的身体锁在 blank 上，换 src 就等于换脸。
 * 喝水两张是新姿势，不能再叠一只杯子。
 * Batch B 十张站姿同样全身换 src：歪头、招手、鞠躬、偷看。
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
] as const;

export type XiaomeiA1Face = (typeof XIAOMEI_A1_FACES)[number];

export type XiaomeiFace = XiaomeiMood | XiaomeiA1Face;

export type XiaomeiDrinkPose = "pose_drink_hold" | "pose_drink_sip";

export type XiaomeiStandPose = (typeof XIAOMEI_STAND_POSES)[number];

const A1_FACE_SET: ReadonlySet<string> = new Set(XIAOMEI_A1_FACES);

export function isXiaomeiA1Face(value: string): value is XiaomeiA1Face {
  return A1_FACE_SET.has(value);
}

/** 菜单上的杯子。喝水姿势里已经端着杯，不再浮第二只。 */
export const XIAOMEI_CUP_SRC = `/xiaomei/prop_cup.png?v=${XIAOMEI_SPRITE_VERSION}`;

export function xiaomeiFaceSrc(face: XiaomeiFace): string {
  return `/xiaomei/${face}.webp?v=${XIAOMEI_SPRITE_VERSION}`;
}
