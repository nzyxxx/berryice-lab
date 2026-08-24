"use client";

import { useTheme } from "@/components/lab/theme-provider";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "切换到浅色主题" : "切换到深色主题"}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-lg border border-lab-hairline bg-lab-surface-1/80 text-lab-ink-subtle backdrop-blur-md",
        "transition-[border-color,background-color,color] duration-200",
        "hover:border-lab-primary/35 hover:bg-lab-surface-2 hover:text-lab-ink",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/30",
        className
      )}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
