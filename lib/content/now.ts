/**
 * /about 的「现在」区。
 *
 * 只写此刻真的成立的事。更新内容时顺手改 `nowUpdatedAt` ——
 * 一个半年没动的 Now 页比没有 Now 页更糟。
 */

export interface NowEntry {
  /** 例 "正在做" / "正在听" / "正在读" */
  label: string;
  value: string;
  /** 有就渲染成链接，没有就是纯文本 */
  href?: string;
}

export const nowUpdatedAt = "2026-09";

export const now: NowEntry[] = [
  { label: "正在做", value: "三角洲改枪实验室", href: "/delta-gun" },
];
