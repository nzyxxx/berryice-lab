import { HomeChannels } from "@/components/preview/home-channels";
import { HomeFeed } from "@/components/preview/home-feed";
import { Magnetic, Tilt } from "@/components/lab/motion-play";
import type { HomeUpdate } from "@/lib/content/home-feed";
import { profileConfig } from "@/lib/site-config";
import Link from "next/link";

// 1246×1661 按 640×853 静帧的身体占比补了透明边，人物像素没有缩放。
// 带扩展名的静态图不走首页的 no-store，所以换新文件名，不覆盖已缓存的 hi。
const PORTRAIT = {
  src: "/characters/xiaomei/idle-candd-24-still-hi2.webp",
  width: 1246,
  height: 1661,
} as const;

/** 首页：小莓全身静帧和人名是一幅构图，最新动态靠在旁边。 */
export function MediaGallery({ updates }: { updates: readonly HomeUpdate[] }) {
  return (
    <main id="main" className="relative mx-auto w-full min-w-0 max-w-6xl flex-1 px-5 pb-8 sm:px-6">
      <div
        aria-hidden
        className="hero-wash pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(ellipse_at_top_left,color-mix(in_srgb,var(--lab-primary)_28%,transparent),transparent_62%)]"
      />
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-end gap-x-4 gap-y-6 pt-4 lg:grid-cols-12 lg:items-start lg:gap-x-10 lg:pt-10">
        <figure className="col-start-1 row-start-1 lg:col-span-4 lg:row-span-2">
          <Link
            href="/dafeiyu?character=xiaomei"
            aria-label="小莓的房间"
            className="block w-fit rounded-md outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
          >
            <Tilt>
              {/* 定稿静帧，保持原比例。 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={PORTRAIT.src}
                alt="小莓"
                width={PORTRAIT.width}
                height={PORTRAIT.height}
                decoding="async"
                fetchPriority="low"
                className="portrait-still h-auto max-h-72 w-auto object-contain sm:max-h-80 lg:max-h-[68vh] lg:w-full lg:max-w-full"
              />
            </Tilt>
          </Link>
        </figure>

        <div className="col-start-2 row-start-1 min-w-0 self-center lg:col-span-8 lg:col-start-5 lg:self-start">
          <p className="text-[11px] tracking-[0.18em] text-lab-primary">{profileConfig.latinName}</p>
          <h1 className="mt-2 text-display-hero max-[420px]:text-[1.7rem] max-[420px]:leading-tight">{profileConfig.displayName}</h1>
          <p className="mt-3 text-sm text-lab-ink-muted">{profileConfig.tags.join(" · ")}</p>
          <Magnetic className="mt-4">
            <Link
              href="/dafeiyu?character=xiaomei"
              className="btn-shimmer inline-flex min-h-11 items-center rounded-full border border-lab-primary/35 bg-lab-primary/12 px-4 text-sm text-lab-primary outline-none transition-colors duration-200 ease-out hover:bg-lab-primary/18 focus-visible:ring-2 focus-visible:ring-lab-primary"
            >
              进小莓的房间
            </Link>
          </Magnetic>
        </div>

        <HomeFeed updates={updates} className="col-span-2 lg:col-span-8 lg:col-start-5" />
      </div>
      <HomeChannels />
    </main>
  );
}
