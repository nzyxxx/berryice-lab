import { Gun } from "@/lib/types/gun";

export const guns: Gun[] = [
  {
    id: "m4a1",
    name: "M4A1",
    type: "assault",
    description: "经典突击步枪，平衡性极佳，适合多数交战距离",
    imageUrl:
      "https://playerhub.df.qq.com/playerhub/60004/object/gun/rifle/m4a1.png",
    attachments: [],
  },
  {
    id: "akm",
    name: "AKM",
    type: "assault",
    description: "高火力突击步枪，中近距离压制能力强",
    imageUrl:
      "https://playerhub.df.qq.com/playerhub/60004/object/gun/rifle/akm.png",
    attachments: [],
  },
  {
    id: "scar",
    name: "SCAR-H",
    type: "assault",
    description: "高精度大口径步枪，中远距离点射稳定",
    imageUrl:
      "https://playerhub.df.qq.com/playerhub/60004/object/gun/rifle/scar-h.png",
    attachments: [],
  },
];

export default guns;
