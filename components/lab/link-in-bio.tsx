"use client";

import { ModuleTile } from "@/components/gallery/module-tile";
import { SectionZone } from "@/components/gallery/section-zone";
import { ProfileIdentity } from "@/components/lab/profile-identity";
import { moduleLinks, socialLinks } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export function LinkInBio() {
  const kook = socialLinks.find((s) => s.id === "kook");

  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-[40rem] flex-1 flex-col gap-10 px-5 py-12 sm:px-6"
    >
      <SectionZone index="01" label="Identity">
        <ProfileIdentity />
      </SectionZone>

      <SectionZone index="02" label="Modules" className="mt-2">
        {/*
          三角洲占满整行，另外两块并排。
          五个等大瓦片的时候，唯一有完整主路径的模块跟占位页一样大，
          进站的人看不出该先点哪个。
        */}
        <div className="grid grid-cols-1 gap-3 [perspective:900px] sm:grid-cols-2">
          {moduleLinks.map((module, index) => (
            <ModuleTile
              key={module.id}
              id={module.id}
              delay={index * 0.06}
              className={module.featured ? "sm:col-span-2" : undefined}
            />
          ))}
        </div>
      </SectionZone>

      <SectionZone index="03" label="Presence" className="mt-2">
        {kook && (
          <div className="flex justify-center">
            <Link
              href={kook.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "group inline-flex items-center gap-2 rounded-full border border-[#fb7185]/30 bg-[#fb7185]/10 px-4 py-2.5 text-sm font-medium text-lab-ink backdrop-blur-md",
                "transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-[#fb7185]/15 hover:border-[#fb7185]/45"
              )}
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#fb7185] opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-[#fb7185]" />
              </span>
              {kook.label}
              <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        )}
      </SectionZone>
    </main>
  );
}
