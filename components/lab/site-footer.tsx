import { moduleLinks, profileConfig, siteConfig, socialLinks } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function SiteFooter({ className }: { className?: string }) {
  const { icpNumber, icpUrl, policeNumber, policeUrl, copyrightYear } = siteConfig;

  return (
    <footer className={cn("relative z-10 border-t border-lab-hairline", className)}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <p className="text-[15px] font-medium tracking-tight text-lab-ink">{profileConfig.displayName}</p>
            <p className="mt-1 text-sm leading-relaxed text-lab-ink-subtle">
              {profileConfig.latinName}
              <span className="px-1.5 text-lab-ink-tertiary">·</span>
              {siteConfig.tagline}
            </p>
          </div>
          <nav aria-label="页脚" className="grid grid-cols-2 gap-x-8 sm:grid-cols-3">
            {moduleLinks.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="inline-flex min-h-11 items-center text-sm text-lab-ink-subtle outline-none hover:text-lab-ink focus-visible:ring-2 focus-visible:ring-lab-primary"
              >
                {item.navLabel ?? item.title}
              </Link>
            ))}
            {socialLinks.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className="inline-flex min-h-11 items-center text-sm text-lab-ink-subtle outline-none hover:text-lab-ink focus-visible:ring-2 focus-visible:ring-lab-primary"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="mt-4 flex flex-col gap-2 border-t border-lab-hairline pt-4 text-xs leading-relaxed text-lab-ink-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {copyrightYear} {profileConfig.displayName}
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {icpNumber ? (
              <Link
                href={icpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center outline-none hover:text-lab-ink focus-visible:ring-2 focus-visible:ring-lab-primary"
              >
                {icpNumber}
              </Link>
            ) : null}
            {policeNumber ? (
              <Link
                href={policeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1 outline-none hover:text-lab-ink focus-visible:ring-2 focus-visible:ring-lab-primary"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://www.beian.gov.cn/img/ghs.png" alt="" className="inline size-3.5 shrink-0" />
                {policeNumber}
              </Link>
            ) : null}
          </p>
        </div>
      </div>
    </footer>
  );
}
