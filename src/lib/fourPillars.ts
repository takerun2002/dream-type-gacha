// 四柱推命（日干）計算ロジック

export type HeavenlyStem = "甲" | "乙" | "丙" | "丁" | "戊" | "己" | "庚" | "辛" | "壬" | "癸";

export interface FourPillarsData {
  stem: HeavenlyStem;
  element: string; // 五行（木火土金水）
  polarity: string; // 陰陽
  keywords: string[];
  description: string;
}

export const HEAVENLY_STEMS: Record<string, FourPillarsData> = {
  甲: {
    stem: "甲",
    element: "木",
    polarity: "陽",
    keywords: ["大樹", "向上心", "リーダーシップ", "一本気"],
    description: "大樹のように真っ直ぐ空へ伸びる向上心を持っています。曲がったことが嫌いで、責任感が強く、周囲を引っ張っていくリーダー気質です。",
  },
  乙: {
    stem: "乙",
    element: "木",
    polarity: "陰",
    keywords: ["草花", "柔軟性", "協調性", "忍耐力"],
    description: "草花のように環境に合わせて柔軟に対応できる適応力があります。一見控えめですが、踏まれても立ち上がる芯の強さを持っています。",
  },
  丙: {
    stem: "丙",
    element: "火",
    polarity: "陽",
    keywords: ["太陽", "情熱", "カリスマ", "楽観的"],
    description: "太陽のように周囲を明るく照らす存在です。情熱的で裏表がなく、自然と人が集まってくるカリスマ性を持っています。",
  },
  丁: {
    stem: "丁",
    element: "火",
    polarity: "陰",
    keywords: ["灯火", "洞察力", "二面性", "情熱"],
    description: "静かに燃える灯火のように、内側に熱い情熱を秘めています。鋭い洞察力を持ち、物事の本質を見抜く力があります。",
  },
  戊: {
    stem: "戊",
    element: "土",
    polarity: "陽",
    keywords: ["山", "包容力", "安定感", "マイペース"],
    description: "雄大な山のように、どっしりとした安定感と包容力があります。些細なことには動じず、多くの人から頼りにされる存在です。",
  },
  己: {
    stem: "己",
    element: "土",
    polarity: "陰",
    keywords: ["大地", "育成", "庶民的", "多才"],
    description: "作物を育てる大地のように、人を育てたり教えたりすることが得意です。親しみやすく、多才で器用な一面を持っています。",
  },
  庚: {
    stem: "庚",
    element: "金",
    polarity: "陽",
    keywords: ["鉄", "決断力", "行動力", "正義感"],
    description: "鍛えられた鉄のように、強固な意志と決断力を持っています。正義感が強く、一度決めたことは最後までやり遂げる行動力があります。",
  },
  辛: {
    stem: "辛",
    element: "金",
    polarity: "陰",
    keywords: ["宝石", "美意識", "繊細", "特別感"],
    description: "磨かれることで輝く宝石のように、繊細で高い美意識を持っています。独自の感性を大切にし、特別な存在でありたいと願っています。",
  },
  壬: {
    stem: "壬",
    element: "水",
    polarity: "陽",
    keywords: ["海", "流動性", "知恵", "スケール"],
    description: "広大な海のように、スケールの大きな思考と自由な心を持っています。知恵が深く、状況に合わせて形を変える柔軟性があります。",
  },
  癸: {
    stem: "癸",
    element: "水",
    polarity: "陰",
    keywords: ["雨", "慈愛", "癒し", "忍耐"],
    description: "大地を潤す恵みの雨のように、優しく慈愛に満ちた心を持っています。静かに周囲を癒やし、時間をかけて物事を成し遂げる忍耐力があります。",
  },
};

const STEM_CHARS: HeavenlyStem[] = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];

/**
 * 生年月日から日干を算出する
 * @param year 西暦年
 * @param month 月 (1-12)
 * @param day 日 (1-31)
 */
export function calculateDailyStem(year: number, month: number, day: number): FourPillarsData {
  // 1900年1月1日（甲戌）を基準日とする
  const baseDate = new Date(1900, 0, 1); // month is 0-indexed in JS Date
  const targetDate = new Date(year, month - 1, day);

  // 経過日数を計算 (ミリ秒差分 / 1日あたりのミリ秒数)
  const diffTime = targetDate.getTime() - baseDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // 日干のインデックス計算
  // 甲戌(0)からスタートなので、単純に mod 10 で良い
  // ただし負の数の場合は調整が必要（1900年以前の場合など）
  let stemIndex = diffDays % 10;
  if (stemIndex < 0) stemIndex += 10;

  const stemChar = STEM_CHARS[stemIndex];
  return HEAVENLY_STEMS[stemChar];
}

