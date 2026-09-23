# UI

**机器（硬约束，优先于下面所有准则）**：线上是 2 vCPU / 2 GiB，系统里大约 1.6 GiB。运行时禁止常驻 rAF、禁止多余的全屏合成层、禁止把构建堆设到 768MB 以上。发布按 `scripts/deploy.sh`，不要在这台机器上开并行构建。  
**第一准则**：动效优先 React Bits / Aceternity UI / Uiverse.io / OriginKit / Aura.build。  
**气候**：全站夜雨（`RainField`），交互语言跟 `DESIGN.md`（SOTG：油膜悬停、点击脉冲、玻璃瓦片入场）。  
**分区**：先读 `ARCHITECTURE.md`，再改页面。壳层 `components/lab/*` + `lab-*` token。同一屏 2–3 个效果。不改社区列表/枪码主路径来做装饰。  
**动效预算（硬约束，优先于第一准则）**：入场动画用 CSS，禁止 `motion` 的 `initial`（会写进 SSR 产物 → 首屏白屏）；页面空闲时常驻 rAF 必须为 0；`backdrop-blur` 不超过 `lg`。细则见 `DESIGN.md` 第 7 节。

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
