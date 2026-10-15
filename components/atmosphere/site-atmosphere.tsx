"use client";

import { LightningFlash } from "@/components/atmosphere/lightning-flash";
import { RainField } from "@/components/atmosphere/rain-field";
import { ScrollAffordances } from "@/components/lab/scroll-affordances";
import { usePathname } from "next/navigation";

/**
 * 全站气候层，挂在根布局上，跨路由不卸载。
 *
 * 这层以前跟着 SiteShell 挂在每个页面里，于是每次跳转都要销毁重建：
 * 雨丝精灵重新光栅化、几百条雨丝重新播种、闪电的待触发定时器被清掉。
 * 点击起来发涩，雨也从零重来 —— 一场连续的天气被切成一段一段。
 *
 * 雨和闪电只留在首页。别的页面不再挂这层，底边的雨溅也不会跟过去。
 */
export function SiteAtmosphere() {
  const pathname = usePathname();
  const home = pathname === "/";

  return (
    <>
      {home ? (
        <>
          <RainField />
          <LightningFlash />
        </>
      ) : null}
      <ScrollAffordances />
    </>
  );
}
