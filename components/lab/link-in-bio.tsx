"use client";

import ClickSpark from "@/components/ClickSpark";
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
      <ClickSpark>
        <SectionZone index="01" label="Identity">
          <ProfileIdentity />
        </SectionZone>

        <SectionZone index="02" label="Modules" className="mt-2">
          <div className="grid grid-cols-1 gap-3 [perspective:900px] sm:grid-cols-2">
            {moduleLinks.map((module, index) => {
              // 奇数个模块时，最后一块保持同样宽度但居中，避免孤零零挂在左半列
              const isLonelyLast =
                moduleLinks.length % 2 === 1 && index === moduleLinks.length - 1;

              return (
                <ModuleTile
                  key={module.id}
                  id={module.id}
                  delay={index * 0.06}
                  className={
                    isLonelyLast
                      ? "sm:col-span-2 sm:mx-auto sm:w-[calc(50%-0.375rem)]"
                      : undefined
                  }
                />
              );
            })}
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
      </ClickSpark>
    </main>
  );
}
