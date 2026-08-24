import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function SiteFooter({ className }: { className?: string }) {
  const { name, icpNumber, icpUrl, policeNumber, policeUrl, copyrightYear } = siteConfig;

  return (
    <footer
      className={cn(
        "relative z-10 border-t border-lab-hairline bg-lab-canvas/90 backdrop-blur-md",
        className
      )}
    >
      <div className="mx-auto max-w-6xl px-6 py-8">
        <p className="text-center text-xs leading-relaxed text-lab-ink-subtle sm:text-sm">
          © {copyrightYear} {name} All Rights Reserved.{" "}
          {icpNumber ? (
            <Link
              href={icpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-lab-primary"
            >
              {icpNumber}
            </Link>
          ) : null}
          {icpNumber && policeNumber ? (
            <span className="mx-1.5 text-lab-ink-tertiary">·</span>
          ) : null}
          {policeNumber ? (
            <Link
              href={policeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:text-lab-primary"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://www.beian.gov.cn/img/ghs.png"
                alt=""
                className="inline size-3.5 shrink-0"
              />
              {policeNumber}
            </Link>
          ) : null}
        </p>
      </div>
    </footer>
  );
}
