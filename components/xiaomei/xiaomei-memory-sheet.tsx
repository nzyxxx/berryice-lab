"use client";

import { trapTab } from "@/components/xiaomei/trap-tab";
import { xiaomeiWhisperClass } from "@/components/xiaomei/xiaomei-surface";
import type { XiaomeiMemoryNote } from "@/lib/xiaomei-memory";
import { xiaomeiPopoverOffsetStyle } from "@/lib/xiaomei-place";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

const KIND_LABEL: Record<XiaomeiMemoryNote["kind"], string> = {
  nickname: "称呼",
  preference: "偏好",
  event: "事情",
  emotion: "心情",
};

function noteDayLabel(at: number | undefined): string | null {
  if (typeof at !== "number" || !Number.isFinite(at)) return null;
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function NoteList({
  notes,
  onForget,
}: {
  notes: readonly XiaomeiMemoryNote[];
  onForget: (summary: string) => void;
}) {
  return (
    <ul className="space-y-1">
      {notes.map((note) => {
        const day = noteDayLabel(note.at);
        return (
          <li key={note.summary} className="flex items-center gap-2 rounded-xl px-1 py-0.5">
            <div className="min-w-0 flex-1">
              <p className="break-words text-[13px] leading-relaxed text-lab-ink">{note.summary}</p>
              <p className="text-[11px] leading-4 text-lab-ink-subtle">
                {KIND_LABEL[note.kind]}
                {day ? ` · ${day}` : ""}
              </p>
            </div>
            <button
              type="button"
              aria-label={`忘记这条：${note.summary}`}
              onClick={() => onForget(note.summary)}
              className="h-11 shrink-0 rounded-full border border-white/15 bg-white/[0.06] px-3 text-sm text-lab-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40"
            >
              忘记
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * 只读。列出这台浏览器里的永久事实和最近的事，一次只能忘掉一条。
 * 不写账号，也不在这里改句子。
 */
export function XiaomeiMemorySheet({
  facts,
  events,
  align,
  placement,
  shiftX = 0,
  shiftY = 0,
  maxHeight,
  onForget,
  onClose,
}: {
  facts: readonly XiaomeiMemoryNote[];
  events: readonly XiaomeiMemoryNote[];
  align: "left" | "right";
  placement: "up" | "down";
  shiftX?: number;
  shiftY?: number;
  maxHeight?: number;
  onForget: (summary: string) => void;
  onClose: () => void;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const empty = facts.length === 0 && events.length === 0;

  useEffect(() => {
    const root = sectionRef.current;
    closeRef.current?.focus({ preventScroll: true });
    if (!root) return;
    const onKey = (event: KeyboardEvent) => trapTab(event, root);
    root.addEventListener("keydown", onKey);
    return () => root.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="xiaomei-memory"
      role="dialog"
      aria-modal="true"
      aria-labelledby="xiaomei-memory-title"
      className={cn(
        xiaomeiWhisperClass("overflow-y-auto backdrop-blur-md"),
        "absolute z-10 flex w-[min(17.5rem,calc(100vw-2rem))] flex-col rounded-2xl p-3",
        "max-h-[min(22rem,calc(100dvh-8rem))]",
        align === "right" ? "right-0" : "left-0",
        placement === "up" ? "bottom-full mb-2" : "top-full mt-2",
      )}
      style={xiaomeiPopoverOffsetStyle(shiftX, shiftY, maxHeight)}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p id="xiaomei-memory-title" className="text-[13px] text-lab-ink">
            她记住了什么
          </p>
          <p className="text-[11px] leading-4 text-lab-ink-subtle">只在这台浏览器里</p>
        </div>
        <button
          ref={closeRef}
          type="button"
          aria-label="收起她记住的"
          onClick={onClose}
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-lab-ink-subtle hover:text-lab-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40"
        >
          <X className="size-4" />
        </button>
      </div>

      {empty ? (
        <p className="pb-2 text-[13px] leading-relaxed text-lab-ink-subtle">还没记住什么。跟她说说话就好。</p>
      ) : (
        <div className="space-y-3 pb-1">
          {facts.length > 0 ? (
            <div>
              <p className="px-1 pb-1 text-[11px] text-lab-ink-subtle">一直记得</p>
              <NoteList notes={facts} onForget={onForget} />
            </div>
          ) : null}
          {events.length > 0 ? (
            <div>
              <p className="px-1 pb-1 text-[11px] text-lab-ink-subtle">最近的事</p>
              <NoteList notes={events} onForget={onForget} />
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
