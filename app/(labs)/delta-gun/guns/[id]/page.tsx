"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Copy, Check } from "lucide-react";
import { guns } from "@/data/guns";
import { useGunStore } from "@/lib/store/gunStore";
import { useState } from "react";
import { useParams } from "next/navigation";

export default function GunDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { selectedAttachments, addAttachment, removeAttachment, saveLoadout } = useGunStore();
  const [copied, setCopied] = useState(false);
  const gun = guns.find(g => g.id === id);

  if (!gun) return <div className="p-10 text-center">枪械不存在</div>;

  const availableAttachments = [
    { id: "suppressor", name: "消音器", type: "muzzle" as const },
    { id: "red-dot", name: "红点瞄准镜", type: "sight" as const },
    { id: "extended-mag", name: "扩容弹夹", type: "magazine" as const },
    { id: "vertical-grip", name: "垂直握把", type: "grip" as const },
  ];

  const handleCopyLoadout = async () => {
    const attachmentText =
      selectedAttachments.length > 0 ? selectedAttachments.map((a) => a.name).join(" + ") : "无";
    const loadoutText = `${gun.name} 配置\n配件：${attachmentText}`;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(loadoutText);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = loadoutText;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("复制失败:", error);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="fixed top-6 left-6 z-50">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/delta-gun/guns">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回枪械库
          </Link>
        </Button>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center gap-6 mb-10">
          <div className="w-16 h-16 bg-orange-500 rounded-3xl flex items-center justify-center text-5xl">
            🔫
          </div>
          <div>
            <h1 className="text-5xl font-bold">{gun.name}</h1>
            <p className="text-zinc-400 text-xl">{gun.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* 当前配置 */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8">
            <h3 className="text-xl font-semibold mb-6">当前配置 ({selectedAttachments.length}/6)</h3>
            <div className="flex flex-wrap gap-2">
              {selectedAttachments.map((att) => (
                <div key={att.id} className="bg-zinc-800 px-4 py-2 rounded-xl flex items-center gap-2">
                  <span>{att.name}</span>
                  <button onClick={() => removeAttachment(att.id)} className="text-red-400">×</button>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-8">
              <Button
                className="flex-1"
                onClick={() => {
                  const name = prompt("请输入枪码名称", `${gun.name} 配置`);
                  if (name) saveLoadout(name, gun.name);
                }}
              >
                <Save className="w-4 h-4 mr-2" />
                保存枪码
              </Button>

              <Button variant="outline" className="flex-1" onClick={handleCopyLoadout}>
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "已复制" : "复制枪码"}
              </Button>
            </div>
          </div>

          {/* 可更换配件 */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8">
            <h3 className="text-xl font-semibold mb-6">可更换配件</h3>
            <div className="grid grid-cols-2 gap-4">
              {availableAttachments.map((att) => (
                <div
                  key={att.id}
                  onClick={() => addAttachment(att)}
                  className="bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-2xl p-4 cursor-pointer"
                >
                  <p className="font-medium">{att.name}</p>
                  <p className="text-xs text-zinc-500">{att.type}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}