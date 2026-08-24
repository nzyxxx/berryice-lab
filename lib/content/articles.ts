export interface ArticleItem {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  tags: string[];
  readingTime: string;
  href: string;
  featured?: boolean;
}

export const articles: ArticleItem[] = [
  {
    id: "a1",
    title: "三角洲改枪实验室：为什么从 guns.gg 爬数据",
    summary:
      "从零开始做一个社区改枪码工具，记录爬虫策略、数据清洗、枪码解析与本地存储的设计取舍。",
    publishedAt: "2026-03-12",
    tags: ["Next.js", "爬虫", "三角洲行动"],
    readingTime: "12 min",
    href: "#",
    featured: true,
  },
  {
    id: "a2",
    title: "用 v0.dev 和 Cursor 做设计系统的极限",
    summary:
      "AI 生成 UI 快，但设计系统的一致性很难保持。我尝试用原子化 token 与模块约束来驯服它。",
    publishedAt: "2026-02-28",
    tags: ["Design System", "AI", "Frontend"],
    readingTime: "8 min",
    href: "#",
  },
  {
    id: "a3",
    title: "夜雨与玻璃：这个个人站的视觉笔记",
    summary:
      "参考 Awwwards SOTD 的交互语言，但不照搬。记录气候、分区、玻璃瓦片与微交互的落地过程。",
    publishedAt: "2026-04-05",
    tags: ["UI", "Animation", "个人站"],
    readingTime: "6 min",
    href: "#",
  },
  {
    id: "a4",
    title: "React 19 + Next.js 16 的真实踩坑记录",
    summary: "Server Components、Suspense、新缓存语义，一个三角洲项目里碰到的边界情况。",
    publishedAt: "2025-11-20",
    tags: ["React", "Next.js", "踩坑"],
    readingTime: "10 min",
    href: "#",
  },
];
