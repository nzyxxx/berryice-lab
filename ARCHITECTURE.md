# BerryIce Lab — 信息架构

一句话：BerryIce 是小莓流冰的个人站。首页先写名字，栏目从 `lib/content/home-modules.ts` 来。三角洲是「实验室」里的一条。雨是统一气候，模块之间各自有分区，不互相串门。

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

**主入口**：`/` 只放名字（小莓流冰 / BerryIce）和一组平级栏目。栏目数据在 `lib/content/home-modules.ts`，加一块就追加一条。三角洲挂在「实验室」的 `entries` 里，不单独占一区。

### 旧路由

`/articles` `/notes` → `/writing`；`/music` `/contact` → `/about`。
308 永久重定向，配在 `next.config.ts`。**不要**删掉这四条 —— 外面还有指过来的链接。

## 首页（`/`）

上面是名字和 BerryIce。下面是 `homeModules` 渲染的同一套卡片，目前是：项目 / 作品、文章、实验室、关于我、生活 / 兴趣、更多。

实验室的条目里，三角洲是其中一条，链到 `/delta-gun`。没有地址的卡片只是占位，不要做成点了没反应的链接。

ICP / 版权在页脚。首页不放 GitHub 账号，也不放本站源码。禁止再把三角洲画成整行主区块。

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
