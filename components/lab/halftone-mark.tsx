import { cn } from "@/lib/utils";

/**
 * 首页唯一的色块：网点圆，不画吉祥物。
 * 点的位置是算死的，没有随机，也没有逐帧动画。
 */
const DOTS = (() => {
  const steps = 22;
  const dots: { x: number; y: number; r: number }[] = [];

  for (let y = 0; y < steps; y += 1) {
    for (let x = 0; x < steps; x += 1) {
      const u = (x + 0.5) / steps - 0.5;
      const v = (y + 0.5) / steps - 0.5;
      const dist = Math.hypot(u, v);
      if (dist > 0.48) continue;

      const shade = Math.max(0, (1 - dist / 0.48) * 0.9 + (-u * 0.55 - v * 0.28));
      const radius = 0.42 + shade * 1.05;
      dots.push({
        x: (x + 0.5) * (64 / steps),
        y: (y + 0.5) * (64 / steps),
        r: Math.min(radius, 1.55),
      });
    }
  }

  return dots;
})();

export function HalftoneMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden
      className={cn("size-16 shrink-0 text-lab-primary sm:size-20", className)}
    >
      {DOTS.map((dot) => (
        <circle key={`${dot.x}-${dot.y}`} cx={dot.x} cy={dot.y} r={dot.r} fill="currentColor" />
      ))}
    </svg>
  );
}
