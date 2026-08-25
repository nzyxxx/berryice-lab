"use client";

import { ClickPulse } from "@/components/atmosphere/click-pulse";
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
 * 雨势由这层自己读路由决定，而不是让每个页面传参：
 * 页面配置气候就得把 props 一路传下去，且换页必然重挂。
 */
export function SiteAtmosphere() {
  const pathname = usePathname();

  // 三角洲那几页信息密度高，雨压小一点免得跟内容抢注意力
  const density = pathname.startsWith("/delta-gun") ? "low" : "normal";

  return (
    <>
      <RainField density={density} />
      <LightningFlash />
      <ClickPulse />
      <ScrollAffordances />
    </>
  );
}
