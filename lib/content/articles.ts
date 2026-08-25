export interface ArticleItem {
  id: string;
  arc: string;
  arcId: string;
  episode: number;
  totalEpisodes: number;
  title: string;
  summary: string;
  publishedAt: string;
  tags: string[];
  readingTime: string;
  /** 正文就绪后再填。留空时卡片不渲染成链接，避免出现点了没反应的死链。 */
  href?: string;
  featured?: boolean;
}

export const arcs: { id: string; title: string; color: string; count: number }[] = [
  { id: "odyssey", title: "奥德赛", color: "#38bdf8", count: 5 },
  { id: "iliad", title: "伊利亚特", color: "#f97316", count: 4 },
  { id: "olympus", title: "奥林匹斯诸神", color: "#a78bfa", count: 4 },
  { id: "heroes", title: "英雄与怪物", color: "#34d399", count: 3 },
];

export const articles: ArticleItem[] = [
  {
    id: "odyssey-01",
    arc: "奥德赛",
    arcId: "odyssey",
    episode: 1,
    totalEpisodes: 5,
    title: "第 1 集：特洛伊之后，十年归途 begins",
    summary:
      "奥德修斯是伊塔卡之王，也是特洛伊木马的设计者。战争结束十年，他仍漂泊在外。女神雅典娜向他的儿子忒勒玛科斯显现，揭开寻找父亲的序幕。",
    publishedAt: "2026-08-25",
    tags: ["奥德赛", "荷马史诗", "雅典娜"],
    readingTime: "8 min",
    featured: true,
  },
  {
    id: "odyssey-02",
    arc: "奥德赛",
    arcId: "odyssey",
    episode: 2,
    totalEpisodes: 5,
    title: "第 2 集：独眼巨人波吕斐摩斯",
    summary:
      "奥德修斯带领十二艘船驶入巨人岛，被困在波吕斐摩斯的山洞中。他自称“无人”，用橄榄木桩刺瞎巨人的独眼，带领船员死里逃生。",
    publishedAt: "2026-08-25",
    tags: ["奥德赛", "波吕斐摩斯", "智慧"],
    readingTime: "9 min",
  },
  {
    id: "odyssey-03",
    arc: "奥德赛",
    arcId: "odyssey",
    episode: 3,
    totalEpisodes: 5,
    title: "第 3 集：塞壬的歌声与忘忧果",
    summary:
      "女巫喀耳刻警告奥德修斯前方三险：塞壬、卡律布狄斯与斯库拉。他让船员将自己绑在桅杆上，只为一听那致命的歌声。",
    publishedAt: "2026-08-25",
    tags: ["奥德赛", "塞壬", "诱惑"],
    readingTime: "10 min",
  },
  {
    id: "odyssey-04",
    arc: "奥德赛",
    arcId: "odyssey",
    episode: 4,
    totalEpisodes: 5,
    title: "第 4 集：卡吕普索与搁浅七年",
    summary:
      "海难之后，奥德修斯被仙女卡吕普索囚禁在奥吉吉亚岛七年。她许他以永生，他只想回家。最终赫尔墨斯带来神谕，让他重返大海。",
    publishedAt: "2026-08-25",
    tags: ["奥德赛", "卡吕普索", "归乡"],
    readingTime: "8 min",
  },
  {
    id: "odyssey-05",
    arc: "奥德赛",
    arcId: "odyssey",
    episode: 5,
    totalEpisodes: 5,
    title: "第 5 集：伊塔卡的王位与最后一战",
    summary:
      "乔装乞丐回到宫殿，奥德修斯通过妻子的试探，拉开神弓，射杀所有求婚者。二十年的离别，在一场血战后重归宁静。",
    publishedAt: "2026-08-25",
    tags: ["奥德赛", "伊塔卡", "复仇"],
    readingTime: "11 min",
  },
  {
    id: "iliad-01",
    arc: "伊利亚特",
    arcId: "iliad",
    episode: 1,
    totalEpisodes: 4,
    title: "第 1 集：阿喀琉斯的愤怒",
    summary:
      "希腊联军围困特洛伊九年。阿伽门农抢走阿喀琉斯的战利品布里塞伊斯，阿喀琉斯愤而罢战。荷马史诗的第一句，就是“歌唱吧，女神，歌唱阿喀琉斯的愤怒”。",
    publishedAt: "2026-08-25",
    tags: ["伊利亚特", "阿喀琉斯", "荣誉"],
    readingTime: "9 min",
  },
  {
    id: "iliad-02",
    arc: "伊利亚特",
    arcId: "iliad",
    episode: 2,
    totalEpisodes: 4,
    title: "第 2 集：赫克托耳与安德洛玛刻",
    summary:
      "特洛伊最勇的王子赫克托耳出城迎战。临行前，妻子安德洛玛刻抱着儿子恳求他留下。他知道自己命运已定，却仍选择为城邦而战。",
    publishedAt: "2026-08-25",
    tags: ["伊利亚特", "赫克托耳", "命运"],
    readingTime: "9 min",
  },
  {
    id: "iliad-03",
    arc: "伊利亚特",
    arcId: "iliad",
    episode: 3,
    totalEpisodes: 4,
    title: "第 3 集：帕特罗克洛斯之死",
    summary:
      "阿喀琉斯的朋友帕特罗克洛斯穿上他的盔甲出战，却被赫克托耳所杀。阿喀琉斯决定重新披上铠甲，即使母亲忒提斯预言他必将死去。",
    publishedAt: "2026-08-25",
    tags: ["伊利亚特", "帕特罗克洛斯", "复仇"],
    readingTime: "10 min",
  },
  {
    id: "iliad-04",
    arc: "伊利亚特",
    arcId: "iliad",
    episode: 4,
    totalEpisodes: 4,
    title: "第 4 集：拖尸与和解",
    summary:
      "阿喀琉斯在城外击杀赫克托耳，拖尸泄愤。最终普里阿摩斯老王深夜潜入敌营，赎回儿子的遗体。两个父亲在火光中共同落泪。",
    publishedAt: "2026-08-25",
    tags: ["伊利亚特", "普里阿摩斯", "怜悯"],
    readingTime: "11 min",
  },
  {
    id: "olympus-01",
    arc: "奥林匹斯诸神",
    arcId: "olympus",
    episode: 1,
    totalEpisodes: 4,
    title: "第 1 集：宙斯推翻克洛诺斯",
    summary:
      "克洛诺斯吞掉自己的子女，唯有宙斯被母亲瑞亚藏起。宙斯长大后迫使父亲吐出兄弟姐妹，发动泰坦之战，最终成为第三代神王。",
    publishedAt: "2026-08-25",
    tags: ["宙斯", "泰坦", "权力"],
    readingTime: "8 min",
  },
  {
    id: "olympus-02",
    arc: "奥林匹斯诸神",
    arcId: "olympus",
    episode: 2,
    totalEpisodes: 4,
    title: "第 2 集：普罗米修斯盗火",
    summary:
      "普罗米修斯用泥土造人，又从奥林匹斯盗火赠予人类。宙斯将他锁在高加索山，每日有鹰啄食其肝，夜晚复生。直到半神赫拉克勒斯将他解救。",
    publishedAt: "2026-08-25",
    tags: ["普罗米修斯", "盗火", "惩罚"],
    readingTime: "9 min",
  },
  {
    id: "olympus-03",
    arc: "奥林匹斯诸神",
    arcId: "olympus",
    episode: 3,
    totalEpisodes: 4,
    title: "第 3 集：珀耳塞福涅与四季",
    summary:
      "冥王哈迪斯掳走谷物女神德墨忒尔之女。德墨忒尔让大地荒芜，宙斯出面调停。珀耳塞福涅每年三分之一时间在冥界，于是人间有了秋冬。",
    publishedAt: "2026-08-25",
    tags: ["冥界", "四季", "德墨忒尔"],
    readingTime: "8 min",
  },
  {
    id: "olympus-04",
    arc: "奥林匹斯诸神",
    arcId: "olympus",
    episode: 4,
    totalEpisodes: 4,
    title: "第 4 集：赫菲斯托斯的锻造与复仇",
    summary:
      "赫菲斯托斯天生跛足，被母亲赫拉抛下山崖。他在火山深处锻造出神兵与金网，最终用精巧的陷阱捉住背叛自己的妻子阿佛洛狄忒与战神阿瑞斯。",
    publishedAt: "2026-08-25",
    tags: ["赫菲斯托斯", "锻造", "复仇"],
    readingTime: "9 min",
  },
  {
    id: "heroes-01",
    arc: "英雄与怪物",
    arcId: "heroes",
    episode: 1,
    totalEpisodes: 3,
    title: "第 1 集：赫拉克勒斯的十二试炼",
    summary:
      "赫拉克勒斯因赫拉的诅咒发疯杀死妻儿，为赎罪接受十二项试炼。他扼死涅墨亚狮子，斩杀九头蛇，牵回冥界三头犬，最终完成凡人的升华。",
    publishedAt: "2026-08-25",
    tags: ["赫拉克勒斯", "十二试炼", "英雄"],
    readingTime: "10 min",
  },
  {
    id: "heroes-02",
    arc: "英雄与怪物",
    arcId: "heroes",
    episode: 2,
    totalEpisodes: 3,
    title: "第 2 集：忒修斯与米诺陶洛斯",
    summary:
      "克里特岛迷宫深处囚禁着牛头人米诺陶洛斯。王子忒修斯自愿进入，用阿里阿德涅的线团找到出口，用短剑终结了怪物与雅典纳贡的耻辱。",
    publishedAt: "2026-08-25",
    tags: ["忒修斯", "米诺陶洛斯", "迷宫"],
    readingTime: "9 min",
  },
  {
    id: "heroes-03",
    arc: "英雄与怪物",
    arcId: "heroes",
    episode: 3,
    totalEpisodes: 3,
    title: "第 3 集：珀尔修斯斩杀美杜莎",
    summary:
      "珀尔修斯为救母亲，答应取下戈耳工美杜莎的头颅。他借来哈迪斯的隐身盔、赫尔墨斯的飞鞋与雅典娜的盾，在铜盾倒影中砍下蛇发女妖的头。",
    publishedAt: "2026-08-25",
    tags: ["珀尔修斯", "美杜莎", "雅典娜"],
    readingTime: "9 min",
  },
];
