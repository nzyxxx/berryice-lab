import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "小莓流冰（BerryIce）的个人站点。项目、文章、实验室、关于与生活。";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * next/og 自带字体没有中文字形，缺字时会去 Google Fonts 现拉，
 * 拉不到就整片渲染成豆腐块。这里改成读仓库里的子集字体（只含本图用到的字形，
 * SIL OFL，可内嵌分发），构建与运行都不再依赖网络。
 *
 * 改这张图的汉字之前，先确认 assets/NotoSansSC-*-subset.ttf 里有这些字：
 * 个人站点小莓流冰项目作品文章实验室关于我生活兴趣更多
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

const modules = ["项目 / 作品", "文章", "实验室", "关于我", "生活 / 兴趣", "更多"];

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
          padding: "76px 84px",
          background: "#08090d",
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
            color: "#8b93a7",
          }}
        >
          <div style={{ display: "flex" }}>个人站点</div>
          <div style={{ display: "flex", letterSpacing: 0 }}>berryice.cn</div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 48,
            fontSize: 92,
            fontWeight: 700,
            letterSpacing: -3,
            lineHeight: 1,
          }}
        >
          小莓流冰
        </div>

        <div style={{ display: "flex", marginTop: 16, fontSize: 32, color: "#8b93a7" }}>
          BerryIce
        </div>

        <div style={{ display: "flex", flexGrow: 1 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[modules.slice(0, 3), modules.slice(3)].map((row) => (
            <div key={row[0]} style={{ display: "flex", gap: 16 }}>
              {row.map((label) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    flexGrow: 1,
                    flexBasis: 0,
                    alignItems: "center",
                    height: 64,
                    padding: "0 20px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.12)",
                    fontSize: 24,
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
