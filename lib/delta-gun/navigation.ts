import type { LucideIcon } from "lucide-react";
import { Bookmark, Crosshair, LayoutGrid, Mic2, Users } from "lucide-react";

export interface DeltaNavItem {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const DELTA_NAV: DeltaNavItem[] = [
  {
    href: "/delta-gun",
    label: "总览",
    description: "实验室首页与快捷入口",
    icon: LayoutGrid,
  },
  {
    href: "/delta-gun/guns",
    label: "枪械库",
    description: "挑选武器并配置配件",
    icon: Crosshair,
  },
  {
    href: "/delta-gun/community",
    label: "社区改枪码",
    description: "热门方案 · 搜索 · 一键导入",
    icon: Users,
  },
  {
    href: "/delta-gun/streamers",
    label: "主播改枪",
    description: "职业选手 · 抖音主播的实战配装",
    icon: Mic2,
  },
  {
    href: "/delta-gun/my-loadouts",
    label: "我的枪码",
    description: "本地保存的改枪配置",
    icon: Bookmark,
  },
];

export function isDeltaNavActive(pathname: string, href: string): boolean {
  if (href === "/delta-gun") return pathname === "/delta-gun";
  return pathname.startsWith(href);
}
