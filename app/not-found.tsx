import { StatusAction, StatusScreen } from "@/components/lab/status-screen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  // 后缀由根布局的 title.template 补，这里再写一遍会变成两个 BerryIce Lab
  title: "页面走失了",
};

export default function NotFound() {
  return (
    <StatusScreen
      code="404 / Lost"
      title="这条路通向雨里"
      description="你要找的页面不存在，或者已经被移走了。回到门户挑一个模块继续吧。"
    >
      <StatusAction href="/" variant="primary">
        回到门户
      </StatusAction>
      <StatusAction href="/delta-gun">去三角洲</StatusAction>
    </StatusScreen>
  );
}
