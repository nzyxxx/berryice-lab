"use client";

import { trapTab } from "@/components/xiaomei/trap-tab";
import { xiaomeiWhisperClass } from "@/components/xiaomei/xiaomei-surface";
import { XIAOMEI_CATCHPHRASE, XIAOMEI_CHAT_EMPTY, XIAOMEI_CHAT_STARTERS, XIAOMEI_NAME } from "@/lib/xiaomei-lines";
import { xiaomeiPopoverOffsetStyle } from "@/lib/xiaomei-place";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type SheetMessage = { role: "user" | "assistant"; content: string; failed?: boolean };

/**
 * 只负责把对话画出来。发送锁在 useXiaomeiChat 里，这里 pending 时拒绝再提交。
 * Enter 走表单提交；组字中的 Enter 不送出。
 */
export function XiaomeiChatSheet({
  messages,
  pending,
  sceneLine,
  align,
  placement,
  maxHeight,
  shiftX = 0,
  shiftY = 0,
  onSend,
  onRetry,
  onClose,
}: {
  messages: SheetMessage[];
  pending: boolean;
  sceneLine: string | null;
  align: "left" | "right";
  placement: "up" | "down";
  maxHeight: number;
  shiftX?: number;
  shiftY?: number;
  onSend: (text: string) => Promise<boolean>;
  onRetry: () => Promise<boolean>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sending = useRef(false);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, pending, sceneLine]);

  useEffect(() => {
    const root = sectionRef.current;
    inputRef.current?.focus({ preventScroll: true });
    if (!root) return;
    const onKey = (event: KeyboardEvent) => trapTab(event, root);
    root.addEventListener("keydown", onKey);
    return () => root.removeEventListener("keydown", onKey);
  }, []);

  const submit = async () => {
    const text = draft.trim();
    if (!text || pending || sending.current) return;
    sending.current = true;
    const accepted = await onSend(text);
    sending.current = false;
    if (accepted) setDraft("");
  };

  const lastFailed = messages.length > 0 && messages[messages.length - 1]?.failed === true;

  return (
    <section
      ref={sectionRef}
      id="xiaomei-chat"
      role="dialog"
      aria-modal="true"
      aria-labelledby="xiaomei-chat-title"
      className={cn(
        xiaomeiWhisperClass("backdrop-blur-md"),
        "absolute z-10 flex w-[min(17.5rem,calc(100vw-2rem))] flex-col rounded-2xl p-3",
        align === "right" ? "right-0" : "left-0",
        placement === "up" ? "bottom-full mb-2" : "top-full mt-2",
      )}
      style={xiaomeiPopoverOffsetStyle(shiftX, shiftY, maxHeight)}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <p id="xiaomei-chat-title" className="text-xs tracking-tight text-lab-ink-subtle">
          {XIAOMEI_NAME}
        </p>
        <button
          type="button"
          aria-label="收起对话"
          onClick={onClose}
          className="flex size-11 items-center justify-center rounded-full text-lab-ink-subtle hover:text-lab-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40"
        >
          <X className="size-4" />
        </button>
      </div>

      <div
        ref={scroller}
        className="min-h-16 flex-1 space-y-2 overflow-y-auto pr-1"
        role="log"
        aria-live="polite"
        aria-busy={pending}
        aria-relevant="additions"
      >
        {messages.length === 0 ? (
          <div className="space-y-2">
            <p className="text-[13px] leading-relaxed text-lab-ink">{XIAOMEI_CATCHPHRASE}</p>
            <p className="text-[12px] leading-relaxed text-lab-ink-subtle">{XIAOMEI_CHAT_EMPTY}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {XIAOMEI_CHAT_STARTERS.map((starter) => (
                <button
                  key={starter.text}
                  type="button"
                  disabled={pending}
                  onClick={() => void onSend(starter.text)}
                  className="min-h-11 rounded-full border border-white/15 bg-white/[0.06] px-3 text-left text-[13px] text-lab-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40 disabled:opacity-50"
                >
                  {starter.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const mine = message.role === "user";
            const showThinking = pending && !mine && !message.content && index === messages.length - 1;
            const streaming = pending && !mine && Boolean(message.content) && index === messages.length - 1;
            return (
              <div key={`${message.role}-${index}`}>
                <p
                  className={cn(
                    "max-w-full rounded-2xl px-3 py-1.5 text-[13px] leading-relaxed",
                    mine ? "ml-6 bg-white/10 text-lab-ink" : "mr-4 text-lab-ink",
                  )}
                >
                  {showThinking ? sceneLine || "嗯……" : message.content}
                  {streaming ? <span className="xiaomei-caret" aria-hidden /> : null}
                </p>
                {message.failed && lastFailed && !pending ? (
                  <button
                    type="button"
                    onClick={() => void onRetry()}
                    className="mt-1 h-11 rounded-full border border-white/15 bg-white/[0.06] px-3 text-sm text-lab-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40"
                  >
                    再说一遍
                  </button>
                ) : null}
              </div>
            );
          })
        )}
        {sceneLine && !pending ? <p className="text-[12px] leading-relaxed text-lab-ink-subtle">{sceneLine}</p> : null}
      </div>

      <form
        className="mt-2 flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <input
          ref={inputRef}
          value={draft}
          maxLength={400}
          enterKeyHint="send"
          autoComplete="off"
          placeholder="想说就说嘛"
          disabled={pending}
          aria-label={`对${XIAOMEI_NAME}说`}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && event.nativeEvent.isComposing) event.preventDefault();
          }}
          className="h-11 min-w-0 flex-1 rounded-full border border-white/15 bg-lab-canvas/40 px-3 text-base text-lab-ink outline-none placeholder:text-lab-ink-tertiary focus-visible:ring-2 focus-visible:ring-lab-primary/40 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={pending || draft.trim().length === 0}
          className="h-11 shrink-0 rounded-full border border-white/15 bg-white/[0.08] px-3 text-sm text-lab-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40 disabled:opacity-50"
        >
          发送
        </button>
      </form>
    </section>
  );
}
