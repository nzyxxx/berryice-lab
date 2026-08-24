---
version: 1.0
name: BerryIce-Lab-design-system
description: "Engineering-product dark canvas inspired by Linear (awesome-design-md/linear.app). Near-black #010102 canvas, hairline-bordered charcoal surfaces, lavender-blue hub accent (#5e6ad2), and tactical orange module accent (#f97316) reserved for Delta Gun Lab only. Dense, precise, quietly premium — no decorative gradients on chrome."

colors:
  primary: "#38bdf8"
  primary-hover: "#7dd3fc"
  accent-glow: "#a78bfa"
  accent-tactical: "#f97316"
  accent-tactical-hover: "#fb923c"
  accent-beacon: "#38bdf8"
  ink: "#f7f8f8"
  ink-muted: "#d0d6e0"
  ink-subtle: "#8a8f98"
  ink-tertiary: "#62666d"
  canvas: "#010102"
  surface-1: "#0f1011"
  surface-2: "#141516"
  surface-3: "#18191a"
  hairline: "#23252a"
  hairline-strong: "#34343a"
  semantic-success: "#27a644"
  semantic-error: "#ef4444"

typography:
  font-sans: "Geist Sans, Inter, -apple-system, system-ui, sans-serif"
  font-mono: "Geist Mono, ui-monospace, monospace"
  display-hero: "56px / 600 / -0.03em"
  display-section: "40px / 600 / -0.025em"
  headline: "28px / 600 / -0.02em"
  card-title: "22px / 500 / -0.02em"
  body: "16px / 400"
  body-sm: "14px / 400"
  caption: "12px / 400"
  eyebrow: "13px / 500 / 0.04em uppercase"

rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "9999px"

spacing:
  section: "96px"
  page-x: "24px"
  card-pad: "24px"
---

# BerryIce Lab — DESIGN.md

> 基于 [VoltAgent/awesome-design-md](https://github.com/voltagent/awesome-design-md) 中 **Linear** 设计文档改编，适配本仓库所有页面与组件。

## 1. 视觉主题与气质

- **画布**：近乎纯黑 `#010102`，带极弱冷色倾向，是全站默认背景。
- **气质**：工程师向产品站 — 克制、精密、信息密度适中，不靠大面积渐变装饰。
- **层次**：用四级 surface + 1px hairline 区分层级，**少用阴影**。
- **双 accent 规则**：
  - **Hub 主色** `#38bdf8`（极光青）+ `#a78bfa`（紫辉渐变）：门户、导航、主 CTA、背景极光。
  - **模块色** `#f97316`（战术橙）：仅用于「三角洲改枪实验室」子产品。
  - **烽火地带** `#38bdf8`：仅作为游戏模式标签/筛选，不作全站主色。

## 2. 色彩角色

| 语义名 | Hex | 用途 |
|--------|-----|------|
| canvas | #010102 | 页面背景 |
| surface-1 | #0f1011 | 卡片、面板 |
| surface-2 | #141516 | 悬停、选中卡片 |
| hairline | #23252a | 默认边框 |
| ink | #f7f8f8 | 标题、正文强调 |
| ink-subtle | #8a8f98 | 次要说明 |
| primary | #5e6ad2 | 门户 CTA、链接强调 |
| accent-tactical | #f97316 | Delta Gun 模块标识 |

## 3. 字体

- **Sans**：Geist Sans（回退 Inter / system-ui）
- **Mono**：Geist Mono — 枪码、技术字段专用
- **Display**：负字距 -0.02em ~ -0.03em，字重 600
- **Eyebrow**：13px、medium、全大写、正字距 +0.04em

## 4. 组件

### 按钮

- **Primary**：`bg-primary` 薰衣草蓝，8×14 padding，`rounded-md`
- **Secondary**：`bg-surface-1` + hairline 边框
- **Tactical**（仅 Delta Gun）：`bg-accent-tactical`，禁止在门户首页作主 CTA

### 卡片

- `bg-surface-1` + `border hairline` + `rounded-lg`（12px）
- 悬停：`border-hairline-strong` + `bg-surface-2`，**禁止 scale 弹跳**

### 输入

- `bg-surface-1`，focus ring 使用 `primary/30`

## 5. 布局

- 最大内容宽：`72rem`（1152px）
- 区块垂直节奏：`section` = 96px
- 栅格：12 列思维，卡片常用 1/2/3 列响应式

## 6. Do / Don't

**Do**

- 保持深色画布与细线边框一致
- 枪码用 mono 字体、独立 code panel
- 门户与实验室子产品共用 SiteHeader / SiteShell

**Don't**

- 不要在全站滥用橙色渐变
- 不要使用 `hover:scale-105` 等夸张动效
- 不要在卡片上堆叠多重阴影

## 7. 响应式

- Mobile 优先单列；`sm` 双列；`lg` 三列
- 触控目标最小 44px

## 8. 产品信息架构（Delta Gun Lab）

| 路由 | 定位 |
|------|------|
| `/delta-gun` | 指挥台总览 + 热门预览 |
| `/delta-gun/guns` | 枪械库（缩略图） |
| `/delta-gun/community` | **社区改枪码**（一级入口：分类、虚拟列表、导入） |
| `/delta-gun/my-loadouts` | 本地已保存配置 |

子导航：`DeltaSubNav`（layout 内）· 动效：`motion` · 长列表：`@tanstack/react-virtual`

## 9. Agent 提示

构建新页面时：先读本文，使用 `components/lab/*` 壳层，Tailwind 类名优先 `lab-*` 主题 token（见 `globals.css`）。
