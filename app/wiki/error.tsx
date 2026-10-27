"use client";

import { StatusAction, StatusScreen } from "@/components/lab/status-screen";
import { useEffect } from "react";

export default function WikiError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusScreen
      code="Wiki / Error"
      title="知识库这一页没打开"
      description={
        error.digest
          ? `读取笔记时出错了，笔记还在。可以重试。错误编号 ${error.digest}。`
          : "读取笔记时出错了，笔记还在。可以重试；如果还不行，先回列表。"
      }
    >
      <StatusAction onClick={() => retry()} variant="primary">
        重试
      </StatusAction>
      <StatusAction href="/wiki">回到知识库</StatusAction>
    </StatusScreen>
  );
}
