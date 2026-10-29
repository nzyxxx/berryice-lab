/**
 * 眨眼、哈欠、伸懒腰、音符、欢呼、叹气。只画在现有脸上，不换立绘。
 */

import type { XiaomeiCueKind } from "@/lib/xiaomei-actions";

/** 只画这一拍的记号，不记状态。 */
export function XiaomeiCue({ kind }: { kind: XiaomeiCueKind }) {
  if (kind === "blink") {
    return (
      <span className="xiaomei-cue xiaomei-cue-blink" aria-hidden>
        <span />
        <span />
      </span>
    );
  }

  if (kind === "yawn") {
    return (
      <span className="xiaomei-cue xiaomei-cue-yawn" aria-hidden>
        <span />
      </span>
    );
  }

  if (kind === "stretch") {
    return (
      <span className="xiaomei-cue xiaomei-cue-stretch" aria-hidden>
        <svg viewBox="0 0 64 40" width="100%" height="100%">
          <path d="M32 36c-2-10-10-18-22-22" fill="none" stroke="#f4f7ff" strokeWidth="4" strokeLinecap="round" />
          <path d="M32 36c2-10 10-18 22-22" fill="none" stroke="#f4f7ff" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </span>
    );
  }

  if (kind === "note") {
    return (
      <span className="xiaomei-cue xiaomei-cue-note" aria-hidden>
        <svg viewBox="0 0 32 32" width="100%" height="100%">
          <path d="M12 24V8l14-3v16" fill="none" stroke="rgba(232,236,246,0.72)" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="9" cy="24" r="2.4" fill="rgba(158,176,214,0.8)" />
          <circle cx="23" cy="21" r="2.4" fill="rgba(158,176,214,0.8)" />
        </svg>
      </span>
    );
  }

  if (kind === "cheer") {
    return (
      <span className="xiaomei-cue xiaomei-cue-cheer" aria-hidden>
        <span />
        <span />
      </span>
    );
  }

  return (
    <span className="xiaomei-cue xiaomei-cue-sigh" aria-hidden>
      <span />
    </span>
  );
}
