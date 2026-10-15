import { CommunityCodesPreview } from "@/components/delta-gun/community-codes-preview";
import { DELTA_NAV } from "@/lib/delta-gun/navigation";
import { CURRENT_SEASON } from "@/lib/delta-gun/season";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

const SPANS = [
  "md:col-span-7 md:row-span-2 min-h-64",
  "md:col-span-5",
  "md:col-span-5",
  "md:col-span-4",
  "md:col-span-4",
  "md:col-span-4",
];

export default function DeltaGunLabPage() {
  const missions = DELTA_NAV.filter((item) => item.href !== "/delta-gun");

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <header className="mb-8">
        <p className="font-mono text-[11px] tracking-[0.28em] text-lab-ink-subtle">DELTA · {CURRENT_SEASON}</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight text-lab-ink sm:text-6xl">改枪实验室</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-lab-ink-subtle">
          本季的枪、码和排行。过季方案默认不出现。
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        {missions.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex min-h-36 flex-col justify-between rounded-3xl border border-lab-hairline bg-lab-surface-1/75 p-6 transition duration-200 hover:-translate-y-0.5 hover:border-lab-primary/35 hover:bg-lab-surface-2 ${SPANS[index] ?? ""}`}
          >
            <span className="flex items-center justify-between text-lab-ink-subtle">
              <item.icon className="size-5" />
              <ArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
            <span>
              <span className="block text-2xl font-medium tracking-tight text-lab-ink">{item.label}</span>
              <span className="mt-1 block text-sm text-lab-ink-subtle">{item.description}</span>
            </span>
          </Link>
        ))}
      </div>

      <section className="mt-14">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-medium tracking-tight text-lab-ink">本季热门</h2>
          <Link href="/delta-gun/community" className="inline-flex min-h-11 items-center text-sm text-lab-ink-subtle">
            全部枪码
          </Link>
        </div>
        <CommunityCodesPreview limit={4} />
      </section>
    </main>
  );
}
