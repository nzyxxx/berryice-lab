'use client';

import { Button } from "@/components/ui/button";
import { useGunStore } from "@/lib/store/gunStore";
import { ArrowLeft, Copy, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface CommunityCode {
  id: number;
  game: string;
  weapon: string;
  fullCode: string;
  description: string;
  valueText: string;
  copyCount: number;
  source: string;
  collectedAt: string;
}

const GAMES = ["全部", "三角洲行动", "烽火地带"] as const;
type GameTab = typeof GAMES[number];

export default function MyLoadoutsPage() {
  const { savedLoadouts, deleteLoadout } = useGunStore();
  const [communityCodes, setCommunityCodes] = useState<CommunityCode[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [activeGame, setActiveGame] = useState<GameTab>("全部");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const loadCodes = async (game?: string) => {
    setLoadingCodes(true);
    setError("");
    try {
      const url = game && game !== "全部"
        ? `/api/gun-codes?limit=200&game=${encodeURIComponent(game)}`
        : "/api/gun-codes?limit=200";
      const response = await fetch(url, { cache: "no-store" });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json.message ?? "读取失败");
      }
      setCommunityCodes(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "读取社区改枪码失败");
    } finally {
      setLoadingCodes(false);
    }
  };

  const triggerRefresh = async () => {
    setRefreshing(true);
    setError("");
    setToast("");
    try {
      const response = await fetch("/api/gun-codes/refresh", {
        method: "POST",
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json.message ?? "刷新失败");
      }
      showToast(`刷新成功：解析 ${json.parsed} 条，新增 ${json.inserted}，更新 ${json.updated}，清理 ${json.deleted} 条`);
      await loadCodes(activeGame !== "全部" ? activeGame : undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "刷新失败");
    } finally {
      setRefreshing(false);
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast("枪码已复制到剪贴板");
    } catch {
      setError("复制失败，请手动复制");
    }
  };

  const handleTabChange = (game: GameTab) => {
    setActiveGame(game);
    void loadCodes(game !== "全部" ? game : undefined);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadCodes(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const gameBadgeColor = (game: string) =>
    game === "烽火地带"
      ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
      : "bg-orange-500/10 text-orange-400 border border-orange-500/30";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl text-sm">
          {toast}
        </div>
      )}

      <div className="fixed top-6 left-6 z-50">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/delta-gun">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回实验室
          </Link>
        </Button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* 我的枪码 */}
        <h1 className="text-5xl font-bold mb-2">我的枪码</h1>
        <p className="text-zinc-400 text-xl mb-10">已保存 {savedLoadouts.length} 个配置</p>

        {savedLoadouts.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            还没有保存任何枪码，去改枪页面保存一个试试吧
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedLoadouts.map((loadout) => (
              <div key={loadout.id} className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-xl">{loadout.name}</h3>
                    <p className="text-orange-400">{loadout.gunName}</p>
                  </div>
                  <button
                    onClick={() => deleteLoadout(loadout.id)}
                    className="text-red-400 hover:text-red-500"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {loadout.attachments.map((att) => (
                    <span key={att.id} className="text-xs bg-zinc-800 px-3 py-1 rounded-full">
                      {att.name}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-zinc-500 mt-6">
                  保存于 {new Date(loadout.createdAt).toLocaleString("zh-CN")}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* 社区改枪码 */}
        <div className="mt-16">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold">社区改枪码</h2>
            </div>
            <Button onClick={triggerRefresh} disabled={refreshing} size="sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "刷新中..." : "手动刷新"}
            </Button>
          </div>

          {/* 游戏 Tab */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {GAMES.map((game) => (
              <button
                key={game}
                onClick={() => handleTabChange(game)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeGame === game
                    ? "bg-orange-500 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                {game}
              </button>
            ))}
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm break-all">
              {error}
            </div>
          )}

          {loadingCodes ? (
            <div className="text-zinc-400">正在加载社区改枪码...</div>
          ) : communityCodes.length === 0 ? (
            <div className="text-zinc-500 py-12 text-center">
              暂无数据，点右上角「手动刷新」采集最新改枪码
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {communityCodes.map((item) => (
                <div
                  key={`${item.weapon}-${item.fullCode}`}
                  className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 hover:border-zinc-500 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{item.weapon}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${gameBadgeColor(item.game)}`}>
                          {item.game}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-zinc-400 text-sm mt-1">{item.description}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => copyCode(item.fullCode)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      复制
                    </Button>
                  </div>

                  <p className="mt-3 break-all text-orange-400 text-xs font-mono bg-zinc-800 rounded-lg px-3 py-2">
                    {item.fullCode}
                  </p>

                  <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
                    {item.valueText && <span>价值 {item.valueText}</span>}
                    <span>复制 {item.copyCount.toLocaleString()} 次</span>
                    <span>{new Date(item.collectedAt).toLocaleDateString("zh-CN")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
