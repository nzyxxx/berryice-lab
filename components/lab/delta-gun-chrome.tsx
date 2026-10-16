"use client";

import { FluidField } from "@/components/delta-gun/fluid-field";
import { DeltaSubNav } from "@/components/lab/delta-subnav";
import { SiteHeader } from "@/components/lab/site-header";
import { SiteShell } from "@/components/lab/site-shell";
import type { ReactNode } from "react";

export function DeltaGunChrome({ children }: { children: ReactNode }) {
  return (
    <SiteShell>
      <FluidField />
      <SiteHeader backHref="/" backLabel="首页" />
      <DeltaSubNav />
      <div className="relative z-[1]">{children}</div>
    </SiteShell>
  );
}
