"use client";

import { Suspense, useEffect, useState } from "react";
import { WeaponPortrait } from "@/components/delta-gun/weapon-portrait";
import { Eyebrow } from "@/components/lab/eyebrow";
import { MotionReveal } from "@/components/lab/motion-reveal";
import { Panel } from "@/components/lab/module-card";
import { PageContainer } from "@/components/lab/page-container";
import { Button } from "@/components/ui/button";
import { useGunStore } from "@/lib/store/gunStore";
import type { Gun } from "@/lib/types/gun";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, BarChart3, Check, Copy, Save, X } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

function GunLoadoutContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params?.id;
  const {
    selectedAttachments,
    addAttachment,
    removeAttachment,
    saveLoadout,
    pendingImport,
    setPendingImport,
  } = useGunStore();
  const [copied, setCopied] = useState(false);
  const [gun, setGun] = useState<Gun | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const res = await fetch("/api/weapons", { cache: "no-store" });
        const json = await res.json();
        if (json.ok) {
          const found = (json.data as Gun[]).find((g) => g.id === id);
          setGun(found ?? null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    const code = searchParams.get("code");
    const weapon = searchParams.get("weapon");
    if (code) {
      setPendingImport({
        fullCode: code,
        weapon: weapon ?? gun?.name ?? "",
      });
    }
  }, [searchParams, gun?.name, setPendingImport]);

  if (loading) {
    return (
      <PageContainer>
        <p className="text-lab-ink-subtle">加载改枪台…</p>
      </PageContainer>
    );
  }

  if (!gun) {
    return (
      <PageContainer>
        <p className="text-center text-lab-ink-subtle">枪械不存在</p>
        <Button asChild variant="ghost" className="mx-auto mt-4">
          <Link href="/delta-gun/guns">返回枪械库</Link>
        </Button>
      </PageContainer>
    );
  }

  const availableAttachments = [
    { id: "suppressor", name: "消音器", type: "muzzle" as const },
    { id: "red-dot", name: "红点瞄准镜", type: "sight" as const },
    { id: "extended-mag", name: "扩容弹夹", type: "magazine" as const },
    { id: "vertical-grip", name: "垂直握把", type: "grip" as const },
  ];

  const handleCopyLoadout = async () => {
    const attachmentText =
      selectedAttachments.length > 0
        ? selectedAttachments.map((a) => a.name).join(" + ")
        : "无";
    const codeLine = pendingImport?.fullCode
      ? `社区枪码：${pendingImport.fullCode}\n`
      : "";
    const loadoutText = `${codeLine}${gun.name} 配置\n配件：${attachmentText}`;

    try {
      await navigator.clipboard.writeText(loadoutText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("复制失败:", error);
    }
  };

  const copyImportCode = async () => {
    if (!pendingImport?.fullCode) return;
    try {
      await navigator.clipboard.writeText(pendingImport.fullCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <PageContainer>
      <MotionReveal>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link
            href="/delta-gun/guns"
            className="inline-flex items-center text-sm text-lab-ink-subtle hover:text-lab-primary"
          >
            <ArrowLeft className="mr-1.5 size-4" />
            枪械库
          </Link>
          <span className="text-lab-ink-tertiary">/</span>
          <Link
            href={`/delta-gun/guns/${gun.id}`}
            className="inline-flex items-center text-sm text-lab-ink-subtle hover:text-lab-primary"
          >
            <BarChart3 className="mr-1.5 size-4" />
            {gun.name} 数据
          </Link>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <WeaponPortrait
            name={gun.name}
            type={gun.type}
            imageUrl={gun.imageUrl}
            size="lg"
            className="!size-24"
          />
          <div>
            <Eyebrow>改枪台</Eyebrow>
            <h1 className="text-display-section mt-2 text-lab-ink">{gun.name}</h1>
            <p className="mt-2 text-lg text-lab-ink-subtle">{gun.description}</p>
          </div>
        </div>
      </MotionReveal>

      <AnimatePresence>
        {pendingImport && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-8 overflow-hidden"
          >
            <Panel className="border-lab-primary/30 bg-lab-primary/5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-lab-primary">已从社区导入枪码</p>
                  <p className="mt-1 text-xs text-lab-ink-subtle">
                    来源：{pendingImport.weapon || "社区方案"}
                  </p>
                  <p className="mt-3 break-all rounded-md border border-lab-hairline bg-lab-canvas px-3 py-2 font-mono text-sm text-lab-ink">
                    {pendingImport.fullCode}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-lab-hairline"
                    onClick={() => void copyImportCode()}
                  >
                    {copied ? <Check className="mr-1 size-4" /> : <Copy className="mr-1 size-4" />}
                    复制枪码
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-lab-ink-subtle"
                    onClick={() => setPendingImport(null)}
                  >
                    <X className="mr-1 size-4" />
                    清除
                  </Button>
                </div>
              </div>
              <p className="mt-3 text-xs text-lab-ink-tertiary">
                将枪码粘贴到游戏内改枪界面；下方可继续搭配本地配件并保存为我的枪码。
              </p>
            </Panel>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel>
          <h3 className="text-lg font-medium text-lab-ink">
            当前配置
            <span className="ml-2 text-sm font-normal text-lab-ink-subtle">
              {selectedAttachments.length}/6
            </span>
          </h3>
          <div className="mt-5 flex min-h-[72px] flex-wrap gap-2">
            {selectedAttachments.length === 0 ? (
              <p className="text-sm text-lab-ink-tertiary">从右侧选择配件</p>
            ) : (
              selectedAttachments.map((att) => (
                <span
                  key={att.id}
                  className="inline-flex items-center gap-2 rounded-md border border-lab-hairline bg-lab-surface-2 px-3 py-1.5 text-sm"
                >
                  {att.name}
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="text-lab-ink-tertiary hover:text-lab-error"
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1 bg-lab-primary text-lab-canvas hover:bg-lab-primary-hover"
              onClick={() => {
                const name = prompt("请输入枪码名称", `${gun.name} 配置`);
                if (name) saveLoadout(name, gun.name);
              }}
            >
              <Save className="mr-2 size-4" />
              保存到我的枪码
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-lab-hairline bg-lab-canvas"
              onClick={() => void handleCopyLoadout()}
            >
              {copied ? <Check className="mr-2 size-4" /> : <Copy className="mr-2 size-4" />}
              复制配置
            </Button>
          </div>
        </Panel>

        <Panel>
          <h3 className="text-lg font-medium text-lab-ink">可更换配件</h3>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {availableAttachments.map((att) => (
              <button
                key={att.id}
                type="button"
                onClick={() => addAttachment(att)}
                className={cn(
                  "rounded-lg border border-lab-hairline bg-lab-surface-2 p-4 text-left transition-colors",
                  "hover:border-lab-primary/30 hover:bg-lab-surface-3"
                )}
              >
                <p className="font-medium text-lab-ink">{att.name}</p>
                <p className="mt-1 text-xs text-lab-ink-tertiary">{att.type}</p>
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </PageContainer>
  );
}

export default function GunLoadoutPage() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <p className="text-lab-ink-subtle">加载改枪台…</p>
        </PageContainer>
      }
    >
      <GunLoadoutContent />
    </Suspense>
  );
}
