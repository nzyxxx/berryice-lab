import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "BerryIce Lab · 三角洲改枪实验室与学习记录";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * next/og 自带字体没有中文字形，缺字时会去 Google Fonts 现拉，
 * 拉不到就整片渲染成豆腐块。这里改成读仓库里的子集字体（只含本图用到的汉字，
 * 每个字重约 7KB，SIL OFL 协议可内嵌分发），构建与运行都不再依赖网络。
 */
async function loadFonts() {
  const [regular, bold] = await Promise.all([
    readFile(join(process.cwd(), "assets/NotoSansSC-400-subset.ttf")),
    readFile(join(process.cwd(), "assets/NotoSansSC-700-subset.ttf")),
  ]);

  return [
    { name: "Noto Sans SC", data: regular, style: "normal" as const, weight: 400 as const },
    { name: "Noto Sans SC", data: bold, style: "normal" as const, weight: 700 as const },
  ];
}

export default async function OpengraphImage() {
  const fonts = await loadFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#08090d",
          backgroundImage:
            "radial-gradient(900px 460px at 50% -12%, rgba(56,189,248,0.20), transparent 60%)",
          color: "#e8ecf3",
          fontFamily: "Noto Sans SC, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#38bdf8",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: 999,
              border: "1px solid rgba(56,189,248,0.4)",
              background: "rgba(56,189,248,0.14)",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            B
          </div>
          BerryIce Lab
        </div>

        <div style={{ display: "flex", marginTop: 40, fontSize: 76, fontWeight: 700, letterSpacing: -2 }}>
          三角洲改枪实验室
        </div>

        <div style={{ display: "flex", marginTop: 24, fontSize: 30, color: "#9aa4b2" }}>
          枪械库 · 主播枪码 · 社区配装 · 希腊神话剧场
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "auto",
            fontSize: 22,
            color: "#5b6472",
          }}
        >
          berryice.cn
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
