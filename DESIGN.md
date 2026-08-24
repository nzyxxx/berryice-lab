---
version: 2.0
name: BerryIce-Night-Rain-Gallery
description: "Night-rain gallery canvas inspired by Awwwards SOTD The State of the Gallery. Near-black #08090D wet glass, rain as climate (not decoration), oil-slick hover, click pulse, scroll-assembled glass tiles. Hub cyan rain reflection; tactical orange reserved for Delta Gun only."
colors:
  canvas: "#08090D"
  surface-1: "#0E1016"
  surface-2: "#141821"
  hairline: "#2A303C"
  ink: "#F4F6FB"
  ink-subtle: "#8B93A7"
  primary: "#38BDF8"
  accent-glow: "#A78BFA"
  accent-tactical: "#F97316"
  rain: "#B8D4E8"
---

# BerryIce Lab — DESIGN.md

> 气候参考 [The State of the Gallery](https://www.awwwards.com/sites/the-state-of-the-gallery)（SOTD）：油膜悬停、点击脉冲、玻璃瓦片入场、滚动驱动英雄区。  
> **不复制** 其 Three.js 画廊内容，只抽取交互语言。全站气候是夜雨。

## 1. 气质

- **画布**：`#08090D`（SOTG 同色），湿冷、夜雨、画廊。
- **气候**：下雨是一层，不是贴纸。内容永远压在雨之上。
- **层次**：玻璃瓦片（毛玻璃 + 内高光 + 1px 湿边）> 细线 > 光晕。少用硬阴影。
- **双 accent**：
  - Hub / 雨反射：`#38bdf8` + `#a78bfa`
  - 三角洲模块：`#f97316`，禁止当门户主 CTA

## 2. 从 SOTG 落地的四条动效

| SOTG 元素 | 本站落地 | 禁止 |
|-----------|----------|------|
| Hover oil slick + particles | `SpotlightCard` + 玻璃油膜高光 | 整页 WebGL 油膜 |
| Click pulse | 全站 `ClickPulse` + 首页 `ClickSpark` | 按钮 scale-105 |
| Glass tiles assemble on scroll | `GlassTile` `whileInView` | 一次弹出全部卡片 |
| Scroll-driven hero | 首页 Identity 区轻位移/模糊解除 | 锁死滚动的长片头 |

## 3. 下雨规则

- 雨只存在于 `RainField`（SiteShell 一层）
- 桌面约 70 滴，手机约 36 滴；`prefers-reduced-motion` 时停动画，只留湿雾
- 实验室列表页同样下雨，但密度更低，不挡文字
- 禁止第二套粒子雨、禁止雨滴盖住输入框

## 4. 组件

- **玻璃瓦片**：`GlassTile` — 圆角 16px、内高光、油膜聚光
- **分区**：`SectionZone` — 序号 + 大写 eyebrow + 标题，一块一主题
- **按钮**：Primary = 雨青；Secondary = 玻璃描边
- **输入**：玻璃底，focus `primary/30`

## 5. 布局

- 门户最大宽 `40rem`（画廊列）；实验室 `72rem`
- 区块节奏：Identity 紧、Gallery 疏、Feed 再疏
- 触控目标 ≥ 44px

## 6. Do / Don't

**Do**

- 先分区再摆组件
- 枪码用 mono
- 动效优先 React Bits / Aceternity / Uiverse / OriginKit / Aura

**Don't**

- 不要把首页做成无分区的 Linktree 直列
- 不要雨 + 极光 + Beams 三套背景叠在一起
- 不要 `hover:scale-105`
- 不要改社区列表 / 枪械数据的主路径来「做效果」

## 7. Agent

先读本文与 `ARCHITECTURE.md`。壳层：`SiteShell` + `RainField`。token：`lab-*`。
