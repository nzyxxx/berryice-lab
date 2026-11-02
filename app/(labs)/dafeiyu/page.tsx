import { DafeiyuStage } from "@/components/dafeiyu/dafeiyu-stage";
import { SiteHeader } from "@/components/lab/site-header";
import { SiteShell } from "@/components/lab/site-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "大肥鱼",
  description: "浏览器里的 dsh-pet 大肥鱼。拖、点、甩。不是小莓。",
};

export default function DafeiyuPage() {
  return (
    <SiteShell>
      <SiteHeader backHref="/" backLabel="首页" />
      <main id="main" className="flex min-h-0 flex-1 flex-col">
        <header className="mx-auto w-full max-w-6xl px-4 pb-3 pt-6 sm:px-6">
          <p className="font-mono text-[11px] tracking-[0.28em] text-lab-ink-subtle">LAB · DSH-PET 0.4.0</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-lab-ink sm:text-5xl">大肥鱼</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-lab-ink-subtle sm:text-base">
            这是上游桌宠在浏览器里的体验，宽屏按官方 462 像素。拖它、甩出去、点一下，右键可以点播动作，也可以让它睡觉。它自己会呼吸，有空就走两步。
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-lab-ink-subtle">
            碎碎念、对话和余额要 DeepSeek Harness，这个页面不接。形象不是小莓，也不是 DeepSeek 官方。Safari 会把透明底画成黑块。
          </p>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <a
              className="inline-flex min-h-11 items-center text-lab-ink underline-offset-4 hover:underline"
              href="https://github.com/PC2005-cloud/dsh-pet"
              rel="noreferrer"
              target="_blank"
            >
              PC2005-cloud/dsh-pet
            </a>
            <a className="inline-flex min-h-11 items-center text-lab-ink underline-offset-4 hover:underline" href="/dafeiyu/NOTICE.txt">
              署名与许可
            </a>
          </p>
        </header>
        <DafeiyuStage />
      </main>
    </SiteShell>
  );
}
