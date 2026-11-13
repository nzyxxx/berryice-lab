/**
 * 壳层控件。高度 44px，主次只靠填充和字色，不靠另一套玻璃。
 * 链接继续用 <a> / <Link>，这里只给真正的按钮。
 */
const focus =
  "outline-none focus-visible:ring-2 focus-visible:ring-lab-primary disabled:pointer-events-none disabled:opacity-40";

export const controlClass = {
  primary: `inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-lab-ink px-4 text-sm font-medium text-lab-canvas transition-colors hover:bg-lab-ink/88 active:translate-y-px ${focus}`,
  secondary: `inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-lab-hairline bg-transparent px-4 text-sm font-medium text-lab-ink transition-colors hover:border-lab-ink/30 active:translate-y-px ${focus}`,
  quiet: `inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-md px-2 text-sm text-lab-ink-subtle transition-colors hover:text-lab-ink active:translate-y-px ${focus}`,
  danger: `inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-md px-2 text-sm text-lab-ink-subtle transition-colors hover:text-red-300 active:translate-y-px focus-visible:ring-red-300/70 ${focus}`,
} as const;

export const fieldClass =
  "min-h-11 w-full rounded-xl border border-lab-hairline bg-transparent px-3 text-[15px] text-lab-ink outline-none focus-visible:ring-2 focus-visible:ring-lab-primary disabled:opacity-40";
