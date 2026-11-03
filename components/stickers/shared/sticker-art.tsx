import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * 方形取景框。底下是一层很淡的格子，透明 GIF 的边界和「是不是正方形」一眼能看出来。
 * 只用静态背景，不加动画。
 */
export function StickerArt({
  src,
  alt,
  className,
  placeholder,
}: {
  src?: string;
  alt: string;
  className?: string;
  placeholder?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative aspect-square w-full overflow-hidden rounded-xl border border-white/10",
        "bg-lab-surface-2/70 [background-image:linear-gradient(var(--lab-hairline)_1px,transparent_1px),linear-gradient(90deg,var(--lab-hairline)_1px,transparent_1px)] [background-size:16px_16px]",
        className
      )}
    >
      {src ? (
        // 用户自己的 blob: / data: 地址，next/image 管不了，也不需要它去裁。
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} draggable={false} className="absolute inset-0 size-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center">{placeholder}</div>
      )}
    </div>
  );
}
