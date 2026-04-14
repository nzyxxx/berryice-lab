import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Gamepad2, Sparkles } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Hero 区域 */}
      <div className="flex flex-col items-center justify-center pt-24 pb-16 text-center px-6">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          个人学习实验室
        </div>
        
        <h1 className="text-6xl font-bold tracking-tight mb-4">
          BerryIce<span className="text-blue-500">.</span>Lab
        </h1>
        
        <p className="text-xl text-zinc-400 max-w-md">
          记录学习、实践工具、持续进步的地方
        </p>
        
        <div className="mt-8 flex gap-4">
          <Button size="lg" asChild>
            <Link href="/delta-gun">进入三角洲改枪实验室</Link>
          </Button>
        </div>
      </div>

      {/* 实验室模块区域 */}
      <div className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-semibold mb-8 flex items-center gap-3">
          <BookOpen className="w-6 h-6" />
          我的实验室
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 三角洲改枪实验室 */}
          <Card className="hover:scale-105 transition-all duration-300 cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Gamepad2 className="w-8 h-8 text-orange-500" />
                <CardTitle>三角洲改枪实验室</CardTitle>
              </div>
              <CardDescription>
                智能搭配、记录枪码、社区分享
              </CardDescription>
            </CardHeader>
            <CardContent>
			  <Button variant="outline" className="w-full" asChild>
                <Link href="/delta-gun">立即进入 →</Link>
              </Button>
            </CardContent>
          </Card>

          {/* 以后新增模块可以直接复制上面的卡片结构 */}
          {/* 例如：Next.js 学习笔记、服务器运维等 */}
        </div>
      </div>
    </div>
  );
}