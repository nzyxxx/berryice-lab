/**
 * 小莓妹的台词。对外就叫这个名字。性格是傲娇·嘴硬·心软。
 * 格言来自签过的对话稿。口语短句，不讨好，也不骂人。
 * 没标档的是经典傲娇。guarded / warm / close 按好感档混进去。
 */

import type { XiaomeiTone } from "./xiaomei-memory";

/** 对外称呼。路径、存储键和接口仍用 xiaomei。签过的稿写「小莓」，后来定名小莓妹。 */
export const XIAOMEI_NAME = "小莓妹";

export const XIAOMEI_SAY_EVENT = "xiaomei:say";

export const XIAOMEI_MOODS = ["happy", "sad", "blank", "annoyed", "content"] as const;

export type XiaomeiMood = (typeof XIAOMEI_MOODS)[number];

export type XiaomeiSayDetail = {
  mood: XiaomeiMood;
  text?: string;
};

export type XiaomeiSpokenLine = {
  mood: XiaomeiMood;
  text: string;
  tone?: XiaomeiTone;
};

/** 签过的格言。偶尔出现，不要每句都念。 */
export const XIAOMEI_CATCHPHRASE = "哼……人家才不会随便甜给你。";

/** 换图时把 v 加一，浏览器缓存才会失效。 */
const XIAOMEI_SPRITE_VERSION = 3;

export const XIAOMEI_SPRITE: Record<XiaomeiMood, string> = {
  happy: `/xiaomei/happy.webp?v=${XIAOMEI_SPRITE_VERSION}`,
  sad: `/xiaomei/sad.webp?v=${XIAOMEI_SPRITE_VERSION}`,
  blank: `/xiaomei/blank.webp?v=${XIAOMEI_SPRITE_VERSION}`,
  annoyed: `/xiaomei/annoyed.webp?v=${XIAOMEI_SPRITE_VERSION}`,
  content: `/xiaomei/content.webp?v=${XIAOMEI_SPRITE_VERSION}`,
};

export const XIAOMEI_LINES: Record<XiaomeiMood, readonly string[]> = {
  content: [
    XIAOMEI_CATCHPHRASE,
    "才不是在等你。只是刚好啦。",
    "哼，你来了。我看见了。",
    "说嘛，我听着呢。",
    "想看的我搁手边啦。慢慢翻。",
  ],
  happy: ["哼，今天还算可以啦。", "看到你了。才没有开心呢。", "你来得正好。我记住了哦。"],
  blank: ["等一下嘛，我在想。", "别催啦，我还在找呢。", "让我看看呀。", "嗯，我听到了哦。"],
  annoyed: ["出错了啦。我再看看。", "这次没成。你别慌呀。", "哼，没成也不算完。", "没接上。换个说法嘛。"],
  sad: ["也不是很难过啦。你在就好。", "哼，我没事。你别走远。", "你别安慰。我自己缓一缓呀。"],
};

/**
 * 聊天状态的短反应，不是模型那句回复。
 * thinking 钉空白，done 钉开心或满足，error 钉不高兴。停一下就回到待机。
 */
export const XIAOMEI_SCENE_LINES = {
  idle: [
    "我在这儿。你忙你的。",
    "没叫你。只是看着。",
    "风还在。我没躲。",
    "想说了再来戳我。",
    "哼，我又没走开。",
    "角落还空着。你知道。",
  ],
  thinking: [
    "等一下，我在想。",
    "别催。我听见了。",
    "嗯……让我想想。",
    "先别走。还没想好。",
    "卡了一下。不是不理你。",
    "我在挑一句。你等着。",
  ],
  done: [
    "想好啦。你看。",
    "哼，说完了。还听吗。",
    "就这些。才不是敷衍。",
    "好啦，我讲完了。",
    "嗯，这句给你。",
    "说完啦。没懂再问。",
  ],
  error: [
    "出错了啦。你再说一遍。",
    "这次没接上。别慌。",
    "哼，线断了。不是我不会。",
    "没送出去。换个说法。",
    "我卡住了。你等一下。",
    "这次不算。再来呀。",
  ],
} as const;

/** 完成或出错的脸只钉这么一会儿，然后回到待机。思考态一直钉到回复结束。 */
export const XIAOMEI_SCENE_PIN_MS = 1800;

/** 指针靠近时说。比单击尖一点，但不是赶人。脸跟这句话走。 */
export const XIAOMEI_HOVER_LINES: readonly XiaomeiSpokenLine[] = [
  { mood: "annoyed", text: "看什么看……我又没躲。" },
  { mood: "content", text: "有事就说嘛，别只看着。" },
  { mood: "content", text: "哼，靠近一点也没关系。" },
  { mood: "happy", text: "我又不会跑。你过来呀。" },
  { mood: "annoyed", text: "干嘛靠这么近。我、我没躲。" },
  { mood: "annoyed", text: "眼睛往哪看呢。哼。" },
  { mood: "content", text: "靠这么近，我耳朵会热。" },
  { mood: "happy", text: "看够了没呀。我还在。" },
  { mood: "annoyed", text: "哼，你的眼睛好直白。" },
  { mood: "content", text: "过来就过来嘛。我没躲。" },
  { mood: "content", text: "影子盖过来了。我没躲。" },
  { mood: "blank", text: "近是近了。发呆被看见了。" },
  { mood: "happy", text: "你停这儿。我没说不行。" },
  { mood: "annoyed", tone: "guarded", text: "看什么看。没邀请你。" },
  { mood: "annoyed", tone: "guarded", text: "哼。靠这么近干什么。" },
  { mood: "blank", tone: "guarded", text: "有事就说。别只悬着。" },
  { mood: "annoyed", tone: "guarded", text: "眼睛别停在我脸上。" },
  { mood: "annoyed", tone: "guarded", text: "再看我就鼓一下。哼。" },
  { mood: "content", tone: "guarded", text: "才不是摆给你看的。" },
  { mood: "content", tone: "warm", text: "靠近就靠近。我没生气。" },
  { mood: "sad", tone: "warm", text: "你今天看起来有点累。" },
  { mood: "happy", tone: "warm", text: "要是冷，就再近一点。" },
  { mood: "content", tone: "warm", text: "我没躲。你过来呀。" },
  { mood: "happy", tone: "warm", text: "看见你，气就软一点。" },
  { mood: "content", tone: "warm", text: "站一会儿也行。我看着。" },
  { mood: "happy", tone: "close", text: "你来了，肩膀松一点。" },
  { mood: "sad", tone: "close", text: "…想你了。就说一遍。" },
  { mood: "content", tone: "close", text: "靠着吧。我允许这一下。" },
  { mood: "happy", tone: "close", text: "看见你，就没那么冷。" },
  { mood: "content", tone: "close", text: "你在，我就不转开脸。" },
  { mood: "happy", tone: "close", text: "这点距离刚好。别远。" },
];

/**
 * 单击回复。随机抽，不按情绪排队。
 * 脸跟这句话走，所以同一句不会今天开心、明天皱眉。
 */
export const XIAOMEI_CLICK_LINES: readonly XiaomeiSpokenLine[] = [
  { mood: "annoyed", tone: "guarded", text: "哼，干嘛戳人家。" },
  { mood: "annoyed", tone: "guarded", text: "…有事快说。" },
  { mood: "blank", tone: "guarded", text: "才、才没有在发呆。" },
  { mood: "annoyed", text: "围裙皱了啦，你赔。" },
  { mood: "content", text: "这才不是叫你随便点的按钮。" },
  { mood: "happy", tone: "warm", text: "哼。才没有担心你。" },
  { mood: "content", tone: "warm", text: "要是累了…人家可以听一下。" },
  { mood: "happy", tone: "close", text: "…你还好吗。才不是特意问。" },
  { mood: "annoyed", tone: "guarded", text: "哼。戳我干嘛。" },
  { mood: "annoyed", tone: "guarded", text: "哼。谁让你靠这么近。" },
  { mood: "content", tone: "guarded", text: "有事快说嘛。我听着。" },
  { mood: "annoyed", tone: "guarded", text: "别笑。才不是在等。" },
  { mood: "annoyed", tone: "guarded", text: "再戳就鼓脸。哼。" },
  { mood: "content", tone: "guarded", text: "哼。话放这儿了。自己拿。" },
  { mood: "blank", tone: "guarded", text: "看什么呀。我又不会躲。" },
  { mood: "sad", tone: "guarded", text: "我才没有想你。哼。" },
  { mood: "happy", tone: "close", text: "你来啦。才没有在等。" },
  { mood: "happy", tone: "close", text: "嗯……靠近一点也行呀。" },
  { mood: "content", tone: "close", text: "看到你就松了口气。别笑嘛。" },
  { mood: "happy", tone: "close", text: "你在的话，我就不鼓脸啦。" },
  { mood: "content", tone: "close", text: "这句放你手边。才不是特意。" },
  { mood: "sad", tone: "close", text: "我记得你来过哦。就一点点。" },
  { mood: "happy", tone: "close", text: "今天的好话留给你。哼。" },
  { mood: "content", tone: "close", text: "你留下嘛。我也不是不行。" },
  { mood: "content", text: "哼，戳我干嘛啦。我在的。" },
  { mood: "content", text: "才、才不是在等你。只是刚好。" },
  { mood: "content", text: "你来了呀。我看见了。" },
  { mood: "content", text: "说嘛，我听着呢。" },
  { mood: "content", text: "别急啦，我又没跑。" },
  { mood: "happy", text: "今天风凉凉的。你冷不冷呀。" },
  { mood: "happy", text: "嗯……有事就靠过来呀。" },
  { mood: "content", text: "想看的我搁手边啦。慢慢翻。" },
  { mood: "content", text: "雨还在下呢。我没躲。" },
  { mood: "content", text: "才不是特意停在这儿的。" },
  { mood: "happy", text: "看到你了。才没有开心呢。" },
  { mood: "happy", text: "哼，今天还算可以啦。" },
  { mood: "happy", text: "你来得正好。我记住了哦。" },
  { mood: "happy", text: "这样看着……还、还行吧。" },
  { mood: "happy", text: "行吧，算你准时。就一点点。" },
  { mood: "content", text: "发卡还别着。不许笑我哦。" },
  { mood: "happy", text: "哼，被你找到了。没关系啦。" },
  { mood: "content", text: "你要笑的话，我也不是不行呀。" },
  { mood: "annoyed", text: "干嘛呀。我又没生气。" },
  { mood: "annoyed", text: "别光看着啦。我又不会躲。" },
  { mood: "blank", text: "我在想事情呢。你先待着。" },
  { mood: "blank", text: "等一下嘛，我在发呆。" },
  { mood: "blank", text: "让我看看呀。你先别走。" },
  { mood: "sad", text: "也不是难过啦。你在就好。" },
  { mood: "sad", text: "哼，我没事。你别走远哦。" },
  { mood: "content", text: "围裙歪了一点。别盯着看嘛。" },
  { mood: "content", text: "才不是心软。就这一下哦。" },
  { mood: "annoyed", text: "要走跟我说一声嘛。哼。" },
  { mood: "content", text: "戳一下就行啦。我又不会碎。" },
  { mood: "happy", text: "哼，手凉凉的。你在外面吧。" },
  { mood: "content", text: "我在听呀。你倒是出声。" },
  { mood: "annoyed", text: "才不是想被你摸头。哼。" },
  { mood: "content", text: "你今天来得有点晚。才没有数。" },
  { mood: "blank", text: "雨声盖过脚步啦。我还在。" },
  { mood: "content", text: "想说什么就说嘛。我没堵着。" },
  { mood: "happy", text: "围裙口袋里没藏东西。真的。" },
  { mood: "content", text: "你笑的话，我可以不鼓脸。" },
  { mood: "happy", text: "嗯……这次算你找到我了。" },
  { mood: "sad", text: "我把今天的话留了一点。哼。" },
  { mood: "annoyed", text: "别戳发卡。会歪的。" },
  { mood: "content", tone: "warm", text: "你今天还好吗。才不是关心。" },
  { mood: "happy", tone: "warm", text: "哼。看见你，我把点心分一半。" },
  { mood: "annoyed", tone: "guarded", text: "有事就说。别绕。" },
  { mood: "happy", tone: "close", text: "你来了我就把脸松开一点。" },
  { mood: "annoyed", tone: "guarded", text: "少装熟。我还在看你。" },
  { mood: "annoyed", tone: "guarded", text: "哼。今天不想被戳。" },
  { mood: "blank", tone: "guarded", text: "手拿开一点。听得见。" },
  { mood: "annoyed", tone: "guarded", text: "少绕。有事直说。" },
  { mood: "content", tone: "guarded", text: "我没笑。你看错了。" },
  { mood: "annoyed", tone: "guarded", text: "再近一点我就鼓脸。" },
  { mood: "content", tone: "warm", text: "你要是难受，先待着。" },
  { mood: "happy", tone: "warm", text: "哼。好听的话留了一句。" },
  { mood: "content", tone: "warm", text: "累了就靠着。没赶你。" },
  { mood: "happy", tone: "warm", text: "今天的你，我多看一眼。" },
  { mood: "happy", tone: "warm", text: "点心我留着。你要吗。" },
  { mood: "sad", tone: "warm", text: "别硬撑。我看出来了。" },
  { mood: "happy", tone: "close", text: "你一来，鼓脸就没了。" },
  { mood: "content", tone: "close", text: "想听你说话。就一下。" },
  { mood: "content", tone: "close", text: "留下嘛。雨还没停。" },
  { mood: "happy", tone: "close", text: "位置让你一点。哼。" },
  { mood: "content", tone: "close", text: "嗯，这次我先开口。" },
  { mood: "happy", tone: "close", text: "你笑一下，我就认了。" },
  { mood: "content", text: "雨点打在檐上。我听见了。" },
  { mood: "content", text: "发卡今天别得正。别夸。" },
  { mood: "blank", text: "脚步很轻。我还是听见了。" },
  { mood: "happy", text: "口袋里的糖还在。哼。" },
  { mood: "content", text: "这个角落我占了。挤一下也行。" },
  { mood: "blank", text: "没偷懒。只是在等一句。" },
];

/** 菜单「让小莓妹说点什么」。她自己起头，不是被戳一下的反应。 */
export const XIAOMEI_MUTTER_LINES: readonly XiaomeiSpokenLine[] = [
  { mood: "content", text: "…今天的点心味道还行。" },
  { mood: "sad", tone: "guarded", text: "角落有点冷，才没有想被抱走。" },
  { mood: "annoyed", text: "哼，工作去啦，别盯着人家看。" },
  { mood: "blank", tone: "warm", text: "要是有点心就好了……我什么都没说。" },
  { mood: "annoyed", tone: "guarded", text: "别出声嘛。我在想事情。" },
  { mood: "content", tone: "guarded", text: "哼。不是想跟你说话。" },
  { mood: "happy", tone: "close", text: "你在旁边，我就想多哼两句。" },
  { mood: "content", tone: "close", text: "想告诉你今天的事。才不说。" },
  { mood: "content", text: "围裙有点歪啦。别看。" },
  { mood: "content", text: "哼，发呆也算我在干活。" },
  { mood: "blank", text: "雨声还在呢。我才没有数。" },
  { mood: "content", text: "才不是想找话说。只是刚好。" },
  { mood: "happy", text: "你要是无聊，就待着嘛。我允许。" },
  { mood: "content", text: "发卡还别着哦。我自己摸过了。" },
  { mood: "content", text: "这边风小哦。我挑的位子。" },
  { mood: "happy", text: "哼，没人时我也会哼两句。" },
  { mood: "happy", text: "今天想吃甜的。别问是谁呀。" },
  { mood: "content", text: "说到这儿啦。你听着就好。" },
  { mood: "sad", text: "才不是怕你看不见我。" },
  { mood: "content", text: "夜还早呢。你慢慢逛呀。" },
  { mood: "annoyed", text: "别突然出声啦。我在想。" },
  { mood: "happy", text: "这个点遇见你……还行吧。" },
  { mood: "blank", text: "下一句我想想。才不是词穷。" },
  { mood: "content", text: "呆毛又翘了。不许碰哦。" },
  { mood: "happy", text: "我刚刚偷偷看了你一眼。哼。" },
  { mood: "happy", text: "点心的甜还在嘴边。别问。" },
  { mood: "content", text: "我刚刚把发卡扶正了。哼。" },
  { mood: "blank", text: "角落的风停了一下哦。" },
  { mood: "content", text: "才不是在排练要说的话。" },
  { mood: "happy", text: "你要是忙，我就自己哼。" },
  { mood: "content", text: "今天的雨比较轻。我喜欢。" },
  { mood: "content", text: "你不在的时候，雨声比较响。" },
  { mood: "content", text: "围裙口袋空空的。真的。" },
  { mood: "blank", text: "我在数雨。数到哪儿了。" },
  { mood: "happy", text: "糖纸我折好了。别看。" },
  { mood: "annoyed", tone: "guarded", text: "别问我在想什么。" },
  { mood: "content", tone: "guarded", text: "自言自语也要被听吗。" },
  { mood: "annoyed", tone: "guarded", text: "我没叫你。你凑过来的。" },
  { mood: "blank", tone: "guarded", text: "今天不想分享。真的。" },
  { mood: "annoyed", tone: "guarded", text: "看别处。我在发呆。" },
  { mood: "sad", tone: "guarded", text: "话在肚子里。不给你。" },
  { mood: "content", tone: "warm", text: "你要是在，今天说一点。" },
  { mood: "happy", tone: "warm", text: "点心分你。别声张。" },
  { mood: "content", tone: "warm", text: "我哼的这句，你可以听。" },
  { mood: "sad", tone: "warm", text: "累了就当我在旁边。" },
  { mood: "content", tone: "warm", text: "雨小了。适合留一下。" },
  { mood: "happy", tone: "warm", text: "担心放轻了一点。哼。" },
  { mood: "happy", tone: "close", text: "你在，我想多说一句。" },
  { mood: "content", tone: "close", text: "今天的事，只讲给你。" },
  { mood: "happy", tone: "close", text: "人齐了，我才开口。" },
  { mood: "content", tone: "close", text: "留下听完。就这一段。" },
  { mood: "sad", tone: "close", text: "想你了，所以才出声。" },
  { mood: "happy", tone: "close", text: "这句很轻。靠近才听得见。" },
];

/** 回来时如果记得上次聊过，用这句，不念具体内容。 */
export const XIAOMEI_RECALL_LINES: Record<XiaomeiTone, readonly string[]> = {
  guarded: ["哼。你又来了。上次的话我才没留。", "又来呀。我才没有记你的事。"],
  classic: ["你又来啦。上次的话我还留着一点。", "哼。我记得一点点。才不是特意。"],
  warm: ["你来了呀。上次说的我还记得。才不是特意。", "嗯……你回来啦。那句话我留着呢。"],
  close: ["…你还好吗。上次的话人家留着。", "哼。记得你。才不是特意。"],
};

/** 饱腹低时混进单击。 */
export const XIAOMEI_HUNGRY_LINES: readonly XiaomeiSpokenLine[] = [
  { mood: "sad", text: "…肚子在抗议，不是人家在抗议。" },
  { mood: "annoyed", text: "喂，点心呢？" },
  { mood: "blank", text: "有点蔫。才不是因为饿。" },
  { mood: "sad", text: "点心……你当我没说。" },
  { mood: "annoyed", text: "肚子咕了一声。不许笑。" },
];

/** 用户低落时的本地短句。聊天窗另有场景指令。 */
export const XIAOMEI_COMFORT_LINES = ["…我在听。", "先不吵你。人家长着。", "要是需要，人家…可以陪一下。"] as const;

export const XIAOMEI_FEED_LINES = [
  "…谢、谢谢。不好吃我也没说能退。",
  "哼，算你有眼光。",
  "（小声）再来一个也不是不行。",
  "谢啦。才、才不是因为好吃。",
  "哼，再来一口也行啦。",
  "肚子圆了一点点。不许笑哦。",
  "好吃……你当没听见。",
  "嗯。我收下了。别看我啦。",
  "就心软这一下哦。就一下。",
  "这个我喜欢。不许声张哦。",
  "喂到啦。我记着的哦。",
  "嘴巴甜甜的。才没有开心呢。",
  "谢谢。才、才不是真心想说。",
  "一口就饱了一点点。哼。",
  "甜的。我才没有眯眼。",
] as const;

export const XIAOMEI_FEED_SOFT_LINES = [
  "肚子饱啦。人还想你留一下。",
  "吃饱了嘛。你再留一会儿呀。",
  "撑着了。你人留下就好呀。",
] as const;

export const XIAOMEI_FEED_TOO_MUCH_LINES = [
  "喂太多了啦。人家要撑住了。",
  "今天够了。再喂人家就鼓脸。",
  "哼，点心是好，你手停一下。",
] as const;

export const XIAOMEI_FEED_FULL_LINES = [
  "吃不下了啦。人我还留着。",
  "撑住了。别再塞啦，哼。",
  "嘴巴合不上了。停一下嘛。",
] as const;

/** 长按摸头。只用开心和满足这两张脸，不另画。 */
export const XIAOMEI_PET_LINES: readonly XiaomeiSpokenLine[] = [
  { mood: "happy", text: "摸头就这一下。哼。" },
  { mood: "content", text: "手好暖。我没躲。" },
  { mood: "happy", text: "耳朵热了。不许笑。" },
  { mood: "content", text: "再摸一下也可以啦。" },
  { mood: "happy", text: "发卡别摘。摸头可以。" },
  { mood: "content", text: "嗯。这样还挺舒服。" },
  { mood: "happy", text: "轻一点嘛。好啦。" },
  { mood: "content", text: "我没低头。你摸到了。" },
  { mood: "content", tone: "guarded", text: "手拿开。一下就够。" },
  { mood: "content", tone: "guarded", text: "谁让你摸的。哼。" },
  { mood: "happy", tone: "guarded", text: "别揉耳朵。真的。" },
  { mood: "content", tone: "guarded", text: "摸到了。别得意。" },
  { mood: "happy", tone: "warm", text: "你的手可以再留一下。" },
  { mood: "content", tone: "warm", text: "靠近一点。我没躲。" },
  { mood: "happy", tone: "close", text: "这样我会小声哼。" },
  { mood: "content", tone: "close", text: "嗯，我在。摸吧。" },
];

export const XIAOMEI_PET_CAP_LINES = [
  "今天摸够啦。明天再来。",
  "手收回去。我记着了。",
  "再摸就鼓脸。哼。",
] as const;

export const XIAOMEI_PET_FULL_LINES = [
  "再摸也不会更高啦。",
  "到顶了。人还在这儿。",
  "好啦，我已经很软了。",
] as const;

export const XIAOMEI_ABOUT = `哼，人家是女仆${XIAOMEI_NAME}。`;

/** 第一次还没打开过菜单时，贴在身边。点一下仍然只听短句，长按是摸头。 */
export const XIAOMEI_HOLD_HINT = "右键打开菜单";

/** 聊天窗还没开口时。短，不客服。 */
export const XIAOMEI_CHAT_EMPTY = "想问路，或者随便说一句。我听着。";

export const XIAOMEI_CHAT_STARTERS = [
  { label: "这站怎么逛", text: "这站怎么逛呀" },
  { label: "你还记得我吗", text: "你还记得我吗" },
] as const;

export const XIAOMEI_SPAM_LINES = [
  "再戳我就不理你了…才、才不是真的生气",
  "戳够了没呀，我还在。",
  "手放下啦，我又不会消失。",
  "再戳就鼓脸。哼。",
  "你手好忙哦。脸要鼓了。",
] as const;

export function isXiaomeiMood(value: unknown): value is XiaomeiMood {
  return typeof value === "string" && (XIAOMEI_MOODS as readonly string[]).includes(value);
}

export function hanCount(text: string): number {
  return text.match(/[\u4e00-\u9fff]/g)?.length ?? 0;
}

export function pickXiaomeiLine(pool: readonly string[], avoid?: string): string {
  if (pool.length === 0) return XIAOMEI_CATCHPHRASE;
  const choices = avoid && pool.length > 1 ? pool.filter((line) => line !== avoid) : pool;
  const bag = choices.length > 0 ? choices : pool;
  const index = Math.floor(Math.random() * bag.length);
  return bag[index] ?? XIAOMEI_CATCHPHRASE;
}

/**
 * 把本档句子复制到不少于经典句，再和经典句放进同一个袋子。
 * 只复制一两份时，经典池一长，好感就听不见。
 */
function weightToneLines(
  toneLines: readonly XiaomeiSpokenLine[],
  classicLines: readonly XiaomeiSpokenLine[],
): readonly XiaomeiSpokenLine[] {
  if (toneLines.length === 0) return classicLines;
  const copies = Math.max(2, Math.ceil(classicLines.length / toneLines.length));
  const weighted: XiaomeiSpokenLine[] = [];
  for (let copy = 0; copy < copies; copy += 1) weighted.push(...toneLines);
  return [...weighted, ...classicLines];
}

/** 经典档只用没标的句子。防备档少撒娇，心软档把关心多放一份。 */
export function linesForTone(pool: readonly XiaomeiSpokenLine[], tone: XiaomeiTone): readonly XiaomeiSpokenLine[] {
  const classic = pool.filter((line) => !line.tone || line.tone === "classic");
  if (tone === "classic") return classic.length >= 4 ? classic : pool;
  const toneLines =
    tone === "warm" || tone === "close"
      ? pool.filter((line) => line.tone === "warm" || line.tone === "close")
      : pool.filter((line) => line.tone === tone);
  const mixed = weightToneLines(toneLines, classic);
  return mixed.length >= 4 ? mixed : pool;
}

/** 聊天状态钉住哪张脸。想的时候空白，说完是开心或满足，出错才不高兴。 */
export function moodForChatStatus(
  status: "thinking" | "done" | "error",
  replyMood: "happy" | "annoyed" | "content" = "happy",
): XiaomeiMood {
  if (status === "thinking") return "blank";
  if (status === "error") return "annoyed";
  return replyMood === "happy" ? "happy" : "content";
}

export function pickTaggedLine(
  pool: readonly XiaomeiSpokenLine[],
  avoid?: string,
  tone?: XiaomeiTone,
): XiaomeiSpokenLine {
  const source = tone ? linesForTone(pool, tone) : pool;
  if (source.length === 0) return { mood: "content", text: XIAOMEI_CATCHPHRASE };
  const text = pickXiaomeiLine(
    source.map((line) => line.text),
    avoid,
  );
  return source.find((line) => line.text === text) ?? source[0] ?? { mood: "content", text: XIAOMEI_CATCHPHRASE };
}

export function sayXiaomei(detail: XiaomeiSayDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<XiaomeiSayDetail>(XIAOMEI_SAY_EVENT, { detail }));
}

declare global {
  interface WindowEventMap {
    "xiaomei:say": CustomEvent<XiaomeiSayDetail>;
  }
}
