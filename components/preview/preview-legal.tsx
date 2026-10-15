import { siteConfig } from "@/lib/site-config";
import Link from "next/link";

export function PreviewLegal() {
  const { name, icpNumber, icpUrl, copyrightYear } = siteConfig;

  return (
    <footer className="mt-16 border-t border-lab-hairline px-5 py-8 sm:px-6">
      <p className="mx-auto max-w-5xl text-xs leading-relaxed text-lab-ink-subtle">
        © {copyrightYear} {name}
        {icpNumber ? (
          <>
            {" · "}
            <Link href={icpUrl} target="_blank" rel="noopener noreferrer" className="hover:text-lab-ink">
              {icpNumber}
            </Link>
          </>
        ) : null}
      </p>
    </footer>
  );
}
