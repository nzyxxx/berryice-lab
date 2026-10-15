import { cn } from "@/lib/utils";
import Link from "next/link";

const LINKS = [
  { href: "/preview/a", id: "a", label: "A 便当" },
  { href: "/preview/b", id: "b", label: "B 编辑" },
  { href: "/preview/c", id: "c", label: "C 画廊" },
  { href: "/", id: "home", label: "当前首页" },
] as const;

export function PreviewSwitch({
  current,
  className,
}: {
  current: "a" | "b" | "c";
  className?: string;
}) {
  return (
    <nav aria-label="设计方向" className={cn("flex flex-wrap items-center gap-x-4 gap-y-1", className)}>
      {LINKS.map((link) => {
        const active = link.id === current;
        return (
          <Link
            key={link.id}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center font-mono text-[11px] uppercase tracking-[0.16em]",
              active ? "text-lab-ink" : "text-lab-ink-subtle hover:text-lab-ink"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
