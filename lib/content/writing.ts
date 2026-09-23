/**
 * 写作。长文和随记放在一起 —— 它们是同一件事的两种长度，不值得拆成两个模块。
 *
 * `href` 是必填的，这不是疏忽：上一版这里躺着 16 篇 `href` 为空的文章，
 * 页面照样把它们渲染成卡片，看着能点，点了停在原地。
 * 类型上强制要求目的地之后，没写完的东西就摆不上来了。
 *
 * 加内容就往下面两个数组里塞，页面会自己从空状态切回列表。
 */

export interface Article {
  id: string;
  title: string;
  summary: string;
  /** ISO 日期，例 "2026-09-23" */
  publishedAt: string;
  /** 例 "8 min" */
  readingTime: string;
  tags: string[];
  /** 正文地址。站内用 "/..."，站外用完整 URL */
  href: string;
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  tags: string[];
  /** 这条随记从哪儿来的，例 "备忘录" */
  source?: string;
}

export const articles: Article[] = [];

export const notes: Note[] = [];
