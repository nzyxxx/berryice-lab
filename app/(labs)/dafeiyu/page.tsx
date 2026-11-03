import { DafeiyuStage } from "@/components/dafeiyu/dafeiyu-stage";
import { SiteHeader } from "@/components/lab/site-header";
import { SiteShell } from "@/components/lab/site-shell";
import { xiaomeiPackReadyFromJson } from "@/lib/dafeiyu/xiaomei-pack";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";

function labXiaomeiReady(): boolean {
  try {
    const raw = readFileSync(path.join(process.cwd(), "public/characters/xiaomei/manifest.json"), "utf8");
    return xiaomeiPackReadyFromJson(raw);
  } catch {
    return false;
  }
}

export const metadata: Metadata = {
  title: "大肥鱼",
  description: "浏览器里的 dsh-pet 大肥鱼。",
};

export default function DafeiyuPage() {
  return (
    <SiteShell>
      <SiteHeader backHref="/" backLabel="首页" />
      <main id="main" className="flex min-h-0 flex-1 flex-col">
        <header className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 pb-2 pt-6 sm:px-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1">
            <h1 className="text-display-section">大肥鱼</h1>
            <p className="font-mono text-[11px] tracking-[0.18em] text-lab-ink-subtle">LAB · DSH-PET 0.4.0</p>
          </div>
          <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-lab-ink-muted">
            <a
              className="inline-flex min-h-11 items-center underline-offset-4 transition-colors hover:text-lab-ink hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lab-primary"
              href="https://github.com/PC2005-cloud/dsh-pet"
              rel="noreferrer"
              target="_blank"
            >
              PC2005-cloud/dsh-pet
            </a>
            <a
              className="inline-flex min-h-11 items-center underline-offset-4 transition-colors hover:text-lab-ink hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lab-primary"
              href="/dafeiyu/NOTICE.txt"
            >
              署名与许可
            </a>
          </p>
        </header>
        <DafeiyuStage xiaomeiReady={labXiaomeiReady()} />
      </main>
    </SiteShell>
  );
}
