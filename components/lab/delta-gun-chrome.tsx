"use client";

import { FluidField } from "@/components/delta-gun/fluid-field";
import { DeltaSubNav } from "@/components/lab/delta-subnav";
import { SiteHeader } from "@/components/lab/site-header";
import { SiteShell } from "@/components/lab/site-shell";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function DeltaGunChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const dashboard = pathname === "/delta-gun" || pathname === "/delta-gun/guns";
  if (dashboard) {
    return (
      <SiteShell hideFooter className="bg-[#0b0b0c]">
        <div className="relative z-[1] bg-[#0b0b0c]">{children}</div>
      </SiteShell>
    );
  }
  return (
    <SiteShell>
      <FluidField />
      <SiteHeader backHref="/" backLabel="首页" />
      <DeltaSubNav />
      <div className="relative z-[1]">{children}</div>
    </SiteShell>
  );
}
