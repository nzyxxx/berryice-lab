"use client";

import {
  CommunityCodeCard,
  CommunityCodeCardSkeleton,
  type CommunityCodeItem,
} from "@/components/delta-gun/community-code-card";
import { MotionStagger, MotionStaggerItem } from "@/components/lab/motion-reveal";
import { Button } from "@/components/ui/button";
import { GameModeTabs } from "@/components/delta-gun/game-mode-tabs";
import type { GameMode } from "@/lib/delta-gun/game-modes";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function CommunityCodesPreview({ limit = 6 }: { limit?: number }) {
  const [items, setItems] = useState<CommunityCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState<GameMode>("烽火");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/gun-codes?limit=${limit}&game=${encodeURIComponent(activeGame)}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (json.ok) setItems(json.data ?? []);
        else setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [limit, activeGame]);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <GameModeTabs value={activeGame} onChange={setActiveGame} className="mb-4" />

      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CommunityCodeCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-lab-hairline py-12 text-center">
          <p className="text-lab-ink-subtle">
            暂无「{activeGame === "烽火" ? "烽火地带" : "大战场"}」改枪码数据
          </p>
          <Button asChild className="mt-4 bg-lab-primary text-lab-canvas hover:bg-lab-primary-hover">
            <Link href="/delta-gun/community">去同步改枪码</Link>
          </Button>
        </div>
      ) : (
        <MotionStagger className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {items.map((item) => (
            <MotionStaggerItem key={`${item.weapon}-${item.fullCode}`}>
              <CommunityCodeCard item={item} onCopy={(c) => void copyCode(c)} />
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      )}

      <div className="mt-6 flex justify-center">
        <Button
          asChild
          variant="outline"
          className={cn("rounded-md border-lab-hairline bg-lab-surface-1")}
        >
          <Link href={`/delta-gun/community?mode=${encodeURIComponent(activeGame)}`}>
            查看全部{activeGame === "烽火" ? "烽火地带" : "大战场"}改枪码
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </div>
    </>
  );
}
