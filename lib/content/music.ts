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
    title: "Sirens",
    artist: "Hans Zimmer",
    album: "Odyssey",
    source: "Spotify",
    href: "https://open.spotify.com/",
    tags: ["Epic", "Orchestral"],
    mood: "暴风雨前的海平面",
  },
  {
    id: "m2",
    title: "Wrath of Zeus",
    artist: "Two Steps From Hell",
    source: "Apple Music",
    href: "https://music.apple.com/",
    tags: ["Trailer", "Epic"],
    mood: "雷电交加的山巅",
  },
  {
    id: "m3",
    title: "The Odyssey",
    artist: "Mikis Theodorakis",
    source: "Spotify",
    href: "https://open.spotify.com/",
    tags: ["Greek", "Soundtrack"],
    mood: "归航途中的平静",
  },
  {
    id: "m4",
    title: "O Fortuna",
    artist: "Carl Orff",
    source: "网易云音乐",
    href: "https://music.163.com/",
    tags: ["Classical", "Choral"],
    mood: "命运的不可违抗",
  },
  {
    id: "m5",
    title: "Elysium",
    artist: "Audiomachine",
    source: "Spotify",
    href: "https://open.spotify.com/",
    tags: ["Ambient", "Cinematic"],
    mood: "极乐之地的微光",
  },
];

export const playlists = [
  {
    title: "奥林匹斯神殿",
    description: "诸神、雷电与史诗",
    href: "https://open.spotify.com/",
    count: 42,
  },
  {
    title: "特洛伊灰烬",
    description: "战争、荣誉与悲歌",
    href: "https://open.spotify.com/",
    count: 28,
  },
  {
    title: "归航者",
    description: "奥德赛式的旅程与归乡",
    href: "https://open.spotify.com/",
    count: 15,
  },
];
