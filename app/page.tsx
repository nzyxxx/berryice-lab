import { LinkInBio } from "@/components/lab/link-in-bio";
import { SiteHeader } from "@/components/lab/site-header";
import { SiteShell } from "@/components/lab/site-shell";

export default function HomePage() {
  return (
    <SiteShell>
      <SiteHeader minimal />
      <LinkInBio />
    </SiteShell>
  );
}
