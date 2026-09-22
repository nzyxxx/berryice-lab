import type { ReactNode } from "react";

/**
 * 换页淡入。
 *
 * 这里刻意不用 motion：motion 的 `initial` 会被写进 SSR 产物，
 * 于是服务端直接吐出 `style="opacity:0"`，整页在水合完成前一直是不可见的。
 * 首屏本来 20ms 就到了第一个字节，却要等整棵客户端树水合完才显形 ——
 * 实测 4 倍降频的手机上 LCP 被推到 6.8s，SSR 白做。
 *
 * CSS 动画不依赖 JS：样式一解析就开始跑，第一帧之后 opacity 就离开 0，
 * LCP 落回 FCP 附近。template 每次导航都会重挂，动画自然重放。
 * `prefers-reduced-motion` 由 globals.css 里的全局兜底压成 0.01ms。
 */
export default function Template({ children }: { children: ReactNode }) {
  // 淡入期间 opacity<1 会生成层叠上下文，不定位的话内容会被画到
  // 定位的气候层之下，跳转瞬间被背景吞掉
  return (
    <div className="relative z-10 animate-page-in">{children}</div>
  );
}
