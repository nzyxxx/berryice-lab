import { homeChannels, type HomeChannelId } from "@/lib/content/home-channels";
import { glassSurfaceClass } from "@/components/uiverse/glass-surface";
import { Gamepad2, Library, ListMusic, PenLine, Sticker, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";

const ICONS: Record<HomeChannelId, LucideIcon> = {
  wiki: Library,
  games: Gamepad2,
  music: ListMusic,
  stickers: Sticker,
  about: UserRound,
  writing: PenLine,
};

/**
 * 六栏是同一块玻璃索引。静止时标题是正文色，不是链接蓝。
 * 悬停、按住、键盘焦点让图标、标题、说明和底线一起动。
 * 已访问也停在正文色，避免点过一次就粘成蓝色。
 */
export function HomeChannels() {
  return (
    <nav aria-label="栏目" className="mt-12 border-t border-lab-hairline pt-6 md:mt-16">
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {homeChannels.map((channel) => {
          const Icon = ICONS[channel.id];
          return (
            <li key={channel.id} className="min-w-0">
              <Link
                href={channel.href}
                className={glassSurfaceClass(
                  "channel-card group flex min-h-11 min-w-0 flex-col gap-3 rounded-2xl p-3 text-lab-ink-subtle outline-none transition-transform duration-200 ease-out focus-visible:ring-2 focus-visible:ring-lab-primary"
                )}
              >
                <span className="channel-icon flex items-center justify-between gap-2">
                  <span className="flex size-11 items-center justify-center rounded-xl border border-current/30">
                    <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span aria-hidden className="channel-arrow text-sm transition-transform duration-200 motion-reduce:transition-none">
                    →
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="channel-title block text-[15px] font-medium tracking-tight text-lab-ink visited:text-lab-ink">
                    {channel.title}
                  </span>
                  <span className="channel-desc mt-1 block text-xs leading-relaxed text-inherit opacity-80">
                    {channel.description}
                  </span>
                </span>
                <span aria-hidden className="channel-line mt-auto h-px w-full origin-left scale-x-0 bg-current transition-transform duration-200 motion-reduce:transition-none" />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
