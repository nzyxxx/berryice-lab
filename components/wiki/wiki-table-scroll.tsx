"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { useRef } from "react";

/** 只有这一个区域横向滚动。方向键在它获得焦点时移动表格，不带动正文。 */
export function WikiTableScroll({ children }: { children: ReactNode }) {
  const scroller = useRef<HTMLDivElement>(null);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    scroller.current?.scrollBy({ left: event.key === "ArrowRight" ? 96 : -96 });
  }

  return (
    <figure className="min-w-0 max-w-full">
      <figcaption className="mb-2 text-xs leading-relaxed text-lab-ink-subtle">
        表格可以比这一栏宽。左右滑动，或点一下表格后用方向键查看。
      </figcaption>
      <div
        ref={scroller}
        tabIndex={0}
        role="region"
        aria-label="可横向滚动的表格"
        onKeyDown={onKeyDown}
        className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
      >
        {children}
      </div>
    </figure>
  );
}
