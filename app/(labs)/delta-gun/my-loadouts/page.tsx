'use client';

import { Button } from "@/components/ui/button";
import { useGunStore } from "@/lib/store/gunStore";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";

export default function MyLoadoutsPage() {
  const { savedLoadouts, deleteLoadout } = useGunStore();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="fixed top-6 left-6 z-50">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/delta-gun">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回实验室
          </Link>
        </Button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-5xl font-bold mb-2">我的枪码</h1>
        <p className="text-zinc-400 text-xl mb-10">已保存 {savedLoadouts.length} 个配置</p>

        {savedLoadouts.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            还没有保存任何枪码<br />
            去改枪页面保存一个试试吧
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
                  保存于 {new Date(loadout.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}