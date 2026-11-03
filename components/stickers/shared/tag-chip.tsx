import { cn } from "@/lib/utils";

export function TagChip({
  label,
  active,
  onToggle,
  disabled,
  count,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
  count?: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-[13px] transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40",
        "disabled:pointer-events-none disabled:opacity-45",
        active
          ? "border-lab-accent-glow/45 bg-lab-accent-glow/14 text-lab-ink"
          : "border-white/10 bg-white/[0.03] text-lab-ink-subtle hover:border-white/20 hover:text-lab-ink"
      )}
    >
      {label}
      {count !== undefined ? <span className="font-mono text-[11px] text-lab-ink-tertiary">{count}</span> : null}
    </button>
  );
}
