import { HomeFront } from "@/components/lab/home-front";
import { SiteHeader } from "@/components/lab/site-header";
import { SiteShell } from "@/components/lab/site-shell";
import { siteDescription, siteTitle } from "@/lib/site-config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: siteTitle },
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    title: siteTitle,
    description: siteDescription,
  },
};

export default function HomePage() {
  return (
    <SiteShell>
      <SiteHeader />
      <HomeFront />
    </SiteShell>
  );
}
