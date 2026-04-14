import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DeltaGunLabPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* 返回首页按钮 */}
      <div className="fixed top-6 left-6 z-50">
        <Button 
          variant="ghost" 
          size="sm"
          asChild
          className="flex items-center gap-2 text-zinc-400 hover:text-white"
        >
          <Link href="/">
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>
        </Button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-3xl">
            🔫
          </div>
          <div>
            <h1 className="text-5xl font-bold tracking-tight">三角洲改枪实验室</h1>
            <p className="text-zinc-400 text-xl mt-1">智能搭配 · 枪码记录 · 一键分享</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 枪械库 */}
          <Link href="/delta-gun/guns">
            <Card className="bg-zinc-900 border-zinc-700 hover:border-orange-500 transition-all hover:scale-105 cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-zinc-100">
                  📋 枪械库
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400">浏览所有可改装枪械</p>
              </CardContent>
            </Card>
          </Link>

          {/* 智能改枪 */}
          <Card className="bg-zinc-900 border-zinc-700 hover:border-orange-500 transition-all hover:scale-105 cursor-pointer opacity-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-zinc-100">
                🛠️ 智能改枪
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-400">根据地图/模式推荐最优配件（开发中）</p>
            </CardContent>
          </Card>

          {/* 我的枪码 */}
          <Link href="/delta-gun/my-loadouts">
            <Card className="bg-zinc-900 border-zinc-700 hover:border-orange-500 transition-all hover:scale-105 cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-zinc-100">
                  💾 我的枪码
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400">保存、导入、分享改枪码</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}