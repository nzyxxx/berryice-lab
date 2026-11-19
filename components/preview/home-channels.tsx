"use client";

import { glassSurfaceClass } from "@/components/uiverse/glass-surface";
import { spotMove, useStagger } from "@/components/lab/motion-play";
import { homeChannels, type HomeChannelId } from "@/lib/content/home-channels";
import { Gamepad2, Library, ListMusic, PenLine, Sticker, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

const ICONS: Record<HomeChannelId, LucideIcon> = {
  wiki: Library,
  games: Gamepad2,
  music: ListMusic,
  stickers: Sticker,
  about: UserRound,
  writing: PenLine,
};

/**
 * 六栏是同一块玻璃索引。静止时标题是正文色。
 * 悬停和键盘焦点让图标、标题、说明、底线一起变，并轻轻抬起来。
 * 聚光只跟精细指针。游戏这一格在悬停时沿边走一圈细光。
 */
export function HomeChannels() {
  const list = useRef<HTMLUListElement>(null);
  useStagger(list);

  return (
    <nav id="channels" aria-label="栏目" className="mt-12 border-t border-lab-hairline pt-6 md:mt-16">
      <ul ref={list} className="grid grid-cols-2 items-stretch gap-3 md:grid-cols-3 lg:grid-cols-6">
        {homeChannels.map((channel, index) => {
          const Icon = ICONS[channel.id];
          return (
            <li
              key={channel.id}
              data-stagger=""
              style={{ animationDelay: `${index * 50}ms` }}
              className="stagger-item min-w-0"
            >
              <Link
                href={channel.href}
                onPointerMove={spotMove}
                className={glassSurfaceClass(
                  "channel-card group flex h-44 min-w-0 flex-col gap-3 rounded-2xl p-3 text-lab-ink-subtle outline-none transition-[transform,box-shadow] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-lab-primary motion-reduce:transition-none"
                )}
              >
                {channel.id === "games" ? <span aria-hidden className="channel-beam" /> : null}
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
                  <span className="channel-desc mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-inherit opacity-80">
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
