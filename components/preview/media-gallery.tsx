import { HomeChannels } from "@/components/preview/home-channels";
import { HomeFeed } from "@/components/preview/home-feed";
import type { HomeUpdate } from "@/lib/content/home-feed";
import { profileConfig } from "@/lib/site-config";
import Link from "next/link";

const PORTRAIT = {
  src: "/characters/xiaomei/idle-candd-24-still-matte.webp",
  width: 640,
  height: 853,
} as const;

/** 首页：小莓全身静帧和人名是一幅构图，最新动态靠在旁边。 */
export function MediaGallery({ updates }: { updates: readonly HomeUpdate[] }) {
  return (
    <main id="main" className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-5 pb-8 sm:px-6">
      <div className="grid grid-cols-1 items-start gap-x-10 gap-y-6 pt-4 lg:grid-cols-12 lg:pt-10">
        <div className="lg:col-span-7 lg:col-start-6 lg:row-start-1">
          <p className="text-[11px] tracking-[0.18em] text-lab-primary">{profileConfig.latinName}</p>
          <h1 className="mt-2 text-display-hero">{profileConfig.displayName}</h1>
          <p className="mt-3 text-sm text-lab-ink-muted">{profileConfig.tags.join(" · ")}</p>
        </div>

        <figure className="lg:col-span-5 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <Link
            href="/dafeiyu?character=xiaomei"
            aria-label="小莓的房间"
            className="mx-auto block w-full max-w-[20rem] rounded-md outline-none focus-visible:ring-2 focus-visible:ring-lab-primary lg:mx-0 lg:max-w-none"
          >
            <img
              src={PORTRAIT.src}
              alt="小莓"
              width={PORTRAIT.width}
              height={PORTRAIT.height}
              decoding="async"
              fetchPriority="low"
              className="h-auto w-full object-contain lg:max-h-[62vh] lg:w-auto"
            />
          </Link>
        </figure>

        <HomeFeed updates={updates} />
      </div>
      <HomeChannels />
    </main>
  );
}
