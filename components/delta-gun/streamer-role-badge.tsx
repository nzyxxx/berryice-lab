import { cn } from "@/lib/utils";

/** 原站标签自由度较高，只给常见几种定色，其余走中性样式 */
const ROLE_STYLES: { pattern: RegExp; className: string }[] = [
  { pattern: /职业选手/, className: "border-amber-500/35 bg-amber-500/10 text-amber-300" },
  { pattern: /主播/, className: "border-lab-accent-glow/35 bg-lab-accent-glow/10 text-lab-accent-glow" },
  { pattern: /UP主/, className: "border-lab-primary/35 bg-lab-primary/10 text-lab-primary" },
  { pattern: /手游/, className: "border-emerald-500/35 bg-emerald-500/10 text-emerald-300" },
];

export function StreamerRoleBadge({ role }: { role: string }) {
  const matched = ROLE_STYLES.find(({ pattern }) => pattern.test(role));

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
        matched?.className ?? "border-lab-hairline bg-lab-surface-2 text-lab-ink-tertiary"
      )}
    >
      {role}
    </span>
  );
}
