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
      "好的个人站不是作品集，而是气质的延伸。你打开它，应该立刻知道这个人喜欢什么、最近在忙什么。",
    createdAt: "2026-08-20",
    tags: ["设计", "思考"],
  },
  {
    id: "n2",
    content:
      "三角洲改枪里最有意思的不是最优配装，而是每个人对'手感'的执念。数据只能给下限，体验给上限。",
    createdAt: "2026-08-18",
    tags: ["游戏", "产品"],
  },
  {
    id: "n3",
    content: "做动画的最高境界是用户觉得'舒服'，而不是'好炫'。炫是副作用，不是目的。",
    createdAt: "2026-08-15",
    tags: ["动画", "UX"],
  },
  {
    id: "n4",
    content: "尝试把听歌状态自动同步到个人站。网易云没有公开 API，Spotify 有。先做 Spotify。",
    createdAt: "2026-08-10",
    tags: ["音乐", "自动化"],
    source: "备忘录",
  },
  {
    id: "n5",
    content:
      "RainField 的帧率比想象中难稳。减少雨滴数量、降低 canvas scale、用 requestAnimationFrame 不重新创建对象。",
    createdAt: "2026-08-08",
    tags: ["性能", "Canvas"],
  },
];
