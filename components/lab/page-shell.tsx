import { SiteHeader } from "@/components/lab/site-header";
import { SiteShell } from "@/components/lab/site-shell";
import type { ReactNode } from "react";

export function PageShell({
  children,
  backHref = "/",
  backLabel = "门户",
}: {
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <SiteShell>
      <SiteHeader backHref={backHref} backLabel={backLabel} />
      {children}
    </SiteShell>
  );
}
