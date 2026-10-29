/**
 * 点心仍是 SVG，跟着身体走。喝水改走全身姿势，杯子已经在画面里。
 * prop_cup.png 用在菜单图标上，不再叠一只跳动的杯子。
 */

import type { XiaomeiPropKind, XiaomeiPropPose } from "@/lib/xiaomei-actions";

/** 只画道具，不改脸、不记状态。 */
export function XiaomeiProp({ kind, pose }: { kind: XiaomeiPropKind; pose: XiaomeiPropPose | null }) {
  if (kind === "cup") return null;

  if (kind === "umbrella") {
    return (
      <span className="xiaomei-prop xiaomei-prop-umbrella" aria-hidden>
        <svg viewBox="0 0 32 32" width="100%" height="100%">
          <path
            d="M3 16.2C3 9 8.8 3.4 16 3.4S29 9 29 16.2H3z"
            fill="#8ea0c4"
            stroke="rgba(8,9,13,0.45)"
            strokeWidth="1.2"
          />
          <path d="M16 4.2v12" stroke="rgba(244,246,251,0.45)" strokeWidth="1" />
          <path d="M10.2 16.2c.2-2.6 2.4-4.6 5.8-4.6" fill="none" stroke="rgba(244,246,251,0.35)" strokeWidth="1" />
          <path d="M16 16.2v8.4" stroke="#24305f" strokeWidth="1.7" strokeLinecap="round" />
          <path
            d="M16 24.6c2.2 0 3.1 1.6 3.1 2.6 0 .8-.7 1.3-1.5 1.3-1.2 0-1.9-.9-1.6-2"
            fill="none"
            stroke="#24305f"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }

  return (
    <span className="xiaomei-prop xiaomei-prop-snack xiaomei-pose-bite" aria-hidden data-pose={pose ?? "bite"}>
      <span className="xiaomei-prop-object">
        <span className="xiaomei-prop-shadow" />
        <svg viewBox="0 0 32 32" width="100%" height="100%">
          <ellipse cx="16" cy="21" rx="11" ry="7" fill="#e7b888" />
          <ellipse cx="16" cy="18.6" rx="11" ry="5.6" fill="#f6d3a6" />
          <circle cx="16" cy="11.2" r="5.2" fill="#3d4eae" />
          <circle cx="14.2" cy="9.6" r="1.4" fill="rgba(255,255,255,0.85)" />
        </svg>
      </span>
    </span>
  );
}
