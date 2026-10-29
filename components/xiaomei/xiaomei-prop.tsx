/**
 * 杯子、点心、伞还没有独立立绘，先用小 SVG 叠在现有围裙半身像上。
 * TODO(prop-art): 有正式道具帧之后，换成 public/xiaomei 里的切片，删掉这三枚 SVG。
 */

import type { XiaomeiPropKind } from "@/lib/xiaomei-actions";

/** 只画道具，不改脸、不记状态。 */
export function XiaomeiProp({ kind }: { kind: XiaomeiPropKind }) {
  if (kind === "cup") {
    return (
      <span className="xiaomei-prop xiaomei-prop-cup" aria-hidden>
        <svg viewBox="0 0 32 32" width="18" height="18">
          <path
            d="M9.5 8.5h11.2l-1.15 13.4a3.1 3.1 0 0 1-3.1 2.8h-2.7a3.1 3.1 0 0 1-3.1-2.8L9.5 8.5z"
            fill="rgba(255,255,255,0.62)"
            stroke="rgba(255,255,255,0.92)"
            strokeWidth="1.3"
          />
          <path
            d="M11 14.2h8.4l-.55 6.6a2.1 2.1 0 0 1-2.1 1.9h-3.1a2.1 2.1 0 0 1-2.1-1.9l-.55-6.6z"
            fill="#8ebfff"
          />
          <path d="M12.2 10.1h2.4" stroke="rgba(255,255,255,0.95)" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </span>
    );
  }

  if (kind === "umbrella") {
    return (
      <span className="xiaomei-prop xiaomei-prop-umbrella" aria-hidden>
        <svg viewBox="0 0 32 32" width="26" height="26">
          <path
            d="M4 15.5c0-6.4 5.4-11 12-11s12 4.6 12 11H4z"
            fill="#7ea2ff"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="1.2"
          />
          <path d="M16 5.2v10.2" stroke="rgba(255,255,255,0.85)" strokeWidth="1.1" />
          <path d="M16 15.4v8.2" stroke="#24305f" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M16 23.6c1.8 0 2.6 1.5 2.6 2.4 0 .7-.6 1.1-1.3 1.1-1 0-1.6-.8-1.3-1.8" fill="none" stroke="#24305f" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </span>
    );
  }

  return (
    <span className="xiaomei-prop xiaomei-prop-snack" aria-hidden>
      <svg viewBox="0 0 32 32" width="18" height="18">
        <ellipse cx="16" cy="20.5" rx="9" ry="6.2" fill="#e7b888" />
        <ellipse cx="16" cy="18.6" rx="9" ry="5" fill="#f6d3a6" />
        <circle cx="16" cy="12.2" r="3.1" fill="#3d4eae" />
        <circle cx="14.9" cy="11.2" r="0.8" fill="rgba(255,255,255,0.75)" />
      </svg>
    </span>
  );
}
