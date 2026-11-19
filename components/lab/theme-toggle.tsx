"use client";

import { useTheme } from "@/components/lab/theme-provider";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "切换到浅色主题" : "切换到深色主题"}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-md text-lab-ink-subtle",
        "transition-transform duration-200 hover:text-lab-ink active:translate-y-px active:scale-95",
        "motion-reduce:transition-none motion-reduce:active:translate-y-0 motion-reduce:active:scale-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary",
        className
      )}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
