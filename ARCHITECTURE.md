# BerryIce Lab — 信息架构

一句话：BerryIce 是「三角洲 + 创作」的个人站，雨是统一气候，模块之间各自有分区，不互相串门。

## 运行环境

线上是 **2 vCPU / 2 GiB**。`free` 里 MemTotal 大约 1.6 GiB，因为内核要留一块。这是性能的上限，不是参考值。

- 构建：`scripts/deploy.sh`。跳过 tsc、1 个 worker、Node 堆 768MB。堆不要调回 1024，否则整机会进 Swap。
- 内存不够时靠一块 2GB Swap 接住峰值，不靠把堆开大。
- 运行时不另起常驻进程。雨和入场动画的预算见 `DESIGN.md` 第 7 节。

## 模块

门户有**四个**去处。模块清单的唯一事实来源是 `lib/site-config.ts` 的 `moduleLinks`，
导航条、移动端抽屉、门户瓦片全从它派生，加模块只改那一处。

| 模块 | 路由 | 定位 | 状态 |
|------|------|------|------|
| 三角洲 | `/delta-gun/*` | 改枪实验室、枪械库、社区枪码、主播配装、我的配置 | 完整主路径（L0） |
| 写作 | `/writing` | 长文 + 随记 | 空，等真实素材 |
| 知识库 | `/wiki` | Bear 收录的笔记，手机上翻阅和删除 | 已上线 |
| 关于 | `/about` | 我在做什么 + Now + 联系方式 | 已上线 |

写作是自己的长文。知识库是外面收进来的笔记，收录和删除都走口令，不塞进写作。

更早曾经有五个平级模块（三角洲 / 音乐 / 文章 / 笔记 / 联系），把唯一有完整主路径的
三角洲摊薄了。文章和笔记合成「写作」；音乐和联系降成 `/about` 里的两段。这次只加知识库，
那次收敛不动，三角洲仍然是占满整行的主瓦片。

**主入口**：`/` 是模块门户，三角洲占满整行，写作 / 知识库 / 关于在下面并排（窄屏仍是一列）。

### 旧路由

`/articles` `/notes` → `/writing`；`/music` `/contact` → `/about`。
308 永久重定向，配在 `next.config.ts`。**不要**删掉这四条 —— 外面还有指过来的链接。

## 门户分区（`/`）

| 序号 | Zone | 只放什么 |
|------|------|----------|
| 01 | Identity | 头像、名、三个标签、一句 bio |
| 02 | Modules | 三角洲（整行）+ 写作 / 知识库 / 关于 |
| 03 | Presence | Kook 聊天室入口 |
| 04 | Legal | ICP / 版权 |

禁止把 01–03 揉成一条按钮列表。

## 子页结构

三角洲总览（`/delta-gun`）保留：Brief / Missions / Feed。

`/writing`：01 Brief → 02 Longform → 03 Notes。两个列表都空时只渲染一个 `EmptyState`。
`/wiki`：01 Brief → 02 Notes。没有笔记时只留 Brief 和一个 `EmptyState`，不摆占位文章。
单篇在 `/wiki/[slug]`，slug 是文件名去掉 `.md`。
`/about`：01 Brief → 02 Now → 03 Contact → 04 Elsewhere。

### 知识库

线上地址：`https://berryice.cn/wiki`。单篇：`https://berryice.cn/wiki/<slug>`。

笔记是 `content/wiki/*.md`（或环境变量 `WIKI_CONTENT_DIR` 指到的目录）里的文件。
页面用 `connection()` 挡在读文件之前，并且 `dynamic = force-dynamic`，所以收录和删除
不用等下一次 `git push` 或重新构建。构建期把目录烤进静态页的话，手机上会一直看到旧列表。

读是公开的。写入和删除要请求头 `Authorization: Bearer <WIKI_ADMIN_TOKEN>`。
没配这个环境变量时，两个写接口都是 401。

| 动作 | 方法 | 路径 |
|------|------|------|
| 收录 / 覆盖 | `POST` | `/api/wiki/ingest` |
| 删除 | `DELETE` | `/api/wiki/<slug>` |

请求体是 `{ "slug", "markdown" }`。同一 slug 再推一次覆盖原文件，两次都返回成功，方便 webhook 重试。
删除会 `unlink` 那篇 `.md`，不是在列表里隐藏。文件已经不在时再删，仍返回成功。

**Bear 的主路径是 ingest，不是 git。** Webhook「收录到知识库」写完笔记后，把全文 POST 到
`https://berryice.cn/api/wiki/ingest`。`scripts/sync-wiki.mjs --ingest` 是同一条 API 的批量入口。
只在 API 不可用时，才把文件放进仓库再走 `scripts/deploy.sh`。

手机上的删除：列表或正文里点删除，第一次要口令，存在这台浏览器的 `localStorage`
（键 `berryice.wiki.adminToken`），确认后才请求。口令本身不进仓库，也不进 `NEXT_PUBLIC_*`。

`scripts/deploy.sh` 会 `git pull`。运行时新写的笔记是未跟踪文件，pull 不会删掉它们。
不要对 `content/wiki` 做 `git checkout --` 或 `git reset --hard`，否则仓库里的种子笔记会回来。
若要让手机上的增删完全不受发布覆盖，把 `WIKI_CONTENT_DIR` 指到仓库外，再跑一次 ingest。

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
