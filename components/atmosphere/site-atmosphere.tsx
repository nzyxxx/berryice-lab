"use client";

import { LightningFlash } from "@/components/atmosphere/lightning-flash";
import { RainField } from "@/components/atmosphere/rain-field";
import { ScrollAffordances } from "@/components/lab/scroll-affordances";
import { atmosphereForPath } from "@/lib/atmosphere-routes";
import { usePathname } from "next/navigation";

/**
 * 全站气候层，挂在根布局上。
 *
 * 这层以前跟着 SiteShell 挂在每个页面里，于是每次跳转都要销毁重建：
 * 雨丝贴图重算、闪电的待触发定时器被清掉。
 * 点击起来发涩，雨也从零重来 —— 一场连续的天气被切成一段一段。
 *
 * 夜雨挂在首页和 /dafeiyu，用的是同一个 RainField。
 * 闪电只留首页。其余页面不挂这层，底边的雨溅也不会跟过去。
 */
export function SiteAtmosphere() {
  const { rain, lightning } = atmosphereForPath(usePathname());

  return (
    <>
      {rain ? <RainField /> : null}
      {lightning ? <LightningFlash /> : null}
      <ScrollAffordances />
    </>
  );
}
