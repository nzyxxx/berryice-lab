import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "小莓流冰（BerryIce）的个人站点。学无止境：写作、随记、关于，以及一个三角洲专栏。";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * next/og 自带字体没有中文字形，缺字时会去 Google Fonts 现拉，
 * 拉不到就整片渲染成豆腐块。这里改成读仓库里的子集字体（只含本图用到的字形，
 * SIL OFL，可内嵌分发），构建与运行都不再依赖网络。
 *
 * 改这张图的汉字之前，先确认 assets/NotoSansSC-*-subset.ttf 里有这些字：
 * 个人站点小莓流冰学无止境写作随记关于以及一个三角洲工具专栏枪械库社区改枪码主播配装现在
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
          padding: "72px 80px",
          background: "#08090d",
          backgroundImage:
            "radial-gradient(720px 420px at 0% 0%, rgba(56,189,248,0.16), transparent 62%)",
          color: "#f4f6fb",
          fontFamily: "Noto Sans SC, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#38bdf8",
          }}
        >
          <div style={{ display: "flex" }}>个人站点</div>
          <div style={{ display: "flex", letterSpacing: 0, textTransform: "none", color: "#8b93a7" }}>
            berryice.cn
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 36,
            fontSize: 92,
            fontWeight: 700,
            letterSpacing: -3,
            lineHeight: 1,
          }}
        >
          小莓流冰
        </div>

        <div style={{ display: "flex", marginTop: 18, fontSize: 30, color: "#38bdf8" }}>
          BerryIce · nzyxxx
        </div>

        <div style={{ display: "flex", marginTop: 28, fontSize: 36, color: "#c8d0e0" }}>
          学无止境
        </div>

        <div style={{ display: "flex", flexGrow: 1 }} />

        <div
          style={{
            display: "flex",
            height: 1,
            background: "rgba(255,255,255,0.14)",
          }}
        />

        <div style={{ display: "flex", marginTop: 28, gap: 28 }}>
          {[
            { index: "01", title: "写作", detail: "随记" },
            { index: "02", title: "关于", detail: "现在" },
            { index: "03", title: "三角洲专栏", detail: "枪械库 · 社区改枪码 · 主播配装" },
          ].map((item) => (
            <div
              key={item.index}
              style={{
                display: "flex",
                flexDirection: "column",
                width: 320,
                padding: "18px 20px",
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div style={{ display: "flex", fontSize: 16, letterSpacing: 2, color: "#8b93a7" }}>
                {item.index}
              </div>
              <div style={{ display: "flex", marginTop: 10, fontSize: 28, fontWeight: 700 }}>
                {item.title}
              </div>
              <div style={{ display: "flex", marginTop: 8, fontSize: 18, color: "#8b93a7" }}>
                {item.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
