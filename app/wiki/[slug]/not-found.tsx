import { StatusAction, StatusScreen } from "@/components/lab/status-screen";

export default function WikiNoteNotFound() {
  return (
    <StatusScreen
      code="404 / Note"
      title="这篇笔记不在了"
      description="链接可能不对，或者这篇已经从知识库删掉。列表里还看得到别的笔记。"
    >
      <StatusAction href="/wiki" variant="primary">
        回到知识库
      </StatusAction>
      <StatusAction href="/">回到门户</StatusAction>
    </StatusScreen>
  );
}
