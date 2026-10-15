---
version: 3.0
name: BerryIce-Night-Rain-Gallery
description: "Night-rain gallery canvas. Near-black #08090D wet glass, rain as climate (not decoration), iOS 27 Liquid Glass material, oil-slick hover, click pulse. Hub cyan rain reflection; tactical orange reserved for Delta Gun only."
colors:
  canvas: "#08090D"
  surface-1: "#0A0B0F"
  surface-2: "#12141A"
  surface-3: "#1A1D26"
  hairline: "#252830"
  ink: "#F4F6FB"
  ink-muted: "#C8D0E0"
  ink-subtle: "#8B93A7"
  primary: "#38BDF8"
  accent-glow: "#A78BFA"
  accent-tactical: "#F97316"
  rain: "#B8D4E8"
---

# BerryIce Lab — DESIGN.md

> 改页面前先读本文和 `ARCHITECTURE.md`。本文管**长什么样**，`ARCHITECTURE.md` 管**放在哪**。
> 两者冲突时以本文的第 7 节（动效预算）为准 —— 那一节是硬约束，不是建议。

---

## 1. 这个站要像什么

一句话：**暗色画廊，夜雨是天气，内容压在雨之上。**

参考坐标（抽语言，不抄版式）：

| 来源 | 抽走的东西 |
|------|-----------|
| Apple iOS 27 | Liquid Glass 材质：通透、暗边、强镜面高光 |
| Linear | 信息密度、细线分隔、克制的色彩 |
| Vercel | 近黑画布上只靠一个 accent 说话 |
| Stripe | 渐变作为层次工具，不是装饰 |
| Awwwards SOTG | 油膜悬停、点击脉冲、玻璃瓦片入场 |

**禁止**：把这些来源的具体版式整块搬过来。抽的是材质和节奏。

---

## 2. 材质：Liquid Glass（iOS 27 口径）

全站玻璃只有一个来源：`components/uiverse/glass-surface.ts` 的 `glassSurfaceClass()`。
**不要在页面里手写第二套 `backdrop-blur + border + shadow` 组合。**

iOS 26 那版玻璃是厚磨砂，27 改了三件事，本站照抄：

| # | iOS 27 的改动 | 落地 |
|---|--------------|------|
| 1 | 更通透，磨砂减弱 | `backdrop-blur-md`（12px）+ `backdrop-saturate-150` 补回通透后丢的色彩 |
| 2 | **新增暗化边缘** | 外圈 `0 0 0 1px rgba(0,0,0,0.55)`，把玻璃从背景里切出来 |
| 3 | **镜面高光调亮** | 顶缘 `inset 0 1px 0 rgba(255,255,255,0.30)` + `before:` 那道高光线 |

第 2 条是关键：27 之前靠亮描边跟背景分离，背景一复杂就糊成一片。暗环才是分离手段。
第 1 条顺带是性能：`backdrop-filter` 的开销随模糊半径线性涨，24px → 12px 是白拿的。

**模糊半径预算**（超了就是 bug）：

| 场景 | 上限 |
|------|------|
| 吸顶导航（滚动时每帧重算） | `backdrop-blur-lg`（16px） |
| 卡片 / 面板 | `backdrop-blur-md`（12px） |
| 小徽标 / 药丸 | `backdrop-blur-sm`（8px） |
| 任何地方 | 禁止 `backdrop-blur-2xl` / `-3xl` |

---

## 3. 色彩

全部走 `lab-*` token（定义在 `app/globals.css` 的 `:root` / `.dark`）。**禁止在组件里写死十六进制**，例外只有模块自己的 accent（`lib/site-config.ts` 里的 `moduleLinks[].accent`）。

双 accent 制：

- **Hub / 雨反射**：`lab-primary` `#38bdf8` + `lab-accent-glow` `#a78bfa`
- **三角洲模块**：`lab-accent-tactical` `#f97316`。**禁止**拿它当首页主 CTA —— 橙色一出现在首页，这个专栏就会变成整站。

文字只有四级，不要再造：`lab-ink` → `lab-ink-muted` → `lab-ink-subtle` → `lab-ink-tertiary`。

---

## 4. 字阶

| 用途 | class | 尺寸 |
|------|-------|------|
| 页面主标题 | `text-display-hero` | 44px / 60px(md) |
| 区块标题 | `text-display-section` | 32px / 40px(md) |
| 卡片标题 | `text-[15px] font-medium tracking-tight` | 15px |
| 正文 | `text-sm` / `text-[15px]` | 14–15px |
| 辅助说明 | `text-xs leading-relaxed` | 12px |
| eyebrow | `text-[11px] uppercase tracking-[0.18em]` | 11px |

枪码、哈希、ID 一律 `font-mono`。
标题一律带负字距（`tracking-tight` 或更紧），正文不带。

---

## 5. 布局与节奏

- 首页阅读列 `max-w-3xl`（48rem）；实验室 `72rem`
- 首页人名和栏目之间留一大段空白（`mt-16` / `md:mt-24`）。栏目用同一套平卡片，不再编号、不再聚光
- 卡片圆角统一 `rounded-2xl`；大面板 `rounded-3xl`；小控件 `rounded-full`
- 触控目标 ≥ 44px，无例外
- 每个分区走 `SectionZone`：序号 + 大写 eyebrow + 标题。**禁止无分区的直列**

---

## 6. 层级（z-index）

只有这几层，不要新增：

```
z-0    气候层（RainField / LightningFlash）
z-10   页面内容（SiteShell 内层 + template 的 .animate-page-in）
z-40   ClickPulse
z-50   SiteHeader（吸顶）
z-60   阅读进度条 / 回到顶部
z-80   跳到主内容（焦点态）
```

内容层必须显式 `z-10`：淡入期间 `opacity < 1` 会生成层叠上下文，不定位就会掉到气候层下面。

---

## 7. 动效预算（硬约束）

这一节是 2026-09 那次性能返工的产物。**违反任意一条都会把首屏或帧率打回去。**

### 7.1 入场动画一律用 CSS，不要用 motion 的 `initial`

`motion` 的 `initial` 会被序列化进 SSR 产物。写 `initial={{ opacity: 0 }}`，
服务端就真的吐出 `style="opacity:0"`，那块内容要等整棵客户端树水合完才显形。

实测：`app/template.tsx` 上一个整页淡入，把 4 倍降频手机的 LCP 从 ~1s 推到 **6.85s**。
首字节 20ms 就到了，SSR 全白做。

```tsx
// ❌ 首屏 HTML 里躺着一个隐身的页面
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

// ✅ CSS 动画不依赖 JS，样式一解析就开始跑
<div className="animate-page-in">
```

可用的入场 class：`animate-page-in`（换页）、`animate-tile-in`（瓦片，配 `animationDelay` 错开）。

代价：`whileInView` 的滚动触发变成了加载触发。页面都不长，这个损失可以接受；
真需要滚动触发时，用 `IntersectionObserver` 加 class，**不要**让元素以 `opacity:0` 出厂。

> 已知例外：`components/BlurText.tsx` 是 React Bits 上游组件，仍会输出 8 个 `opacity:0` 的字母 span。
> 它不是 LCP 元素，暂时留着；真要动就整体换成 CSS keyframes，别改一半。

### 7.2 常驻 `requestAnimationFrame` 循环：**0 条**

页面空闲时不允许有任何 rAF 在跑。空转的 rAF 就算什么都不画，每帧也要把画布纹理
重新交给合成器 —— 实测 8 块 canvas 让桌面空闲帧率停在 **43fps**，最差帧 99.6ms。

- 需要逐帧的效果 → 先问能不能用 CSS `transform` / `opacity` 动画（走合成线程，主线程零开销）
- 真需要 canvas → 用完必须停（`cancelAnimationFrame`），且空闲时 `display:none` 脱离合成
- 装饰性 canvas 不许常驻。`LightningFlash` 是模板：只在劈的那 0.7 秒里存在

### 7.3 合成层预算

| 场景 | 上限 |
|------|------|
| 全屏合成层（雨、光晕） | 桌面 3 层，移动端 **0 层** |
| 常驻 `will-change` | 只给全屏气候层，组件里禁止 |
| 同屏 canvas | 空闲时 0 块参与合成 |

移动端为什么是 0：三层超出视口的合成层在手机 GPU 上要吃掉几十 MB 显存。
`RainField` 在 `(max-width: 767px)`、`(pointer: coarse)`、`prefers-reduced-motion`
三种情况下自动只留静态湿雾。

### 7.4 同一屏最多 2–3 个效果

一次点击只配一个反馈（全站是 `ClickPulse`，不要再叠第二个）。
不要雨 + 极光 + Beams 三套背景叠在一起。

---

## 8. 气候：雨

- 雨只存在于 `RainField`（挂在根布局的 `SiteAtmosphere` 里，跨路由不卸载）
- 三层景深，**越近的雨越虚**：远景细淡、中景是唯一清晰可辨的一层、近景又宽又糊
  （反过来做就会变成屏保）
- 实现是**预渲染无缝贴图 + CSS transform 平移**，不是逐帧重画。改它之前先读 7.2
- 雨只在被照亮的地方现形：`mask-image` 对齐顶部那团青色光晕。
  全屏均匀亮度的雨 = 屏保
- 三角洲分区 `density="low"`，信息密度高的页面雨要让路
- **禁止**第二套粒子雨；**禁止**雨盖住输入框

---

## 9. 组件

| 要做什么 | 用哪个 | 不要做什么 |
|---------|--------|-----------|
| 玻璃瓦片 | `GlassTile` / `ModuleTile` | 手写 backdrop-blur 组合 |
| 玻璃表面样式 | `glassSurfaceClass()` | 复制一份改参数 |
| 分区 | `SectionZone` | 裸的 `<h2>` + `<div>` |
| 悬停聚光 | `SpotlightCard` | 整页 WebGL 油膜 |
| 悬停抬起 | `hover:-translate-y-0.5` | `hover:scale-105` |
| 页面骨架 | `SiteShell` + `PageContainer` | 每页自己写 min-h-screen |
| 404 / 报错 | `StatusScreen` | 单独做一版 |
| 列表为空 | `EmptyState` | 拿假数据占位 |

动效优先级仍然是：React Bits → Aceternity UI → Uiverse.io → OriginKit → Aura.build。
**但第 7 节的预算优先于这条**：上游组件如果常驻 rAF 或以 `opacity:0` 出厂，改造后再用。

---

## 10. Do / Don't

**Do**

- 先分区再摆组件
- 枪码、ID 用 mono
- 颜色走 `lab-*` token
- 入场动画用 CSS
- 改完气候层或入场动画，跑一遍第 11 节的检查

**Don't**

- 不要把首页做成无分区的 Linktree 直列，也不要把三角洲画成整行主瓦片
- 不要 `hover:scale-105`
- 不要 `backdrop-blur-2xl` 以上
- 不要改社区列表 / 枪械数据的主路径来「做效果」
- 不要为了装饰新增常驻 rAF

---

## 11. 改完自查

动了气候层、入场动画或玻璃材质，合并前跑这三条：

```bash
# 1. 首屏 HTML 里不该有成片的隐身元素。
#    首页不再放聚光遮罩，也不再用 BlurText 把人名拆成 opacity:0 的字母。
#    数字涨了就去看是谁又把 motion 的 initial 写进了 SSR。
curl -s http://localhost:3000/ | grep -o 'opacity:0' | wc -l   # 0

# 2. 构建通过
yarn build
```

3. DevTools 里桌面空闲和滚动时帧率都应为 60，最差帧 < 20ms；空闲时参与合成的 canvas 应为 0。

### 基线（2026-09 返工前 → 返工后）

移动端 390×844、4 倍 CPU 降频、Fast 4G：

| 指标 | 之前 | 之后 |
|------|------|------|
| LCP（DevTools trace） | 6853 ms | 1821 ms |
| LCP（PerformanceObserver，多次） | — | 568–1012 ms |
| FCP 与首次绘制的间隔 | 300–1200 ms | 0 ms |

桌面 1440×900、不降频：

| 指标 | 之前 | 之后 |
|------|------|------|
| 空闲帧率 | 43.6 fps | 60.1 fps |
| 空闲 p95 帧 | 34.1 ms | 17.5 ms |
| 空闲最差帧 | 99.6 ms | 17.7 ms |
| 滚动帧率 | — | 60.3 fps |
| 参与合成的 canvas | 8 | 0 |

跑分机器本身在编译时数字会飘，看数量级和趋势，不要抠个位数。
