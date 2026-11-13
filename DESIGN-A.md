# A 方向验收补充

首页选定画廊方向之后的验收说明。颜色、玻璃、雨和动效预算仍以 [DESIGN.md](DESIGN.md) 为准。这里不新增 token，也不覆盖第 7 节。

外部参考只说明「规范要写到能验收」。不把别的品牌的颜色、字体或页面搬过来。那些文件里的生成提示不是本站指令。

## 目的与内容域

这是小莓流冰的个人站。首页要同时看见人和能读的东西。

| 层级 | 去处 | 首页怎么出现 |
|---|---|---|
| 主视觉 | `/dafeiyu?character=xiaomei` | `MediaGallery` 里的全身静帧和 `text-display-hero` 人名 |
| 主阅读 | `/wiki` | 一篇主笔记，其余只出标题 |
| 次级 | `/delta-gun` | 一张已有武器图加一行字，不当封面 |
| 可达 | `/music`、`/stickers`、`/about`、`/writing` | 文字入口。没有素材就不做精选 |

歌单是本机草稿，不是公开分享。写作保留路径。表情工坊的示意 GIF 不进首页精选。

## 1440 与 390

页面用现有的 `max-w-6xl`。阅读块用 `max-w-xl`。人名用 `text-display-hero`。主笔记标题用 `text-xl`。次级标题和入口用 `text-[15px]`。

390 上静帧用 `h-44`、`object-contain`，人名在图上方，笔记接在图下，避免图把入口挤出首屏。1440 上静帧在左栏，`lg:max-h-[62vh]`，人名和笔记在右栏。

小莓文件是 `public/characters/xiaomei/idle-candd-24-still.webp`，宽高属性 640 和 853。页面不裁这张图。文件里透明边和可见身体的比例没有单独量过，所以不写一个身体占比。验收只要求整张图按这个比例完整出现。

## 文字、导航、状态

首页摘要用 `homeNoteLine`：停在句号、问号、叹号，或过长时停在逗号、顿号、分号、冒号、斜线。不加省略号。笔记正文不改。

顶栏用 `headerNav`：知识库、游戏、歌单、关于。站名始终链回首页。三角洲留在 `/delta-gun`，人在工具里时顶栏的「游戏」仍是当前项。写作只在页脚。控件用 `controlClass`，高度 44px。游戏条目的验收在 `ARCHITECTURE.md` 的游戏一节。

| 状态 | 组件 | 访客看见的 |
|---|---|---|
| 有原图 | `FramedStill` | 可点开，Esc 关闭，焦点回到按钮，可打开原图 |
| 原图加载失败 | `FramedStill` | 「这张图没有加载出来。」 |
| 笔记提过画面但没有公开文件 | `WikiFigure` | 「这篇还没有可看的原图。」 |
| 复制成功 / 失败 | `WikiShare` | 「链接已复制」 / 「没有复制成。地址就在浏览器栏里」 |
| 歌单空 | `PlaylistBoard` | 「还没有曲目。」 |
| 歌单错误 | `PlaylistDraft` | 缺字段、过长、非 https、超过 24 条 |
| 写作空 | `EmptyState` | 「还没有文章」 |

静帧用 `fetchPriority="low"`。武器图 `loading="lazy"`。不引用同目录的动画 webp。

## 性能门禁

沿用 DESIGN.md 第 7 节：无 `motion` 的 `initial`，首页空闲不新开 rAF，不加第三层背景，模糊不超过已有上限。构建机器上的测试通过不等于线上。安全通告未修不等于通过。

## 旧规则里已经落地的和只写着的

已经落地：`lab-*` 色、首页人名用 `text-display-hero`、橙色不做首页主按钮、雨在 `RainField`、玻璃仍是 `glassSurfaceClass()`、歌单和分享有成功和失败句。

写了但 A 首页没有照字面做：第 4 节没有 `text-xl` 这一档，主笔记标题现在用了它。第 5 节写首页阅读列 `max-w-3xl`，A 首页外框是 `max-w-6xl`，阅读块才是 `max-w-xl`。这是为了让静帧和文字并排，不是新的色板。若要把标题收回第 4 节的字阶，会改变现在的构图，先不改。

## 参考

只取结构，不取颜色和字体。仓库与许可见该次核对记录，不把文件复制进本仓库。

- 一篇主文、其余是行：<https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/wired/DESIGN.md>
- 画面按原比例，不把主体裁掉：<https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/apple/DESIGN.md>
- 深色页面里让画面占住位置、界面退后：<https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/runwayml/DESIGN.md>
