import { StreamerAvatar } from "@/components/delta-gun/streamer-avatar";
import { StreamerLoadouts } from "@/components/delta-gun/streamer-loadouts";
import { StreamerRoleBadge } from "@/components/delta-gun/streamer-role-badge";
import { MotionReveal } from "@/components/lab/motion-reveal";
import { PageContainer } from "@/components/lab/page-container";
import {
  ensureStreamerTables,
  getStreamerBySlug,
  listStreamerLoadouts,
} from "@/lib/repositories/streamersRepo";
import type { StoredStreamer, StoredStreamerLoadout } from "@/lib/types/streamer";
import { ArrowLeft, Crosshair, Layers, Smartphone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

async function loadStreamer(
  slug: string
): Promise<{ streamer: StoredStreamer | null; loadouts: StoredStreamerLoadout[] }> {
  try {
    await ensureStreamerTables();
    const streamer = await getStreamerBySlug(slug);
    if (!streamer) return { streamer: null, loadouts: [] };
    return { streamer, loadouts: await listStreamerLoadouts(slug) };
  } catch (error) {
    console.error("加载主播详情失败:", error);
    return { streamer: null, loadouts: [] };
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { streamer } = await loadStreamer(decodeURIComponent(slug));
  if (!streamer) return { title: "主播不存在" };

  return {
    title: `${streamer.name} 的改枪码 · 三角洲`,
    description: streamer.bio || `${streamer.name} 的三角洲行动改枪方案。`,
  };
}

export default async function StreamerDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const { streamer, loadouts } = await loadStreamer(decodeURIComponent(slug));
  if (!streamer) notFound();

  return (
    <PageContainer>
      <MotionReveal>
        <Link
          href="/delta-gun/streamers"
          className="mb-6 inline-flex items-center text-sm text-lab-ink-subtle hover:text-lab-primary"
        >
          <ArrowLeft className="mr-1.5 size-4" />
          返回主播列表
        </Link>

        <div className="relative overflow-hidden rounded-lg border border-lab-hairline bg-lab-surface-1 p-6 sm:p-8">
          <span
            aria-hidden
            className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: streamer.accentColor }}
          />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <StreamerAvatar
              initial={streamer.avatarInitial}
              accentColor={streamer.accentColor}
              size="lg"
            />

            <div className="min-w-0 flex-1">
              <h1 className="text-display-section text-lab-ink">{streamer.name}</h1>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {streamer.roles.map((role) => (
                  <StreamerRoleBadge key={role} role={role} />
                ))}
              </div>
              {streamer.bio ? (
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-lab-ink-subtle">
                  {streamer.bio}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-lab-ink-subtle">
                {streamer.signatureWeapon ? (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-lab-hairline bg-lab-canvas/60 px-2.5 py-1">
                    <Crosshair className="size-3.5 text-lab-primary" />
                    代表武器 {streamer.signatureWeapon}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5 rounded-md border border-lab-hairline bg-lab-canvas/60 px-2.5 py-1">
                  <Layers className="size-3.5 text-lab-ink-tertiary" />
                  {loadouts.length} 套方案
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-lab-hairline bg-lab-canvas/60 px-2.5 py-1">
                  <Smartphone className="size-3.5 text-lab-ink-tertiary" />
                  {streamer.platform === "mobile" ? "手游" : "端游"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </MotionReveal>

      <div className="mt-8">
        <StreamerLoadouts loadouts={loadouts} />
      </div>

      <p className="mt-6 text-center text-xs text-lab-ink-tertiary">
        方案来自 yunmaku.com · 点击武器名可导入改枪台
      </p>
    </PageContainer>
  );
}
