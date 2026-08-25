"use client";

import { DeltaSubNav } from "@/components/lab/delta-subnav";
import { SiteHeader } from "@/components/lab/site-header";
import { SiteShell } from "@/components/lab/site-shell";
import type { ReactNode } from "react";

export function DeltaGunChrome({ children }: { children: ReactNode }) {
  return (
    <SiteShell>
      <SiteHeader backHref="/" backLabel="首页" />
      <DeltaSubNav />
      {children}
    </SiteShell>
  );
}
