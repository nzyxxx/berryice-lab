export interface TrackItem {
  id: string;
  title: string;
  artist: string;
  album?: string;
  source: string;
  href: string;
  tags: string[];
  mood: string;
}

export const nowListening: TrackItem[] = [
  {
    id: "m1",
    title: "雨とカプチーノ",
    artist: "ヨルシカ",
    album: "エイミー",
    source: "Spotify",
    href: "https://open.spotify.com/",
    tags: ["J-Pop", "雨天"],
    mood: "适合写代码的雨夜",
  },
  {
    id: "m2",
    title: "Midnight City",
    artist: "M83",
    album: "Hurry Up, We're Dreaming",
    source: "Apple Music",
    href: "https://music.apple.com/",
    tags: ["Synthwave", "电子"],
    mood: "开车或者改枪调试时听",
  },
  {
    id: "m3",
    title: "Numb",
    artist: "Linkin Park",
    album: "Meteora",
    source: "Spotify",
    href: "https://open.spotify.com/",
    tags: ["摇滚", "经典"],
    mood: "射击训练节奏",
  },
  {
    id: "m4",
    title: "Past Lives",
    artist: "BØRNS",
    album: "Dopamine",
    source: "网易云音乐",
    href: "https://music.163.com/",
    tags: ["Indie", "轻松"],
    mood: "整理笔记和思路",
  },
  {
    id: "m5",
    title: "赛博朋克：边缘行者 OST",
    artist: "Various Artists",
    source: "Spotify",
    href: "https://open.spotify.com/",
    tags: ["OST", "赛博朋克"],
    mood: "灵感催化剂",
  },
];

export const playlists = [
  {
    title: "雨天写代码",
    description: "低能量、高专注、不带人声",
    href: "https://open.spotify.com/",
    count: 42,
  },
  {
    title: "三角洲训练集",
    description: "节奏感强，适合练枪",
    href: "https://open.spotify.com/",
    count: 28,
  },
  {
    title: "灵感碎片",
    description: "奇怪风格、实验性声音",
    href: "https://open.spotify.com/",
    count: 15,
  },
];
