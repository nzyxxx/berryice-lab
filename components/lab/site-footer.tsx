import { profileConfig, siteConfig, socialLinks } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import Link from "next/link";

const legalLink =
  "inline-flex min-h-11 items-center gap-1.5 text-lab-ink-subtle outline-none transition-colors hover:text-lab-ink focus-visible:ring-2 focus-visible:ring-lab-primary active:translate-y-px motion-reduce:transition-none";

export function SiteFooter({ className }: { className?: string }) {
  const { icpNumber, icpUrl, policeNumber, policeUrl, copyrightYear, tagline } = siteConfig;

  return (
    <footer className={cn("relative z-10 border-t border-lab-hairline", className)}>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6">
        <div className="max-w-xs">
          <p className="text-[15px] font-medium tracking-tight text-lab-ink">{profileConfig.displayName}</p>
          <p className="mt-1 text-sm leading-relaxed text-lab-ink-subtle">
            {profileConfig.latinName}
            <span className="px-1.5 text-lab-ink-tertiary">·</span>
            {tagline}
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-3 border-t border-lab-hairline pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-lab-ink-subtle">
            © {copyrightYear} {profileConfig.displayName}
          </p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs leading-relaxed">
            {socialLinks.map((item) => (
              <a key={item.id} href={item.href} className={legalLink}>
                {item.label}
              </a>
            ))}
            {icpNumber ? (
              <Link href={icpUrl} target="_blank" rel="noopener noreferrer" className={legalLink}>
                {icpNumber}
              </Link>
            ) : null}
            {policeNumber ? (
              <Link href={policeUrl} target="_blank" rel="noopener noreferrer" className={legalLink}>
                {/* 原图来自 beian.mps.gov.cn/img/ghs.png，20×20，本地托管。编号和登记链接仍用现有配置。 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/beian/ghs.png" alt="" width={20} height={20} className="size-5 shrink-0" />
                {policeNumber}
              </Link>
            ) : null}
          </p>
        </div>
      </div>
    </footer>
  );
}
