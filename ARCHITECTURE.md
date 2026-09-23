# BerryIce Lab — 信息架构

一句话：BerryIce 是「三角洲 + 创作」的个人站，雨是统一气候，模块之间各自有分区，不互相串门。

## 模块

门户只有**三个**去处。模块清单的唯一事实来源是 `lib/site-config.ts` 的 `moduleLinks`，
导航条、移动端抽屉、门户瓦片全从它派生，加模块只改那一处。

| 模块 | 路由 | 定位 | 状态 |
|------|------|------|------|
| 三角洲 | `/delta-gun/*` | 改枪实验室、枪械库、社区枪码、主播配装、我的配置 | 完整主路径（L0） |
| 写作 | `/writing` | 长文 + 随记 | 空，等真实素材 |
| 关于 | `/about` | 我在做什么 + Now + 联系方式 | 已上线 |

为什么是三个：之前五个平级模块（三角洲 / 音乐 / 文章 / 笔记 / 联系）把唯一有完整主路径的
三角洲摊薄成了五分之一，进站的人看不出该先点哪个。文章和笔记是同一件事的长短两种形态，
合成「写作」；音乐和联系都是「关于我」的下属信息，降级成 `/about` 里的两段。

**主入口**：`/` 是模块门户，三角洲是占满整行的主瓦片，另外两块并排。

### 旧路由

`/articles` `/notes` → `/writing`；`/music` `/contact` → `/about`。
308 永久重定向，配在 `next.config.ts`。**不要**删掉这四条 —— 外面还有指过来的链接。

## 门户分区（`/`）

| 序号 | Zone | 只放什么 |
|------|------|----------|
| 01 | Identity | 头像、名、三个标签、一句 bio |
| 02 | Modules | 三角洲（整行）+ 写作 / 关于（并排） |
| 03 | Presence | Kook 聊天室入口 |
| 04 | Legal | ICP / 版权 |

禁止把 01–03 揉成一条按钮列表。

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
