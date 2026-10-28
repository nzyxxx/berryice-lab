"use client";

import { glassSurfaceClass } from "@/components/uiverse/glass-surface";
import { XIAOMEI_CATCHPHRASE, XIAOMEI_NAME } from "@/lib/xiaomei-lines";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type SheetMessage = { role: "user" | "assistant"; content: string };

/**
 * 只负责把对话画出来。发送锁在 useXiaomeiChat 里，这里 pending 时拒绝再提交。
 */
export function XiaomeiChatSheet({
  messages,
  pending,
  align,
  placement,
  maxHeight,
  onSend,
  onClose,
}: {
  messages: SheetMessage[];
  pending: boolean;
  align: "left" | "right";
  placement: "up" | "down";
  maxHeight: number;
  onSend: (text: string) => Promise<boolean>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const sending = useRef(false);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, pending]);

  const submit = async () => {
    const text = draft.trim();
    if (!text || pending || sending.current) return;
    sending.current = true;
    const accepted = await onSend(text);
    sending.current = false;
    if (accepted) setDraft("");
  };

  return (
    <section
      id="xiaomei-chat"
      aria-label={`和${XIAOMEI_NAME}说话`}
      className={cn(
        glassSurfaceClass(),
        "absolute z-10 flex w-[min(17.5rem,calc(100vw-2rem))] flex-col rounded-2xl p-3",
        align === "right" ? "right-0" : "left-0",
        placement === "up" ? "bottom-full mb-2" : "top-full mt-2",
      )}
      style={{ maxHeight }}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-xs tracking-tight text-lab-ink-subtle">{XIAOMEI_NAME}</p>
        <button
          type="button"
          aria-label="收起对话"
          onClick={onClose}
          className="flex size-11 items-center justify-center rounded-full text-lab-ink-subtle hover:text-lab-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40"
        >
          <X className="size-4" />
        </button>
      </div>

      <div ref={scroller} className="min-h-16 flex-1 space-y-2 overflow-y-auto pr-1" role="log">
        {messages.length === 0 ? (
          <p className="text-[13px] leading-relaxed text-lab-ink">{XIAOMEI_CATCHPHRASE}</p>
        ) : (
          messages.map((message, index) => {
            const mine = message.role === "user";
            const showThinking = pending && !mine && !message.content && index === messages.length - 1;
            return (
              <p
                key={`${message.role}-${index}`}
                className={cn(
                  "max-w-full rounded-2xl px-3 py-1.5 text-[13px] leading-relaxed",
                  mine
                    ? "ml-6 bg-white/10 text-lab-ink"
                    : "mr-4 text-lab-ink",
                )}
              >
                {showThinking ? "……" : message.content}
              </p>
            );
          })
        )}
      </div>

      <form
        className="mt-2 flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <input
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
          className="h-11 min-w-0 flex-1 rounded-full border border-white/15 bg-lab-canvas/40 px-3 text-sm text-lab-ink outline-none placeholder:text-lab-ink-tertiary focus-visible:ring-2 focus-visible:ring-lab-primary/40 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={pending || draft.trim().length === 0}
          className="h-11 shrink-0 rounded-full border border-white/15 bg-white/[0.08] px-3 text-sm text-lab-ink disabled:opacity-50"
        >
          发送
        </button>
      </form>
    </section>
  );
}
