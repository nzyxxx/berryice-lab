import { cn } from "@/lib/utils";

/** 表情工坊里所有按钮的外形：44px 起步的药丸，跟写作页的 CTA 同一套。 */
export function pillClass(variant: "primary" | "secondary" | "ghost" = "secondary", className?: string) {
  return cn(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium",
    "transition-[background-color,border-color,color,transform] duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40",
    "disabled:pointer-events-none disabled:opacity-45",
    variant === "primary" &&
      "border border-lab-primary/40 bg-lab-primary/14 text-lab-primary hover:-translate-y-0.5 hover:bg-lab-primary/22",
    variant === "secondary" &&
      "border border-white/12 bg-white/5 text-lab-ink hover:-translate-y-0.5 hover:border-lab-accent-glow/35 hover:bg-white/10",
    variant === "ghost" && "px-3 text-lab-ink-subtle hover:text-lab-ink",
    className
  );
}
