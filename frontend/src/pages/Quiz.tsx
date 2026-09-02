import React, { useMemo, useState } from 'react'

/**
 * 趣味小测试 v3
 *  - 颜色性格：6 个预设 + 中文颜色名输入（模糊匹配大类：红/橙/黄/绿/青/蓝/紫/粉/棕/灰/黑/白/米）
 *  - 笑一个吧：24 条中文笑话随机（冷笑话+职场+校园+生活），支持"再听一个"+"复制笑话"。
 *  - 人生锦囊：36 条人生建议卡。
 */

type Mode = 'color' | 'joke' | 'advice'

interface ModeTab { key: Mode; icon: string; label: string; hint: string }
const TABS: ModeTab[] = [
  { key: 'color',  icon: '🎨', label: '颜色性格', hint: '选一个色，或输入你喜欢的颜色名' },
  { key: 'joke',   icon: '😄', label: '笑一个吧', hint: '来一个今日份的冷笑话' },
  { key: 'advice', icon: '🀄', label: '人生锦囊', hint: '抽一张今日建议卡' },
]

// ================= 颜色性格 =================
type ColorChoice = {
  key: string
  name: string
  cls: string
  hex: string
  trait: string
  desc: string
}
const COLOR_CHOICES: ColorChoice[] = [
  { key:'mint',   name:'薄荷绿', cls:'bg-gradient-to-br from-mint-300 to-emerald-500',   hex:'#5FD1A4', trait:'治愈系 & 温和坚定',
    desc:'你温柔但有原则，是朋友眼里的"稳定器"。热爱生活小事，审美在线，擅长把乱糟糟的日子过成诗。' },
  { key:'sky',    name:'天空蓝', cls:'bg-gradient-to-br from-sky-300 to-indigo-500',   hex:'#6BA6F0', trait:'理性 & 自由灵魂',
    desc:'头脑清晰，喜欢独立思考。对世界保持好奇，讨厌被束缚，适合做创意和策略类工作。' },
  { key:'sunset', name:'落日橘', cls:'bg-gradient-to-br from-orange-300 to-rose-500',  hex:'#F58F60', trait:'小太阳 & 行动派',
    desc:'你是人群中的小太阳，感染力满分。想到就做，偶尔冲动但总能带来惊喜。' },
  { key:'grape',  name:'葡萄紫', cls:'bg-gradient-to-br from-fuchsia-400 to-violet-600',hex:'#A063E0', trait:'浪漫 & 艺术家',
    desc:'你有独特的审美与细腻的内心世界，想象力丰富，常常被音乐或电影戳中泪点。' },
  { key:'latte',  name:'拿铁棕', cls:'bg-gradient-to-br from-amber-500 to-stone-700',   hex:'#8B5A2B', trait:'稳重 & 细节控',
    desc:'你让人安心，是可以被托付的靠谱担当。重视仪式感，生活井井有条，品味高级。' },
  { key:'sakura', name:'樱花粉', cls:'bg-gradient-to-br from-pink-200 to-rose-400',    hex:'#F9B3C8', trait:'软萌 & 内心强大',
    desc:'外表软萌内心坚定，有自己的坚持。喜欢可爱的事物，柔软但从不软弱。' },
]

// 颜色大类：模糊匹配中文颜色名。大类名称 + 代表 hex + 关键词 + 描述
type Bucket = {
  key: string
  bucket: string // 大类名（显示用）
  hex: string
  cls: string
  // 关键词（出现在颜色名任意位置即匹配，去掉空格/颜色/色/色号等虚词后检查）
  keywords: string[]
  trait: string
  desc: string
}
const BUCKETS: Bucket[] = [
  {
    key: 'red', bucket: '红色系', hex: '#E64B4B', cls: 'bg-gradient-to-br from-rose-400 to-red-600',
    keywords: ['红','赤','朱','绯红','胭脂','樱桃','酒红','枣红','石榴','火','砖红','铁锈红'],
    trait: '热情外露 · 行动派',
    desc: `你像一团会呼吸的小火苗，生命力旺盛，爱恨分明。\n喜欢直来直往，讨厌拐弯抹角；对在乎的人掏心掏肺，对看不顺眼的事敢于说出口。\n你是人群中"第一个站出来"的那种人 —— 冲动、真诚、值得一路同行。`,
  },
  {
    key: 'orange', bucket: '橙色系', hex: '#F08A3E', cls: 'bg-gradient-to-br from-amber-300 to-orange-500',
    keywords: ['橙','橘','桔','柑','南瓜','柿子','蜜柚','落日','夕阳','珊瑚'],
    trait: '温暖可靠 · 气氛担当',
    desc: `你身上有一种"刚刚好的暖"：不过分张扬，也不会让人觉得冷淡。\n朋友难过时会想起你，聚会冷场时你总能活跃起气氛。\n你把生活调成蜂蜜色 —— 有点甜，但不齁；稳，又不无聊。`,
  },
  {
    key: 'yellow', bucket: '黄色系', hex: '#F1C339', cls: 'bg-gradient-to-br from-yellow-200 to-amber-500',
    keywords: ['黄','金','柠','芒','向日','香蕉','小鸡','鹅黄','米黄','奶油'],
    trait: '乐观明亮 · 小太阳体质',
    desc: `你相信"船到桥头自然直"，哪怕是阴天，心里也偷偷揣着一颗小太阳。\n笑点低，容易开心；再糟糕的事，一顿好吃的就能被你"翻篇"。\n你是那种会把日子过得闪闪发光的人。`,
  },
  {
    key: 'green', bucket: '绿色系', hex: '#4CB579', cls: 'bg-gradient-to-br from-emerald-300 to-green-600',
    keywords: ['绿','薄荷','草木','森','抹茶','青草','苔','橄榄','豆','苹果','竹','松柏'],
    trait: '治愈自然 · 温和坚定',
    desc: `你安静但有力量，像一棵慢慢扎根的树。\n喜欢真实、简单的人和物，情绪稳定，是朋友眼里的"定海神针"。\n不必刻意讨好谁 —— 你本身就是让人安心的存在。`,
  },
  {
    key: 'cyan', bucket: '青色系', hex: '#3FBFB0', cls: 'bg-gradient-to-br from-teal-300 to-cyan-600',
    keywords: ['青','湖','水蓝','蒂芙尼','孔雀蓝','松','翡','冰蓝','薄荷蓝'],
    trait: '清爽清醒 · 理性派',
    desc: `你看事通透，很少被情绪牵着走；遇到问题第一反应是"拆解"而不是"崩溃"。\n审美偏干净的极简风，讨厌乱糟糟。\n你像夏天的一瓶冰水 —— 不热情，但超解渴。`,
  },
  {
    key: 'blue', bucket: '蓝色系', hex: '#4E82D4', cls: 'bg-gradient-to-br from-sky-400 to-indigo-700',
    keywords: ['蓝','靛','宝石蓝','藏蓝','海蓝','天空蓝','牛仔','海军蓝','宝蓝','蔚蓝'],
    trait: '深邃思考 · 浪漫自由',
    desc: `你内心有一片别人看不见的海，爱幻想，也爱深度思考。\n对自由很执着，讨厌被人情、规则、标签绑架。\n你适合做创意、研究、旅行 —— 任何能让心灵"跑起来"的事情。`,
  },
  {
    key: 'purple', bucket: '紫色系', hex: '#9A69D8', cls: 'bg-gradient-to-br from-fuchsia-400 to-violet-700',
    keywords: ['紫','葡萄','薰衣','紫罗兰','茄','绛紫','紫藤','兰花'],
    trait: '浪漫神秘 · 艺术家气质',
    desc: `你有一种"别人猜不透"的灵气，审美独特，情绪浓度偏高。\n容易被一段音乐、一场雨、一部老电影戳中，内心戏丰富到可以写成小说。\n你是那种 —— 相处越久，越让人上头的人。`,
  },
  {
    key: 'pink', bucket: '粉色系', hex: '#F19BB8', cls: 'bg-gradient-to-br from-pink-200 to-rose-500',
    keywords: ['粉','樱花','玫瑰','桃','胭脂粉','少女','草莓','芭蕾','蜜桃'],
    trait: '柔软甜美 · 内心强大',
    desc: `你喜欢一切可爱的事物，偶尔撒娇，但从不是真的软弱。\n吃软不吃硬，温柔但有底线；如果有人挑战你，会看到你"小白兔变大狮子"的一面。\n请继续用你的软萌，温柔地征服世界吧。`,
  },
  {
    key: 'brown', bucket: '棕色系', hex: '#8F5B33', cls: 'bg-gradient-to-br from-amber-600 to-stone-700',
    keywords: ['棕','咖','咖啡','拿铁','可可','巧克力','驼','栗','核桃','茶','焦糖','土'],
    trait: '稳重靠谱 · 细节控',
    desc: `你让人安心，是朋友口中"有事第一个找"的那种人。\n品味偏高级，仪式感是你的必需品，不是矫情。\n日子被你过得像一杯手冲咖啡 —— 慢、烫、香气复杂、后劲绵长。`,
  },
  {
    key: 'gray', bucket: '灰色系', hex: '#8A8E95', cls: 'bg-gradient-to-br from-slate-300 to-gray-600',
    keywords: ['灰','炭','雾','银灰','烟灰','雾霾','水泥','鸽子灰','高级灰'],
    trait: '克制高级 · 边界感强',
    desc: `你最讨厌"被代表"和"被绑架"，人与人的边界感对你来说像空气一样重要。\n话不多，但每句都有分量。审美极克制，喜欢一切"刚刚好"的东西。\n你是那种不刻意社交，却很有魅力的人。`,
  },
  {
    key: 'black', bucket: '黑色系', hex: '#1F2328', cls: 'bg-gradient-to-br from-gray-700 to-black',
    keywords: ['黑','玄','墨','乌','曜','暗夜','碳','煤炭','纯黑','夜'],
    trait: '外冷内热 · 酷而清醒',
    desc: `外表看起来不好接近，但其实是最心软的那种人。\n你信奉"少说多做"，讨厌虚假寒暄，只在真正信任的人面前露出柔软一面。\n酷是你的保护色，温柔是你的绝密武器。`,
  },
  {
    key: 'white', bucket: '白色系', hex: '#F5F5F2', cls: 'bg-gradient-to-br from-white to-gray-200',
    keywords: ['白','雪','奶','霜','素','米白','纯白','象牙','珍珠','云'],
    trait: '干净纯粹 · 理想主义',
    desc: `你对"干净"这件事执念很深 —— 不管是房间、关系，还是内心。\n容易信任人，容易被感动，也容易因失望而悄悄退场。\n愿你一直保有这份透明 —— 它是你最稀缺的天赋。`,
  },
  {
    key: 'beige', bucket: '米杏色系', hex: '#D9C5A4', cls: 'bg-gradient-to-br from-orange-100 to-amber-300',
    keywords: ['米','杏','燕麦','奶茶','裸','卡其','杏色','沙','肤色','麦','麻'],
    trait: '温柔慵懒 · 百搭好人缘',
    desc: `你像一张"跟谁都能搭"的百搭卡，不挑场合，不挑人。\n性情温和，不爱出头，喜欢一切慵懒又舒服的状态。\n看起来"没什么个性"其实最难得 —— 你是所有人的"舒服区"。`,
  },
]

function normalizeName(s: string): string {
  return (s || '')
    .trim()
    .replace(/[\s\-\_\/\\\(\)（）\.。,，:：;；!！\?？~～#＃\d[a-zA-Z]/g, '')
    .replace(/(颜色|色号|色系|色卡|一种|那个|这个|的)/g, '')
}

/**
 * 输入中文颜色名，模糊匹配到颜色大类。
 *   1) 去掉"颜色/色/空格/数字/英文"等干扰词
 *   2) 若用户输入的就是大类名（如"红色"）直接命中
 *   3) 否则按关键词命中次数排序；次数相等按关键词更长优先
 *   4) 都没命中时按"最后一个汉字"或"任意一个汉字"匹配
 *   5) 兜底返回 null
 */
function matchBucket(input: string): { bucket: Bucket; matchedKeyword: string } | null {
  const n = normalizeName(input)
  if (!n) return null

  // 去掉末尾的 "色"（如 "红色" → "红"），让关键词能命中
  const clean = n.replace(/色+$/g, '')
  if (!clean) return null

  type Score = { b: Bucket; score: number; keywordLen: number; kw: string }
  const scored: Score[] = BUCKETS.map(b => {
    let score = 0
    let hitLen = 0
    let hitKw = ''
    b.keywords.forEach(kw => {
      if (clean.includes(kw) || kw.includes(clean)) {
        // 完全相等额外加分
        const gain = (clean === kw ? 100 : 10) + kw.length
        if (gain > score) { score = gain; hitLen = kw.length; hitKw = kw }
      }
    })
    return { b, score, keywordLen: hitLen, kw: hitKw }
  })

  scored.sort((a, b) => (b.score - a.score) || (b.keywordLen - a.keywordLen))
  const best = scored[0]
  if (best.score > 0) return { bucket: best.b, matchedKeyword: best.kw }

  // 兜底：任意单字匹配
  for (const ch of clean) {
    for (const b of BUCKETS) {
      for (const kw of b.keywords) {
        if (kw.includes(ch)) return { bucket: b, matchedKeyword: ch }
      }
    }
  }
  return null
}

// ================= 笑话 24 条 =================
const JOKES = [
  { t: '编程与买菜', s: '程序员去买菜，问老板："这菜多少钱一斤？" 老板说："3 块。" 程序员："那我要 1024 斤，给个打包价？" 老板："滚。"' },
  { t: '减肥的真相', s: '我闺蜜说她要"轻断食减肥"，我就信了。到饭点一看，她在轻食沙拉、奶茶、小龙虾之间"断"了两个小时，中间还吃了份鸡米花。' },
  { t: '早起失败', s: '我给自己定了个 6 点的闹钟，然后把手机放到了客厅。结果凌晨 5 点 59 我梦游似的去客厅把它关了，回来睡到 9 点。' },
  { t: '老板的夸奖', s: '老板夸我"年轻人很有潜力"。我心里想：完了，接下来的活大概就是"有潜力的人才能搞定的那种活"。' },
  { t: '健身卡', s: '办了张 2000 块的年卡，去过 3 次。但健身房用我的照片做宣传墙，相当于我花了 2000 块钱去那里上了个班。' },
  { t: '猫咪定律', s: '每次我花 100 块买个猫窝，猫一定会睡得最香的地方是：装猫窝那个纸箱。' },
  { t: '超市的诱惑', s: '我进超市之前："就买一瓶酱油。"\n结账时："总共 287 元。"\n我："……好。"' },
  { t: '妈妈的关心', s: '打电话回家，我妈问："吃饭了吗？"\n我："刚吃完。"\n我妈："吃啥了？吃的多吗？有肉吗？菜新鲜吗？还吃得下别的吗？"\n我："我突然就饿了。"' },
  { t: 'PPT 的结尾', s: '写 PPT 写到最后一页，写 Thank You 觉得太普通，写 Q & A 觉得心虚。最后写下了："谢谢观看，请勿提问。"' },
  { t: '天气预报', s: '天气预报说今天 30% 降水几率。我出门没带伞，淋成了狗。后来我想明白了，那 30% 就是我。' },
  { t: '加班的意义', s: '同事说："你看加班我一年就攒到首付了！"\n我看了一眼他的头发："你是把植发的钱也一起省出来了啊。"' },
  { t: '数学题', s: '小时候做数学题，想不通为什么水池一边放水一边进水。现在我懂了 —— 这就是我工资一发就全还信用卡的样子。' },
  { t: '狗狗相亲', s: '朋友带我家狗去和别的狗"相亲"，两只狗见面互相闻了一下，扭头就走。朋友说："行，随你爹，社恐。"' },
  { t: '咖啡续命', s: '我早上不喝咖啡就像鱼没有自行车 —— 好像没什么影响，但总感觉今天少了点什么不对。' },
  { t: '相亲开场白', s: '相亲对象问我："你有房吗？有车吗？" 我淡定回答："你先告诉我你今天涂的口红色号，我就把房产证拍给你。" 她差点把奶茶喷出来。' },
  { t: '年轻人理财', s: '专家说理财的第 1 步是记账。我记了一个月："1 号吃了、2 号吃了、3 号又吃了、4 号还在吃…" 最后得出结论：我这辈子最大的开销就是嘴。' },
  { t: '开会的价值', s: '公司每周一开 2 小时周会。上周我把会里所有"我们接下来要做的事"记下来，发现和去年一摸一样。原来周会的功能是让时间倒流。' },
  { t: '外卖迟到', s: '外卖小哥打电话："对不起我把你的面撒了，我再回去给你做一碗。"\n等 40 分钟到了，他一脸愧疚地说："第二碗我也撒了，你吃这个饼干吧我买的。"' },
  { t: '社恐坐地铁', s: '地铁上有个空位，就在一个人旁边。我宁愿站 10 站也不愿意过去坐，因为坐下就要说"麻烦让一下" —— 这句话需要我回家躺 1 小时才能康复。' },
  { t: '孩子造句', s: '老师让我外甥用"恳求"造句。他写："妈妈做的排骨我啃不动，恳求妈妈再炖一下。" 老师评语："恳求跟啃求不是一回事。"' },
  { t: '早睡誓言', s: '每天 11 点我都发誓："今晚必须早睡！" 然后我 1 点在刷 "早起的人一天有多可怕" 的文章。' },
  { t: '猫咪工作', s: '我家猫一天 24 小时中有 22 小时在睡觉，剩下 2 小时在伸懒腰和打翻我的水杯。但我还是觉得它比我辛苦 —— 它一天要做 4 场梦。' },
  { t: '新衣服省钱', s: '网上看到一件衣服，199 元。我告诉自己：不买就省下 199。然后我把省下的 199 拿去吃了顿 288 的火锅。' },
  { t: '输入法背叛', s: '想打"好的老板"，手滑打成"好的老婆"。发出的瞬间我人没了。现在全公司看我的眼神都带着一种慈祥。' },
]

// ================= 人生锦囊 =================
const ADVICE_CARDS = [
  { t: '慢一点没关系', s: '别跟别人比进度。你不是落后了，是走在自己的时区里。' },
  { t: '先做最小的一步', s: '不想开始的时候，就告诉自己"只做 5 分钟就停"。通常你会继续。' },
  { t: '别回复那条长语音', s: '重要的人会打字；不值得的人，你更没必要浪费耳朵和心情。' },
  { t: '今天给一个老朋友发条消息', s: '"最近还好吗？" 6 个字，有时能把一段友谊救回来。' },
  { t: '今晚 30 分钟不碰手机', s: '试试看书、洗漱、发呆或者做点手工，你会发现时间突然变长了。' },
  { t: '走出去晒 10 分钟太阳', s: '阳光能调整 50% 的坏情绪，剩下的 50% 在路上。' },
  { t: '删掉一条"以后可能用得上"的收藏', s: '99% 的收藏你再也没看过。今天的你比 2020 年的你更重要。' },
  { t: '如果不想笑就别笑', s: '职业假笑很累的。做你自己，不想讲话就沉默，不开心可以直接说。' },
  { t: '今天只跟自己比', s: '比昨天多走一步、多喝一杯水、少生气一次，都是了不起的进步。' },
  { t: '别过度准备', s: '完美主义是拖延的伪装。"差不多就开始"比"准备完美"更靠谱。' },
  { t: '把那句欠自己的"对不起"补上', s: '你对所有人都那么好，唯独对自己太苛刻。今天开始对自己温柔一点。' },
  { t: '把"我不行"改成"我试试"', s: '大脑会相信你说的每一句话，所以请对自己用鼓励的语气。' },
  { t: '不再取悦所有人', s: '100 个人嘴里有 100 个你，哪一个都不是真正的你。' },
  { t: '允许自己今天一事无成', s: '休息日不是浪费。休息是下周能继续的能量来源。' },
  { t: '早点睡，今晚别超过 11:30', s: '所有明天的焦虑，一半来自你今晚睡得太晚。' },
  { t: '别让沉没成本绑架你', s: '一段关系已经烂了 2 年，不代表你要在它身上搭进第 3 年。' },
  { t: '花钱买让你每天开心的小东西', s: '大目标要追，小快乐也要买。30 块的咖啡和 3 万的包，一样有价值。' },
  { t: '今天不做选择题', s: '"我全都要"四个字今天可以大声说出来。' },
  { t: '先把那件小破事搞定', s: '那件一直悬着的 10 分钟小事，今天做完它，你会感觉世界变轻了。' },
  { t: '少吃一顿外卖，自己做一次', s: '哪怕只是煮一碗面，厨房的温度能治愈 90% 的疲倦。' },
  { t: '今天别查体重，别查余额', s: '这两件事留到明天。今天你的任务只有"开心"。' },
  { t: '别在深夜做决定', s: '情绪上头的决定，大概率明天会后悔。先睡，答案会更清楚。' },
  { t: '向帮过你的人说声谢谢', s: '哪怕是一句迟到很久的谢谢，也比没有强。' },
  { t: '给自己买一束花', s: '鲜花不一定要别人送，你值得买给自己的浪漫。' },
  { t: '今天不设闹钟，自然醒', s: '(如果不上班的话) 让身体自己决定今天几点开始。' },
  { t: '多喝 800ml 水', s: '听起来很无聊但很有用。试试现在就去倒一杯。' },
  { t: '认真整理一次桌面 / 床头', s: '环境清爽了，心情就清爽了。' },
  { t: '停止对自己的 PUA', s: '你没有"不够好"，你只是需要更多一点时间。' },
  { t: '今天允许自己"不被理解"', s: '不是每个人都必须懂你。你懂自己就够了。' },
  { t: '跟过去的自己和解', s: '对当年"好蠢"的那个自己说一声：辛苦了，谢谢你没有放弃。' },
  { t: '减少刷短视频到 30 分钟以内', s: '用刷碎片信息的时间，看一集完整的剧 / 读一章书。' },
  { t: '遇到烂人烂事，默念"关我屁事"', s: '这句话能帮你省下 80% 的无效情绪。' },
  { t: '做一件"好久没做"的事', s: '打个旧游戏、翻旧照片、听听学生时代的歌。找一找曾经的那个自己。' },
  { t: '记录今天 3 件小事', s: '一杯好喝的咖啡、路边的花、陌生人帮你撑了门。写下来，快乐就变厚了。' },
  { t: '今天早点下班 / 关电脑', s: '工作做不完，你的精神状态却会被拖垮。关上它就对了。' },
  { t: '拥抱你最重要的人一下', s: '如果不在身边，就打个电话。体温和声音，比文字温暖一万倍。' },
]

function copyText(t: string): boolean {
  try {
    if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(t)
      return true
    }
  } catch (_e) { /* fallthrough to textarea fallback */ }
  try {
    const ta = document.createElement('textarea')
    ta.value = t
    document.body.appendChild(ta)
    ta.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch (_e2) { ok = false }
    try { document.body.removeChild(ta) } catch (_e3) { /* noop */ }
    return ok
  } catch (_e4) { return false }
}

const Quiz: React.FC = () => {
  const [tab, setTab] = useState<Mode>('color')
  return (
    <div className="animate-fade-up space-y-5">
      <div className="grid grid-cols-3 gap-2 rounded-2xl p-1 bg-mint-100/60 border border-mint-100 shadow-card">
        {TABS.map(t => {
          const active = tab === t.key
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`btn-press rounded-xl py-2.5 px-2 text-sm transition-all ${active ? 'bg-white text-mint-800 shadow-sm' : 'text-mint-700/70 hover:text-mint-800'}`}>
              <div className="text-lg leading-none mb-1">{t.icon}</div>
              <div className={`text-xs font-semibold ${active ? 'text-mint-800' : ''}`}>{t.label}</div>
            </button>
          )
        })}
      </div>
      {tab === 'color' && <ColorPanel />}
      {tab === 'joke'  && <JokePanel />}
      {tab === 'advice' && <AdvicePanel />}
    </div>
  )
}

// ============ 颜色性格 ============
function ColorPanel() {
  const [nameInput, setNameInput] = useState('')
  const [customPicked, setCustomPicked] = useState<null | { bucket: Bucket; inputName: string; matchedKeyword: string }>(null)
  const [presetPicked, setPresetPicked] = useState<ColorChoice | null>(null)
  const [errMsg, setErrMsg] = useState('')

  const showResult = presetPicked || customPicked
  const result = useMemo(() => {
    if (presetPicked) {
      return {
        hex: presetPicked.hex,
        displayCls: presetPicked.cls,
        name: presetPicked.name,
        trait: presetPicked.trait,
        desc: presetPicked.desc,
        bucketHint: '',
      }
    }
    if (customPicked) {
      const b = customPicked.bucket
      return {
        hex: b.hex,
        displayCls: b.cls,
        name: `${customPicked.inputName}（${b.bucket}）`,
        trait: b.trait,
        desc: b.desc,
        bucketHint: `※「${customPicked.inputName}」自动归入大类：${b.bucket}`,
      }
    }
    return null
  }, [presetPicked, customPicked])

  const shareText = result
    ? `🎨 我的颜色性格测试
颜色：${result.name}
性格关键词：${result.trait}
${result.desc}
—— 来自「薄荷小站」趣味小测试 ✨`
    : ''

  function applyInput() {
    const name = nameInput.trim()
    if (!name) { setErrMsg('先输入一个颜色名，例如「抹茶绿」、「雾霾蓝」'); return }
    const m = matchBucket(name)
    if (!m) {
      setErrMsg(`没识别出「${name}」属于哪种颜色，换个说法试试？比如把「酱紫」改成「紫色」。`)
      setCustomPicked(null)
      return
    }
    setErrMsg('')
    setCustomPicked({ bucket: m.bucket, inputName: name, matchedKeyword: m.matchedKeyword })
    setPresetPicked(null)
  }

  return (
    <div className="space-y-4">
      <ResultBar
        left={<div>
          <div className="text-xs text-mint-700/70">点预设色块，或输入你最喜欢的颜色名</div>
          <div className="mt-0.5 text-lg font-bold text-mint-900">颜色揭示你的性格</div>
        </div>}
      />

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {COLOR_CHOICES.map(c => (
          <button key={c.key} onClick={() => { setPresetPicked(c); setCustomPicked(null); setErrMsg('') }}
            className={`btn-press h-24 rounded-2xl ${c.cls} border-2 text-white font-bold text-base shadow-card flex flex-col items-end justify-end p-2 relative overflow-hidden
              ${presetPicked?.key === c.key && !customPicked ? 'ring-4 ring-offset-2 ring-mint-400' : ''}`}>
            <span className="drop-shadow-sm leading-tight">{c.name}</span>
          </button>
        ))}
      </div>

      {/* 中文颜色名输入 */}
      <div className="rounded-2xl bg-white/85 border border-mint-100 shadow-card p-4 space-y-3">
        <div className="text-sm font-semibold text-mint-800">🎛️ 输入颜色中文名</div>
        <div className="flex flex-wrap items-stretch gap-2">
          <input
            type="text"
            value={nameInput}
            placeholder="例如：薄荷绿 / 奶茶色 / 雾霾蓝 / 樱花粉 / 拿铁棕"
            onChange={e => { setNameInput(e.target.value); if (errMsg) setErrMsg('') }}
            onKeyDown={e => { if (e.key === 'Enter') applyInput() }}
            className="flex-1 min-w-[200px] rounded-xl border border-mint-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mint-400/50"
          />
          <button
            onClick={applyInput}
            className="btn-press px-4 py-2 rounded-xl bg-mint-600 text-white text-sm shadow-soft hover:bg-mint-700">
            看看我的性格
          </button>
        </div>
        {errMsg && (
          <div className="text-[12px] text-rose-500">⚠️ {errMsg}</div>
        )}
        <div className="text-[11px] text-mint-700/60 leading-relaxed">
          💡 不必精确，写你心里对它的「叫法」就好 —— 奶咖、雾霾蓝、樱花粉、落日橘、藏青、藕粉、鸭屎绿…通通可以；
          模糊颜色会自动归入 13 个大类（红/橙/黄/绿/青/蓝/紫/粉/棕/灰/黑/白/米杏），显示大类对应的代表性颜色与性格描述。
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {BUCKETS.map(b => (
            <span key={b.key} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] text-white/95 shadow-sm ${b.cls}`}>
              <span className="inline-block w-2 h-2 rounded-full bg-white/80" /> {b.bucket}
            </span>
          ))}
        </div>
      </div>

      {result && (
        <div className="rounded-2xl bg-white/85 border border-mint-100 shadow-card p-5 animate-popIn space-y-3">
          <div className="flex items-center gap-4">
            <div
              className={`w-20 h-20 rounded-2xl shrink-0 shadow-soft ${result.displayCls}`}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xl font-bold text-mint-900">{result.name}</div>
              <div className="text-sm text-mint-600 font-semibold mt-0.5">{result.trait}</div>
              {result.bucketHint && (
                <div className="text-[11px] text-mint-500 mt-1">{result.bucketHint}</div>
              )}
            </div>
          </div>
          <div className="text-sm leading-8 text-mint-900 bg-mint-50 border border-mint-100 rounded-xl p-4 whitespace-pre-line">{result.desc}</div>
          <CopyBtn text={shareText} />
        </div>
      )}
    </div>
  )
}

// ============ 笑话 ============
function JokePanel() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * JOKES.length))
  const [animKey, setAnimKey] = useState(0)
  const j = JOKES[idx]
  const next = () => {
    let n = Math.floor(Math.random() * JOKES.length)
    if (n === idx) n = (n + 1) % JOKES.length
    setIdx(n); setAnimKey(k => k + 1)
  }
  const shareText =
`😄 今天这个笑话我给满分（第 ${idx+1} 则）
《${j.t}》
${j.s}
—— 笑一个吧 · 薄荷小站 ✨`

  return (
    <div className="space-y-4">
      <ResultBar
        left={<div>
          <div className="text-xs text-mint-700/70">共 {JOKES.length} 则笑话池，来点轻松的？</div>
          <div className="mt-0.5 text-lg font-bold text-mint-900">笑一个吧 😆</div>
        </div>}
        right={
          <button onClick={next}
            className="btn-press text-xs px-3 py-1.5 rounded-full bg-rose-500 text-white shadow-soft hover:bg-rose-600">
            🎲 换一个笑话
          </button>
        }
      />
      <div key={animKey} className="animate-popIn rounded-3xl bg-gradient-to-br from-amber-300 via-rose-300 to-fuchsia-400 p-0.5 shadow-soft">
        <div className="rounded-[calc(1.5rem-2px)] bg-white/95 p-6 sm:p-7">
          <div className="text-[11px] tracking-[0.3em] text-rose-600 font-semibold">— JOKE #{String(idx+1).padStart(2,'0')} —</div>
          <div className="mt-4 text-2xl sm:text-3xl font-black text-mint-900 tracking-wide leading-tight">
            《{j.t}》
          </div>
          <div className="mt-5 text-base sm:text-lg leading-9 text-mint-800 whitespace-pre-line">
            {j.s}
          </div>
          <div className="mt-6 flex items-end justify-between gap-2">
            <div className="text-5xl select-none opacity-30">🤣</div>
            <div className="text-xs text-mint-700/70 max-w-[55%] text-right">
              要是没笑，点 🎲 再来一个。心情就像巧克力，下一颗总不一样。
            </div>
          </div>
        </div>
      </div>
      <CopyBtn text={shareText} />
    </div>
  )
}

// ============ 人生锦囊 ============
function AdvicePanel() {
  const [idx, setIdx] = useState<number>(() => Math.floor(Math.random() * ADVICE_CARDS.length))
  const [animKey, setAnimKey] = useState(0)
  const card = ADVICE_CARDS[idx]
  const shareText =
`🀄 我今日抽到的人生建议：
《${card.t}》
${card.s}
—— 来自「薄荷小站」${ADVICE_CARDS.length} 张人生锦囊 ✨`
  function next() {
    let n = Math.floor(Math.random() * ADVICE_CARDS.length)
    if (n === idx) n = (n + 1) % ADVICE_CARDS.length
    setIdx(n); setAnimKey(k => k + 1)
  }
  return (
    <div className="space-y-4">
      <ResultBar
        left={<div>
          <div className="text-xs text-mint-700/70">共 {ADVICE_CARDS.length} 张锦囊，今天交给哪一张？</div>
          <div className="mt-0.5 text-lg font-bold text-mint-900">今日人生建议</div>
        </div>}
        right={
          <button onClick={next}
            className="btn-press text-xs px-3 py-1.5 rounded-full bg-rose-500 text-white shadow-soft hover:bg-rose-600">
            🎴 换一张
          </button>
        }
      />
      <div key={animKey} className="animate-popIn rounded-3xl bg-gradient-to-br from-rose-400 via-amber-300 to-mint-400 p-0.5 shadow-soft">
        <div className="rounded-[calc(1.5rem-2px)] bg-white/95 p-6 sm:p-8 text-center">
          <div className="text-[11px] tracking-[0.3em] text-mint-600 font-semibold">— LIFE ADVICE · NO.{String(idx+1).padStart(2,'0')} —</div>
          <div className="mt-5 text-3xl sm:text-4xl font-black text-mint-900 tracking-wide leading-tight">
            {card.t}
          </div>
          <div className="mt-5 text-base sm:text-lg leading-9 text-mint-800/95 px-2">
            {card.s}
          </div>
          <div className="mt-8 text-7xl opacity-30 select-none">🌿</div>
        </div>
      </div>
      <CopyBtn text={shareText} />
    </div>
  )
}

// ============ 公共组件 ============
function ResultBar({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 rounded-2xl bg-white/70 border border-mint-100 shadow-card p-4">
      {left}
      <div>{right}</div>
    </div>
  )
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { copyText(text); setCopied(true); setTimeout(()=>setCopied(false), 1500) }}
      className="btn-press w-full py-3 rounded-2xl bg-mint-600 text-white font-semibold shadow-soft hover:bg-mint-700 flex items-center justify-center gap-2">
      {copied ? (
        <><span>✅</span><span>已复制到剪贴板，发给朋友让 TA 也看看吧～</span></>
      ) : (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <span>一键复制结果</span>
        </>
      )}
    </button>
  )
}

export default Quiz
