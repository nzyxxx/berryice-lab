import { cn } from "@/lib/utils";

const DOTS = (() => {
  const steps = 18;
  const dots: { x: number; y: number; r: number }[] = [];
  for (let y = 0; y < steps; y += 1) {
    for (let x = 0; x < steps; x += 1) {
      const u = (x + 0.5) / steps - 0.5;
      const v = (y + 0.5) / steps - 0.5;
      const dist = Math.hypot(u, v);
      if (dist > 0.46) continue;
      const shade = Math.max(0, 1 - dist / 0.46);
      dots.push({
        x: (x + 0.5) * (64 / steps),
        y: (y + 0.5) * (64 / steps),
        r: 0.55 + shade * 0.7,
      });
    }
  }
  return dots;
})();

/** 静止的网点。不再跟鼠标推开，避免每帧改上百个圆点。 */
export function HalftoneMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn("size-24 shrink-0 text-lab-primary sm:size-40", className)}>
      {DOTS.map((dot) => (
        <circle key={`${dot.x}-${dot.y}`} cx={dot.x} cy={dot.y} r={dot.r} fill="currentColor" />
      ))}
    </svg>
  );
}
