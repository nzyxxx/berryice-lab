export interface NoteItem {
  id: string;
  content: string;
  createdAt: string;
  tags: string[];
  source?: string;
}

export const notes: NoteItem[] = [
  {
    id: "n1",
    content:
      "神话之所以不朽，是因为每一代人都能在其中找到自己的奥德赛。",
    createdAt: "2026-08-24",
    tags: ["希腊神话", "奥德赛"],
  },
  {
    id: "n2",
    content:
      "宙斯的雷电象征不可违抗的秩序，但奥林匹斯诸神本身也嫉妒、争吵、犯错。神性与人性的距离，也许只隔着一场暴风雨。",
    createdAt: "2026-08-21",
    tags: ["宙斯", "奥林匹斯"],
  },
  {
    id: "n3",
    content:
      "塞壬的歌声是危险的知识：你知道它很美，也知道它会让你触礁。这种矛盾是所有诱惑的本质。",
    createdAt: "2026-08-18",
    tags: ["奥德赛", "塞壬", "隐喻"],
  },
  {
    id: "n4",
    content:
      "赫菲斯托斯被抛下山崖，却用神火锻造出最美的武器。残缺与创造之间，常有神话里才有的张力。",
    createdAt: "2026-08-12",
    tags: ["赫菲斯托斯", "创造"],
  },
  {
    id: "n5",
    content:
      "普罗米修斯为人类盗火，甘愿被缚于高加索山。神话里的惩罚越重，馈赠越珍贵。",
    createdAt: "2026-08-05",
    tags: ["普罗米修斯", "牺牲"],
    source: "备忘录",
  },
];
