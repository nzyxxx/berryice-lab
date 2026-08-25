"use client";

import { StatusAction, StatusScreen } from "@/components/lab/status-screen";
import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusScreen
      code="500 / Storm"
      title="这里劈了一道雷"
      description={
        error.digest
          ? `页面渲染时出错了，可以重试一次。错误编号 ${error.digest}。`
          : "页面渲染时出错了，可以重试一次；如果还不行，先回门户。"
      }
    >
      <StatusAction onClick={() => unstable_retry()} variant="primary">
        重试
      </StatusAction>
      <StatusAction href="/">回到门户</StatusAction>
    </StatusScreen>
  );
}
