import { SectionZone } from "@/components/gallery/section-zone";
import { GlassTile } from "@/components/gallery/glass-tile";
import { PageContainer } from "@/components/lab/page-container";
import { Headphones, ExternalLink } from "lucide-react";
import Link from "next/link";
import { nowListening, playlists } from "@/lib/content/music";
import { cn } from "@/lib/utils";

export default function MusicPage() {
  return (
    <PageContainer>
      <SectionZone
        index="01"
        label="Brief"
        title="音乐"
        description="正在听。"
      />

      <SectionZone index="02" label="Now" className="mt-12">
        <div className="grid grid-cols-1 gap-2">
          {nowListening.map((track, index) => (
            <Link
              key={track.id}
              href={track.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md",
                "transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
              )}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[13px] font-semibold text-lab-ink-subtle">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-[15px] font-medium text-lab-ink">
                    {track.title}
                  </span>
                  <ExternalLink className="size-3.5 shrink-0 text-lab-ink-tertiary opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
                <span className="mt-0.5 block truncate text-sm text-lab-ink-subtle">
                  {track.artist} {track.album ? `· ${track.album}` : ""}
                </span>
              </span>
              <span className="hidden shrink-0 text-xs text-lab-ink-tertiary sm:block">
                {track.mood}
              </span>
            </Link>
          ))}
        </div>
      </SectionZone>

      <SectionZone index="03" label="Lists" className="mt-12">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {playlists.map((playlist, index) => (
            <GlassTile
              key={playlist.title}
              href={playlist.href}
              title={playlist.title}
              description={`${playlist.count} 首`}
              icon={<Headphones className="size-5" />}
              delay={index * 0.08}
            />
          ))}
        </div>
      </SectionZone>
    </PageContainer>
  );
}
