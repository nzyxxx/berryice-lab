"use client";

import { GlowPanel } from "@/components/aura/glow-panel";
import { WeightHover } from "@/components/originkit/weight-hover";
import BlurText from "@/components/BlurText";
import ShinyText from "@/components/ShinyText";
import { glassSurfaceClass } from "@/components/uiverse/glass-surface";
import { profileConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function ProfileIdentity() {
  const { displayName, handle, tags, bio, avatarSrc, avatarInitials } = profileConfig;

  return (
    <GlowPanel>
      <div className="flex flex-col items-center text-center">
        <div className="relative size-24">
          <div
            aria-hidden
            className="absolute -inset-[3px] rounded-full bg-gradient-to-br from-lab-primary via-lab-accent-glow to-lab-primary opacity-80"
          />
          <div
            className={cn(
              glassSurfaceClass(),
              "relative flex size-24 items-center justify-center overflow-hidden rounded-full"
            )}
          >
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarSrc}
                alt={`${displayName} 的头像`}
                className="size-full object-cover"
              />
            ) : (
              <span className="text-[2rem] font-semibold tracking-tight text-lab-ink">
                {avatarInitials}
              </span>
            )}
          </div>
          <span className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-lab-canvas/90 px-2.5 py-1 text-[10px] text-lab-ink-subtle backdrop-blur-md">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
            </span>
            online
          </span>
        </div>

        <BlurText
          text={displayName}
          animateBy="letters"
          delay={40}
          stepDuration={0.22}
          className="mt-6 justify-center text-[1.75rem] font-semibold tracking-[-0.02em] text-lab-ink md:text-[2rem]"
        />
        <p className="mt-1 text-sm">
          <ShinyText text="@" color="var(--lab-primary)" shineColor="#f4f6fb" speed={2.4} />
          <WeightHover text={handle} className="text-lab-primary" />
        </p>

        <ul className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-lab-ink-subtle"
            >
              {tag}
            </li>
          ))}
        </ul>

        <p className="mt-4 max-w-[20rem] text-sm leading-relaxed text-lab-ink-subtle md:max-w-sm md:text-[15px]">
          {bio}
        </p>
      </div>
    </GlowPanel>
  );
}
