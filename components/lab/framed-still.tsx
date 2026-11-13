"use client";

import { useId, useRef, useState } from "react";

/**
 * 一张已知尺寸的静图。平时懒加载；点开才放大。
 * 断了就留一句，不换别的图。
 */
export function FramedStill({
  src,
  alt,
  width,
  height,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
}) {
  const [broken, setBroken] = useState(false);
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const close = () => {
    dialogRef.current?.close();
  };

  if (broken) {
    return (
      <p className="flex min-h-28 items-center text-sm leading-relaxed text-lab-ink-subtle">
        这张图没有加载出来。
      </p>
    );
  }

  return (
    <figure>
      <button
        ref={triggerRef}
        type="button"
        className="block w-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
        onClick={() => {
          const dialog = dialogRef.current;
          if (!dialog || dialog.open) return;
          setOpen(true);
          dialog.showModal();
        }}
      >
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          className="h-auto max-h-44 w-full rounded-2xl object-contain"
          onError={() => setBroken(true)}
        />
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-auto w-[min(100%-2rem,56rem)] max-h-[90vh] overflow-auto rounded-2xl border border-lab-hairline bg-lab-canvas p-4 text-lab-ink outline-none backdrop:bg-black/70 focus-visible:ring-2 focus-visible:ring-lab-primary"
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          event.currentTarget.close();
        }}
        onClose={() => {
          setOpen(false);
          triggerRef.current?.focus();
        }}
      >
        <p id={titleId} className="text-sm leading-relaxed text-lab-ink-muted">
          {alt}
        </p>
        {open ? (
          <img
            src={src}
            alt=""
            width={width}
            height={height}
            className="mt-3 h-auto max-h-[70vh] w-full object-contain"
          />
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <a
            href={src}
            className="inline-flex min-h-11 items-center text-sm text-lab-primary outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
          >
            打开原图
          </a>
          <button
            type="button"
            onClick={close}
            className="inline-flex min-h-11 items-center text-sm text-lab-ink-subtle outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
          >
            关闭
          </button>
        </div>
      </dialog>
    </figure>
  );
}
