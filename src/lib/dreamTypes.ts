// 夢タイプ定義 - 9種類のきんまんカード対応
export interface DreamType {
  id: string;
  name: string;
  nameEn: string;
  displayName: string; // カード表示用の短い名前（不死鳥、妖狐等）
  icon: string;
  color: string;
  frameColor: string;
  cardImage: string;
  keywords: string[];
  description: string;
  strengths: string[];
  advice: string;
  element: string;
  personality: string;
}

export const dreamTypes: Record<string, DreamType> = {
  phoenix: {
    id: "phoenix",
    name: "鳳凰タイプ",
    nameEn: "Phoenix",
    displayName: "不死鳥",
    icon: "🔥",
    color: "#f97316",
    frameColor: "#d97706",
    cardImage: "/cards/kinman-phoenix.png",
    element: "火",
    keywords: ["再生", "情熱", "復活", "不死身"],
    personality: "何度でも蘇る不屈の精神",
    description: "あなたは鳳凰のように、どんな困難からも蘇る力を持っています。炎のような情熱で道を切り開き、灰の中からでも新しい自分として生まれ変われる強さがあります。",
    strengths: [
      "逆境に強い不屈の精神",
      "情熱的で周りを巻き込む力",
      "何度でも立ち上がれる回復力",
      "変化を恐れないチャレンジ精神",
    ],
    advice: "引き寄せノートには、過去に乗り越えた困難と、そこから得た強さを書き出してみましょう。あなたの不死鳥の力が、さらに大きな夢を引き寄せます。",
  },

  kitsune: {
    id: "kitsune",
    name: "九尾狐タイプ",
    nameEn: "Nine-Tailed Fox",
    displayName: "妖狐",
    icon: "🦊",
    color: "#94a3b8",
    frameColor: "#64748b",
    cardImage: "/cards/kinman-kitsune.png",
    element: "月",
    keywords: ["神秘", "知恵", "直感", "変化"],
    personality: "深い知恵と神秘的な直感",
    description: "あなたは九尾の狐のように、深い知恵と神秘的な直感を持っています。月明かりのように静かに、しかし確実に道を照らし、見えないものを感じ取る力があります。",
    strengths: [
      "鋭い直感と洞察力",
      "状況を読む知恵",
      "柔軟な変化対応力",
      "神秘的な魅力",
    ],
    advice: "引き寄せノートには、直感で感じたことを素直に書き留めましょう。月夜に静かにノートと向き合う時間が、あなたの引き寄せ力を高めます。",
  },

  pegasus: {
    id: "pegasus",
    name: "ペガサスタイプ",
    nameEn: "Pegasus",
    displayName: "天馬",
    icon: "🦄",
    color: "#fbbf24",
    frameColor: "#d4a574",
    cardImage: "/cards/kinman-pegasus.png",
    element: "天",
    keywords: ["自由", "理想", "飛翔", "純粋"],
    personality: "天高く舞う理想主義者",
    description: "あなたはペガサスのように、雲の上を自由に駆ける理想主義者です。純粋な心で高い目標を掲げ、誰もが無理だと思う夢でも軽々と叶えてしまう力があります。",
    strengths: [
      "高い理想と目標設定力",
      "自由な発想と創造性",
      "純粋で汚れのない心",
      "人々に希望を与える力",
    ],
    advice: "引き寄せノートには、誰にも遠慮せず、一番高い理想を書いてください。「無理かも」という思いは脇に置いて、空を自由に飛ぶペガサスのように。",
  },

  elephant: {
    id: "elephant",
    name: "聖象タイプ",
    nameEn: "Sacred Elephant",
    displayName: "聖象",
    icon: "🐘",
    color: "#9f1239",
    frameColor: "#881337",
    cardImage: "/cards/kinman-elephant.png",
    element: "地",
    keywords: ["繁栄", "幸運", "安定", "守護"],
    personality: "確かな足取りで幸運を運ぶ",
    description: "あなたは聖象のように、どっしりとした安定感と幸運を運ぶ力を持っています。一歩一歩確実に進み、周りの人にも豊かさと繁栄をもたらす存在です。",
    strengths: [
      "安定感と信頼性",
      "着実に目標を達成する力",
      "周りに繁栄をもたらす",
      "記憶力と学習能力の高さ",
    ],
    advice: "引き寄せノートには、叶えたい夢の具体的なステップを書き出しましょう。聖象のように一歩ずつ確実に、でも大きな夢を着実に引き寄せていきます。",
  },

  deer: {
    id: "deer",
    name: "神鹿タイプ",
    nameEn: "Sacred Deer",
    displayName: "神鹿",
    icon: "🦌",
    color: "#84cc16",
    frameColor: "#65a30d",
    cardImage: "/cards/kinman-deer.png",
    element: "森",
    keywords: ["優美", "調和", "成長", "純真"],
    personality: "森と共に生きる穏やかな魂",
    description: "あなたは神鹿のように、自然と調和し優美に生きる力を持っています。穏やかでありながら芯が強く、周りの人を癒しながら共に成長していける存在です。",
    strengths: [
      "自然体で人を癒す力",
      "調和を大切にする心",
      "静かな中に秘めた強さ",
      "成長を促す穏やかさ",
    ],
    advice: "引き寄せノートには、感謝の気持ちと穏やかな未来像を書きましょう。森の中で静かに過ごす鹿のように、心を落ち着けてノートと向き合う時間を大切に。",
  },

  dragon: {
    id: "dragon",
    name: "青龍タイプ",
    nameEn: "Azure Dragon",
    displayName: "龍神",
    icon: "🐉",
    color: "#0d9488",
    frameColor: "#0f766e",
    cardImage: "/cards/kinman-dragon.png",
    element: "水",
    keywords: ["叡智", "成功", "上昇", "威厳"],
    personality: "天へと昇る叡智の守護者",
    description: "あなたは青龍のように、深い叡智と上昇する力を持っています。水のように柔軟でありながら、一度決めたら天まで昇る勢いで目標を達成する力があります。",
    strengths: [
      "深い叡智と判断力",
      "上昇志向と成功への道筋",
      "威厳と信頼される存在感",
      "柔軟性と決断力の両立",
    ],
    advice: "引き寄せノートには、自分が成功した姿を具体的にイメージして書きましょう。龍のように天高く昇る自分の姿を、克明に描いてください。",
  },

  turtle: {
    id: "turtle",
    name: "玄武タイプ",
    nameEn: "Divine Turtle",
    displayName: "霊亀",
    icon: "🐢",
    color: "#22c55e",
    frameColor: "#16a34a",
    cardImage: "/cards/kinman-turtle.png",
    element: "大地",
    keywords: ["長寿", "守護", "堅実", "智慧"],
    personality: "悠久の時を見守る賢者",
    description: "あなたは玄武のように、長い時間をかけて確実に夢を叶える力を持っています。焦らず急がず、でも着実に。深い智慧で人生の道を見極めます。",
    strengths: [
      "長期的な視点と計画性",
      "忍耐強さと持続力",
      "守る力と安心感",
      "経験に基づく深い智慧",
    ],
    advice: "引き寄せノートには、5年後、10年後の長期的な夢も書いてみましょう。玄武のようにゆっくりでも確実に、大きな夢を引き寄せていきます。",
  },

  shark: {
    id: "shark",
    name: "宇宙鮫タイプ",
    nameEn: "Celestial Shark",
    displayName: "鯱王",
    icon: "🦈",
    color: "#3b82f6",
    frameColor: "#2563eb",
    cardImage: "/cards/kinman-shark.png",
    element: "宇宙",
    keywords: ["突破", "集中", "本能", "無限"],
    personality: "宇宙を泳ぐ直感のハンター",
    description: "あなたは宇宙鮫のように、無限の可能性の中を自由に泳ぎ、チャンスを逃さない鋭い本能を持っています。集中力と突破力で、目標を確実に捉えます。",
    strengths: [
      "圧倒的な集中力",
      "チャンスを逃さない嗅覚",
      "目標への一直線の突破力",
      "無限の可能性を感じる力",
    ],
    advice: "引き寄せノートには、今一番欲しいものに集中して書きましょう。宇宙鮫のように、一点突破で夢を掴み取る意識を持ってください。",
  },

  wolf: {
    id: "wolf",
    name: "銀狼タイプ",
    nameEn: "Silver Wolf",
    displayName: "月狼",
    icon: "🐺",
    color: "#a855f7",
    frameColor: "#9333ea",
    cardImage: "/cards/kinman-wolf.png",
    element: "風",
    keywords: ["仲間", "直感", "自立", "忠誠"],
    personality: "群れを率いる孤高のリーダー",
    description: "あなたは銀狼のように、自立心を持ちながらも仲間を大切にする力を持っています。一人でも強く、仲間と共にいればさらに強くなれる存在です。",
    strengths: [
      "自立心と独立精神",
      "仲間への深い忠誠心",
      "鋭い直感と警戒心",
      "リーダーシップ能力",
    ],
    advice: "引き寄せノートには、あなたの夢を一緒に叶えたい仲間のことも書いてみましょう。銀狼のように、孤高でありながら絆を大切にする引き寄せを。",
  },
};

export const dreamTypeList = Object.values(dreamTypes);

// カードタイプのID一覧
export const dreamTypeIds = Object.keys(dreamTypes);
