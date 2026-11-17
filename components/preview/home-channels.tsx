import { homeChannels, type HomeChannelId } from "@/lib/content/home-channels";
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

/** 六个公开入口同一套尺寸和笔画。游戏用手柄，不用枪。 */
export function HomeChannels() {
  return (
    <nav aria-label="栏目" className="mt-12 border-t border-lab-hairline pt-6 md:mt-16">
      <ul className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-3 lg:grid-cols-6">
        {homeChannels.map((channel) => {
          const Icon = ICONS[channel.id];
          return (
            <li key={channel.id} className="min-w-0">
              <Link
                href={channel.href}
                className="group flex min-h-11 min-w-0 flex-col gap-2 rounded-xl p-1 outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
              >
                <span className="flex size-11 items-center justify-center rounded-xl border border-lab-hairline text-lab-ink-muted transition-colors group-hover:border-lab-primary/40 group-hover:text-lab-primary group-focus-visible:text-lab-primary">
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-medium tracking-tight text-lab-ink group-hover:text-lab-primary">
                    {channel.title}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-lab-ink-subtle">{channel.description}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
