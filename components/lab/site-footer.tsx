import { profileConfig, siteConfig, socialLinks } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function SiteFooter({ className }: { className?: string }) {
  const { icpNumber, icpUrl, policeNumber, policeUrl, copyrightYear } = siteConfig;

  return (
    <footer className={cn("relative z-10 border-t border-lab-hairline", className)}>
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-xs leading-relaxed text-lab-ink-subtle">
          © {copyrightYear} {profileConfig.displayName}
        </p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-relaxed text-lab-ink-subtle">
          {socialLinks.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className="inline-flex min-h-11 items-center outline-none hover:text-lab-ink focus-visible:ring-2 focus-visible:ring-lab-primary"
            >
              {item.label}
            </a>
          ))}
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
              className="inline-flex min-h-11 items-center outline-none hover:text-lab-ink focus-visible:ring-2 focus-visible:ring-lab-primary"
            >
              {policeNumber}
            </Link>
          ) : null}
        </p>
      </div>
    </footer>
  );
}
