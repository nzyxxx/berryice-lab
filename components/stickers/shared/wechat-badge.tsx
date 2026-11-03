import { WECHAT_STICKER_LIMIT_BYTES } from "@/data/stickers";
import { cn } from "@/lib/utils";
import { Check, TriangleAlert } from "lucide-react";

export function WechatBadge({ bytes, className }: { bytes: number; className?: string }) {
  const ok = bytes <= WECHAT_STICKER_LIMIT_BYTES;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        ok
          ? "border-lab-success/40 bg-lab-success/12 text-lab-success"
          : "border-lab-error/40 bg-lab-error/10 text-lab-error",
        className
      )}
    >
      {ok ? <Check className="size-3" /> : <TriangleAlert className="size-3" />}
      {ok ? "微信友好" : "超出 300KB"}
    </span>
  );
}
