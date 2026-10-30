/**
 * A1 立绘。都是 256×438 全身，文件名就是脸的 id。
 * 待机眨眼走分层：body_neutral + face_*，不再整身硬切 blink_*。
 * blink_open / half / closed 仍是逻辑 id，舞台映射到脸层。
 * 情绪、站姿、活动和点心伞仍是全身换 src。
 * 喝水 / 点心 / 伞已经画在全身里，不再叠第二只道具。
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

/** 分层眨眼的脸叠加层。只盖五官椭圆，身体锁在 body_neutral。 */
export const XIAOMEI_FACE_LAYERS = ["face_open", "face_half", "face_closed"] as const;

export type XiaomeiFaceLayer = (typeof XIAOMEI_FACE_LAYERS)[number];

/** 逻辑眨眼 id。舞台叠 body_neutral + 对应 face_*，不整身换图。 */
export const XIAOMEI_LAYERED_BLINK_FACES = ["blink_open", "blink_half", "blink_closed"] as const;

export type XiaomeiLayeredBlinkFace = (typeof XIAOMEI_LAYERED_BLINK_FACES)[number];

/** 全身 / 姿势 src 交叉淡入时长。约一拍平滑，眨眼脸层不走这套。 */
export const XIAOMEI_CROSSFADE_MS = 90;

/** 同姿/异姿最短驻留（ms）。未满不启新 crossfade/motion-hide，防抖闪。分层眨眼帧不受限。 */
export const XIAOMEI_MIN_HOLD_MS = 320;

/** 异姿全身换图：下压 → 切图 → 弹起。同姿眨眼仍走分层，不走这套。 */
export const XIAOMEI_MOTION_HIDE_DOWN_MS = 140;
export const XIAOMEI_MOTION_HIDE_UP_MS = 360;
/** 后台 tab 可能掐 WAAPI/定时器；超时后强制切到目标脸，避免卡在半藏。 */
export const XIAOMEI_MOTION_HIDE_TIMEOUT_MS = 1600;

const A1_FACE_SET: ReadonlySet<string> = new Set(XIAOMEI_A1_FACES);

export function isXiaomeiA1Face(value: string): value is XiaomeiA1Face {
  return A1_FACE_SET.has(value);
}

export function isXiaomeiLayeredBlinkFace(value: string): value is XiaomeiLayeredBlinkFace {
  return value === "blink_open" || value === "blink_half" || value === "blink_closed";
}

export function xiaomeiBlinkFaceLayer(face: XiaomeiLayeredBlinkFace): XiaomeiFaceLayer {
  if (face === "blink_half") return "face_half";
  if (face === "blink_closed") return "face_closed";
  return "face_open";
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

/** 分层待机身体。眼窝清掉，给 face_* 叠。 */
export function xiaomeiBodyNeutralSrc(): string {
  return `/xiaomei/body_neutral.webp?v=${XIAOMEI_SPRITE_VERSION}`;
}

export function xiaomeiFaceLayerSrc(layer: XiaomeiFaceLayer): string {
  return `/xiaomei/${layer}.webp?v=${XIAOMEI_SPRITE_VERSION}`;
}

/** 烘焙好的发量待机全身。减动效或不分层时的回落。 */
export function xiaomeiIdleVolumeSrc(): string {
  return `/xiaomei/static_idle_volume.webp?v=${XIAOMEI_SPRITE_VERSION}`;
}
