"use client";

import { headerNav, moduleLinks, navIsCurrent } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

function subscribeToNothing() {
  return () => {};
}

function useIsClient() {
  return useSyncExternalStore(subscribeToNothing, () => true, () => false);
}

const delta = moduleLinks.find((item) => item.id === "delta");

/**
 * 抽屉必须 portal 到 body。顶栏的 backdrop-filter 会让 fixed 后代相对顶栏定位。
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const mounted = useIsClient();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [pathWhenClosed, setPathWhenClosed] = useState(pathname);

  if (pathname !== pathWhenClosed) {
    setPathWhenClosed(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const items = panel ? [...panel.querySelectorAll<HTMLElement>("a, button")] : [];
    items[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [open]);

  const linkClass = (active: boolean, nested = false) =>
    cn(
      "flex min-h-11 items-center rounded-md text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-lab-primary",
      nested ? "pl-8 pr-3 text-sm" : "px-3",
      active ? "text-lab-primary" : "text-lab-ink hover:text-lab-ink"
    );

  const drawer = open ? (
    <div className="fixed inset-0 z-[70] lg:hidden">
      <button
        type="button"
        aria-label="关闭导航"
        className="absolute inset-0 h-full w-full cursor-default bg-lab-canvas/70"
        onClick={() => setOpen(false)}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="站点导航"
        tabIndex={-1}
        className="absolute inset-x-3 top-3 rounded-2xl border border-lab-hairline bg-lab-canvas p-3 outline-none"
      >
        <div className="flex items-center justify-between px-3 pb-1">
          <span className="text-sm text-lab-ink-subtle">菜单</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="关闭导航"
            className="inline-flex size-11 items-center justify-center rounded-md text-lab-ink-subtle outline-none hover:text-lab-ink focus-visible:ring-2 focus-visible:ring-lab-primary"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex flex-col">
          {headerNav.map((item) => {
            const active = navIsCurrent(item.href, pathname);
            return (
              <div key={item.id}>
                <Link href={item.href} aria-current={active ? "page" : undefined} className={linkClass(active)}>
                  {item.title}
                </Link>
                {item.id === "games" && delta ? (
                  <Link
                    href={delta.href}
                    aria-current={pathname.startsWith(delta.href) ? "page" : undefined}
                    className={linkClass(pathname.startsWith(delta.href), true)}
                  >
                    {delta.navLabel ?? delta.title}
                  </Link>
                ) : null}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="打开导航"
        aria-expanded={open}
        className="inline-flex size-11 items-center justify-center rounded-md text-lab-ink-subtle outline-none hover:text-lab-ink focus-visible:ring-2 focus-visible:ring-lab-primary lg:hidden"
      >
        <Menu className="size-5" />
      </button>
      {mounted ? createPortal(drawer, document.body) : null}
    </>
  );
}
