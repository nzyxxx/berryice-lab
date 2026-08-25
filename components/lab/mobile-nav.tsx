"use client";

import { moduleLinks } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const NAV_ITEMS = [
  { href: "/", title: "门户", description: "回到入口" },
  ...moduleLinks.map((m) => ({
    href: m.href,
    title: m.title,
    description: m.description,
  })),
];

/**
 * 移动端跨模块导航。抽屉必须 portal 到 body：
 * 顶栏带 backdrop-blur，会给 position:fixed 的后代创建包含块，
 * 直接挂在顶栏里的话抽屉会相对顶栏定位而不是视口。
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  // 路由变了就关掉，否则跳转后抽屉还盖在新页面上
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      triggerRef.current?.focus();
    };
  }, [open]);

  const drawer = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] md:hidden"
          initial={reduceMotion ? undefined : { opacity: 0 }}
          animate={reduceMotion ? undefined : { opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            aria-label="关闭导航"
            className="absolute inset-0 h-full w-full cursor-default bg-lab-canvas/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="站点导航"
            tabIndex={-1}
            className={cn(
              "absolute inset-x-3 top-3 rounded-3xl border border-white/12 p-3 outline-none",
              "bg-lab-canvas/92 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
            )}
            initial={reduceMotion ? undefined : { opacity: 0, y: -12 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between px-2 pb-2 pt-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-lab-primary">
                Navigate
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="关闭导航"
                className="flex size-11 items-center justify-center rounded-full text-lab-ink-subtle transition-colors hover:bg-white/8 hover:text-lab-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-[3.25rem] flex-col justify-center rounded-2xl px-4 py-2.5",
                      "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40",
                      active
                        ? "bg-lab-primary/12 text-lab-primary"
                        : "text-lab-ink hover:bg-white/6"
                    )}
                  >
                    <span className="text-[15px] font-medium tracking-tight">{item.title}</span>
                    <span className="mt-0.5 text-xs text-lab-ink-subtle">{item.description}</span>
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="打开导航"
        aria-expanded={open}
        className={cn(
          "flex size-11 items-center justify-center rounded-full text-lab-ink-subtle md:hidden",
          "transition-colors hover:bg-white/8 hover:text-lab-ink",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40"
        )}
      >
        <Menu className="size-5" />
      </button>
      {mounted ? createPortal(drawer, document.body) : null}
    </>
  );
}
