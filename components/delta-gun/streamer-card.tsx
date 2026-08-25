import { GlassRainSurface } from "@/components/atmosphere/glass-rain-surface";
import { StreamerAvatar } from "@/components/delta-gun/streamer-avatar";
import { StreamerRoleBadge } from "@/components/delta-gun/streamer-role-badge";
import type { StoredStreamer } from "@/lib/types/streamer";
import { ArrowUpRight, Crosshair, Layers } from "lucide-react";
import Link from "next/link";

export function StreamerCard({ streamer }: { streamer: StoredStreamer }) {
  return (
    <Link
      href={`/delta-gun/streamers/${encodeURIComponent(streamer.slug)}`}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-lab-hairline bg-lab-surface-1 p-4 transition-colors hover:border-lab-primary/35 hover:bg-lab-surface-2"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 size-28 rounded-full opacity-15 blur-2xl transition-opacity group-hover:opacity-25"
        style={{ backgroundColor: streamer.accentColor }}
      />

      <GlassRainSurface intensity={0.45} />

      <div className="relative flex items-start gap-3">
        <StreamerAvatar initial={streamer.avatarInitial} accentColor={streamer.accentColor} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-medium tracking-tight text-lab-ink transition-colors group-hover:text-lab-primary">
            {streamer.name}
          </h3>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {streamer.roles.map((role) => (
              <StreamerRoleBadge key={role} role={role} />
            ))}
          </div>
        </div>
        <ArrowUpRight className="size-4 shrink-0 text-lab-ink-tertiary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-lab-primary" />
      </div>

      {streamer.signatureWeapon ? (
        <p className="relative mt-3 inline-flex items-center gap-1.5 text-sm text-lab-ink-subtle">
          <Crosshair className="size-3.5 shrink-0 text-lab-primary" />
          <span className="truncate">{streamer.signatureWeapon}</span>
        </p>
      ) : null}

      {streamer.bio ? (
        <p className="relative mt-2 line-clamp-2 text-xs leading-relaxed text-lab-ink-tertiary">
          {streamer.bio}
        </p>
      ) : null}

      <p className="relative mt-4 inline-flex items-center gap-1.5 border-t border-lab-hairline/70 pt-3 text-xs text-lab-ink-subtle">
        <Layers className="size-3.5 text-lab-ink-tertiary" />
        {streamer.loadoutCount} 套方案
      </p>
    </Link>
  );
}
