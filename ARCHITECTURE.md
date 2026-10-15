# BerryIce Lab — 信息架构

一句话：BerryIce 是小莓流冰的个人站。写作、随记、关于在前，三角洲工具是其中一个专栏。雨是统一气候，模块之间各自有分区，不互相串门。

## 运行环境

线上是 **2 vCPU / 2 GiB**。`free` 里 MemTotal 大约 1.6 GiB，因为内核要留一块。这是性能的上限，不是参考值。

- 构建：`scripts/deploy.sh`。跳过 tsc、1 个 worker、Node 堆 768MB。堆不要调回 1024，否则整机会进 Swap。
- 内存不够时靠一块 2GB Swap 接住峰值，不靠把堆开大。
- 运行时不另起常驻进程。雨和入场动画的预算见 `DESIGN.md` 第 7 节。

## 模块

导航只有**三个**去处。模块清单的唯一事实来源是 `lib/site-config.ts` 的 `moduleLinks`，
导航条和移动端抽屉从它派生，加模块只改那一处。

| 模块 | 路由 | 定位 | 状态 |
|------|------|------|------|
| 三角洲 | `/delta-gun/*` | 工具专栏：枪械库、社区改枪码、主播配装、我的配置 | 完整主路径（L0） |
| 写作 | `/writing` | 长文 + 随记 | 空，等真实素材 |
| 关于 | `/about` | 我在做什么 + Now + 联系方式 | 已上线 |

为什么是三个：之前五个平级模块（三角洲 / 音乐 / 文章 / 笔记 / 联系）把站摊成一张链接列表。
文章和笔记是同一件事的长短两种形态，合成「写作」；音乐和联系都是「关于我」的下属信息，
放在 `/about`。三角洲留在导航里，但是专栏，不是封面。

**主入口**：`/` 先介绍人（小莓流冰 / BerryIce，bio「学无止境」）。写作和关于并排。
三角洲的枪械库、社区改枪码、主播配装收在同一个专栏里，不占整行主瓦片。

### 旧路由

`/articles` `/notes` → `/writing`；`/music` `/contact` → `/about`。
308 永久重定向，配在 `next.config.ts`。**不要**删掉这四条 —— 外面还有指过来的链接。

## 首页分区（`/`）

| 序号 | Zone | 只放什么 |
|------|------|----------|
| 01 | Person | 中文名、BerryIce、GitHub、bio、三个标签 |
| 02 | Work | 写作与随记、关于，两块并排 |
| 03 | Column | 三角洲工具：枪械库、社区改枪码、主播配装 |
| 04 | Elsewhere | GitHub、源码、Kook 等已配置的外链 |

ICP / 版权在页脚，不单独占一区。禁止把 01–03 揉成一条按钮列表，也禁止再把三角洲画成整行主瓦片。

## 子页结构

三角洲总览（`/delta-gun`）保留：Brief / Missions / Feed。

`/writing`：01 Brief → 02 Longform → 03 Notes。两个列表都空时只渲染一个 `EmptyState`。
`/about`：01 Brief → 02 Now → 03 Contact → 04 Elsewhere。

## 内容真实性

**宁可空着也不摆假数据。** 上一版 `/articles` 摆着 16 篇虚构文章，`href` 全为空，
渲染成看着能点、点了停在原地的卡片 —— 那比空页面更伤，因为它让人以为站是坏的。

现在的防线是类型：`lib/content/writing.ts` 里 `Article.href` 是**必填**的，
没有目的地的条目根本进不了数组。内容为空时页面走 `EmptyState`，说实话。

`lib/content/now.ts` 同理：只写此刻真的成立的事，改内容时顺手改 `nowUpdatedAt`。

## 壳层

气候层挂在**根布局**，不在 SiteShell 里 —— 放进 SiteShell 的话每次换路由都要销毁重建，
雨会从零重来，一场连续的天气被切成一段一段。

```
RootLayout (app/layout.tsx)
  SiteAtmosphere         跨路由不卸载
    RainField            雨（CSS 贴图平移；移动端只留静态湿雾）
    LightningFlash       闪电（空闲时 display:none，不占合成层）
    ClickPulse           点击脉冲
    ScrollAffordances    阅读进度 + 回到顶部
  Template               换页淡入（CSS，不是 motion）
    SiteShell
      SiteHeader         字标 + 模块导航 + 夜雨状态 + 主题
      DeltaSubNav        仅 /delta-gun/*
      {page zones}
      SiteFooter
```

## 设计原则

- 暗色主画布 `#08090D`，雨作为统一气候
- 每模块一个独立图标/色调，但材质统一为玻璃瓦片
- 动效：微交互优先，同一屏 2-3 个效果
- 移动端优先，所有动画必须 60fps
- 不改三角洲 L0/L1 主路径
