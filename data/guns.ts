import { Gun } from "@/lib/types/gun";

export const guns: Gun[] = [
  {
    id: "m4a1",
    name: "M4A1",
    type: "assault",
    description: "经典突击步枪，平衡性极佳",
    attachments: [], // 当前已选配件（初始为空）
  },
  {
    id: "akm",
    name: "AKM",
    type: "assault",
    description: "高火力突击步枪，适合中近距离作战",
    attachments: [],
  },
  {
    id: "scar",
    name: "SCAR-H",
    type: "assault",
    description: "高精度突击步枪，适合远距离",
    attachments: [],
  },
];

export default guns;