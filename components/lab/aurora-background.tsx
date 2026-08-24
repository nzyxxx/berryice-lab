import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { cn } from "@/lib/utils";

type AuroraVariant = "hub" | "delta";

export function AuroraBackground({ variant = "hub" }: { variant?: AuroraVariant }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {/* 基底 */}
      <div className="absolute inset-0 bg-lab-canvas" />

      {/* 极光层 — Codex / Vercel 风流动渐变 */}
      <div
        className={cn(
          "absolute -inset-[40%] animate-aurora-drift opacity-30 mix-blend-multiply dark:opacity-70 dark:mix-blend-screen",
          variant === "hub" ? "aurora-hub" : "aurora-delta"
        )}
      />

      {variant === "hub" ? (
        <BackgroundBeams className="opacity-70 dark:opacity-90" />
      ) : (
        <div className="absolute inset-0 bg-grid-fade opacity-[0.45] animate-grid-pan" />
      )}

      {/* 顶部聚光 */}
      <div className="absolute inset-x-0 top-0 h-[55vh] bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(56,189,248,0.18),transparent)]" />

      {/* 噪点质感 */}
      <div className="absolute inset-0 opacity-[0.035] bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')]" />

      {/* 暗角 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--color-lab-canvas)_72%)]" />
    </div>
  );
}
