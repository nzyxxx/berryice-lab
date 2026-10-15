# 第三方

三角洲页用到的开源实现。只取了能放进现有性能预算的部分：空闲时不跑动画帧，流体画布保持 192×108。

## 用了

### 流体渐变

- 仓库：<https://github.com/metaory/gradient-gl>
- 许可：MIT，Copyright (c) 2025 metaory
- 用在：`components/delta-gun/fluid-field.tsx`
- 取了 `shaders/common.glsl.js` 的二维梯度噪声，以及 `shaders/c1.glsl.js` 里两路噪声推着采样点走的写法。改成 WebGL1，颜色收成夜蓝。鼠标停住之后不再请求动画帧，所以没有沿用它自己的持续计时。

### 玻璃卡环的松手吸附

- 仓库：<https://github.com/Yousuf-developer/liquid-glass-carousel>
- 许可：MIT，Copyright (c) 2026 Yousuf Soomro
- 用在：`components/delta-gun/glass-ring.tsx`
- 取了松手后的摩擦衰减（原常量 `FRICTION` 0.865），速度落到阈值以下再滑向最近的一张卡。环仍是 CSS `preserve-3d`。没有引入 three.js、GSAP，也没有整屏折射镜头。

### 粒子卡

- 仓库：<https://github.com/blakecarroll/particle-saga>
- 许可：MIT，Copyright (c) 2014 Blake Carroll
- 用在：`components/delta-gun/particle-card.tsx`
- 取了 `ImageTarget` 的采样：把内容画进画布，留下 alpha 大于 0 的像素，再从这些像素里随机取点。每张卡只画一次，贴成静态底图。没有引入 three.js 粒子池，也没有逐帧重排。

## 看过，没有搬进来

这些也是同类参考，整包放进来会在这台机器上常驻动画帧，或者许可不是干净的 MIT。

- <https://github.com/PavelDoGreat/WebGL-Fluid-Simulation>，MIT。多遍纳维-斯托克斯流体，空闲时也在跑，4 倍 CPU 节流下守不住 60 帧。
- <https://github.com/Yousuf-developer/Viscose-carousel>。整环是一张全屏着色器，而且仓库许可在 GitHub 上是 Other：说明文字写源码 MIT，但自带的 PP Neue Montreal 不在该许可里。
- <https://github.com/Oliverrr2424/webgl-apple-liquid-glass>，MIT。每帧把玻璃背后的页面重画进纹理，超出本站的模糊和帧预算。
