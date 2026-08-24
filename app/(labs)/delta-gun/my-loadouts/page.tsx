'use client';

import { MotionReveal, MotionStagger, MotionStaggerItem } from "@/components/lab/motion-reveal";
import { PageContainer } from "@/components/lab/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGunStore } from "@/lib/store/gunStore";
import { Bookmark, ChevronRight, Trash2, Users } from "lucide-react";
import Link from "next/link";

export default function MyLoadoutsPage() {
  const { savedLoadouts, deleteLoadout } = useGunStore();

  return (
    <PageContainer>
      <MotionReveal>
        <h1 className="text-display-section text-lab-ink">我的枪码</h1>
        <p className="mt-3 max-w-lg text-base text-lab-ink-subtle">
          在改枪台保存的配置会出现在这里。社区热门方案请前往
          <Link href="/delta-gun/community" className="mx-1 text-lab-primary hover:underline">
            社区改枪码
          </Link>
          浏览与导入。
        </p>
      </MotionReveal>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild className="rounded-md bg-lab-primary text-lab-canvas hover:bg-lab-primary-hover">
          <Link href="/delta-gun/guns">
            去改枪台
            <ChevronRight className="ml-1 size-4" />
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="rounded-md border-lab-hairline bg-lab-surface-1"
        >
          <Link href="/delta-gun/community">
            <Users className="mr-2 size-4" />
            社区改枪码
          </Link>
        </Button>
      </div>

      <section className="mt-12">
        <div className="mb-6 flex items-center gap-2 text-sm text-lab-ink-subtle">
          <Bookmark className="size-4 text-lab-primary" />
          已保存 {savedLoadouts.length} 个配置
        </div>

        {savedLoadouts.length === 0 ? (
          <Card className="border-dashed border-lab-hairline bg-lab-surface-1">
            <CardContent className="flex flex-col items-center py-16 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-lg border border-lab-hairline bg-lab-surface-2 text-3xl">
                🎯
              </div>
              <p className="text-lg font-medium text-lab-ink">还没有本地枪码</p>
              <p className="mt-2 max-w-sm text-sm text-lab-ink-subtle">
                在枪械库选枪并搭配配件后点击保存；或从社区一键导入方案
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button asChild className="bg-lab-primary hover:bg-lab-primary-hover">
                  <Link href="/delta-gun/guns">枪械库</Link>
                </Button>
                <Button asChild variant="outline" className="border-lab-hairline">
                  <Link href="/delta-gun/community">社区改枪码</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <MotionStagger className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {savedLoadouts.map((loadout) => (
              <MotionStaggerItem key={loadout.id}>
                <Card className="border-lab-hairline bg-lab-surface-1 transition-colors hover:border-lab-hairline-strong hover:bg-lab-surface-2">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg text-lab-ink">{loadout.name}</CardTitle>
                        <p className="mt-1 text-sm font-medium text-lab-primary">
                          {loadout.gunName}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteLoadout(loadout.id)}
                        className="rounded-md p-2 text-lab-ink-tertiary hover:bg-lab-error/10 hover:text-lab-error"
                        aria-label="删除"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5">
                      {loadout.attachments.map((att) => (
                        <Badge
                          key={att.id}
                          variant="secondary"
                          className="rounded-md border-lab-hairline bg-lab-surface-2 text-lab-ink-muted"
                        >
                          {att.name}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-4 text-xs text-lab-ink-tertiary">
                      {new Date(loadout.createdAt).toLocaleString("zh-CN")}
                    </p>
                  </CardContent>
                </Card>
              </MotionStaggerItem>
            ))}
          </MotionStagger>
        )}
      </section>
    </PageContainer>
  );
}
