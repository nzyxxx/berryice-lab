"use client";

import { controlClass } from "@/components/lab/control";
import { writePageLink } from "@/lib/wiki/share-link";
import { useState } from "react";

/**
 * 只把当前页的地址交给系统分享面板，或复制到剪贴板。
 * 不代发消息，不附带文件。
 */
export function WikiShare({ title }: { title: string }) {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");

  const locked = () => pending;

  const share = async () => {
    if (locked()) return;
    if (typeof navigator.share !== "function") {
      setStatus("这台浏览器没有系统分享，可以用旁边的复制");
      return;
    }
    setPending(true);
    try {
      await navigator.share({ title, url: window.location.href });
      setStatus("已打开系统分享");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus("已取消");
        return;
      }
      setStatus("系统分享没有打开");
    } finally {
      setPending(false);
    }
  };

  const copy = async () => {
    if (locked()) return;
    setPending(true);
    const result = await writePageLink(window.location.href, (value) =>
      navigator.clipboard.writeText(value)
    );
    setStatus(result === "copied" ? "链接已复制" : "没有复制成。地址就在浏览器栏里");
    setPending(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={share}
          disabled={pending}
          className={controlClass.quiet}
        >
          分享
        </button>
        <button
          type="button"
          onClick={copy}
          disabled={pending}
          className={controlClass.quiet}
        >
          复制链接
        </button>
      </div>
      <p
        className={`min-h-5 text-xs ${status.startsWith("已") || status.startsWith("链接") ? "text-lab-primary" : "text-lab-ink-subtle"}`}
        role="status"
        aria-live="polite"
      >
        {status}
      </p>
    </div>
  );
}
