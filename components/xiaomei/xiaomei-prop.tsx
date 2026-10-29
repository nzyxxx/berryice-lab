/**
 * 喝水、点心、伞都画在全身姿势里。
 * png 只用在菜单图标上，这里不再叠第二只跳动的贴纸。
 */

import type { XiaomeiPropKind, XiaomeiPropPose } from "@/lib/xiaomei-actions";

/** 道具层留着，避免舞台再接一条绘制路径。现在什么都不画。 */
export function XiaomeiProp({ kind, pose }: { kind: XiaomeiPropKind; pose: XiaomeiPropPose | null }) {
  void kind;
  void pose;
  return null;
}
