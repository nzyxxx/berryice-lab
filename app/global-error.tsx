"use client";

/**
 * 根布局自身崩溃时的兜底，必须自带 html/body。
 * 这里刻意用内联样式：走到这一步说明外层什么都不可靠了，不能再依赖样式表加载成功。
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#08090d",
          color: "#e8ecf3",
          fontFamily:
            "system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif",
        }}
      >
        <div style={{ maxWidth: "34rem", padding: "2rem", textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#38bdf8",
            }}
          >
            Fatal / Storm
          </p>
          <h1 style={{ margin: "0.75rem 0 0", fontSize: "1.75rem", fontWeight: 600 }}>
            整站都被雷劈了
          </h1>
          <p style={{ margin: "0.75rem 0 0", fontSize: "0.875rem", color: "#9aa4b2", lineHeight: 1.7 }}>
            根布局加载失败。刷新一次通常就能恢复。
            {error.digest ? `错误编号 ${error.digest}。` : null}
          </p>
          <button
            type="button"
            onClick={() => unstable_retry()}
            style={{
              marginTop: "2rem",
              minHeight: "2.75rem",
              padding: "0 1.5rem",
              borderRadius: "999px",
              border: "1px solid rgba(56,189,248,0.35)",
              background: "rgba(56,189,248,0.12)",
              color: "#38bdf8",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            重试
          </button>
        </div>
      </body>
    </html>
  );
}
