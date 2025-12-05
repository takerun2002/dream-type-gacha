// 診断用質問データ - 9種類のきんまんカード対応 + 記述式質問追加

export interface Question {
  id: number;
  text: string;
  type: "choice" | "text"; // 選択式 or 記述式
  options?: QuestionOption[]; // 選択式の場合のみ
  placeholder?: string; // 記述式の場合のプレースホルダー
}

export interface QuestionOption {
  id: string;
  text: string;
  points: Record<string, number>;
}

export const questions: Question[] = [
  {
    id: 1,
    type: "choice",
    text: "困難に直面したとき、あなたはどうしますか？",
    options: [
      {
        id: "1a",
        text: "何度でも立ち上がって挑戦する",
        points: { phoenix: 3 },
      },
      {
        id: "1b",
        text: "直感を信じて別の道を探す",
        points: { kitsune: 2, wolf: 1 },
      },
      {
        id: "1c",
        text: "高い視点から状況を見直す",
        points: { pegasus: 2, dragon: 1 },
      },
      {
        id: "1d",
        text: "焦らず時間をかけて解決する",
        points: { turtle: 2, elephant: 1 },
      },
    ],
  },
  {
    id: 2,
    type: "choice",
    text: "理想の休日の過ごし方は？",
    options: [
      {
        id: "2a",
        text: "新しい場所を冒険する",
        points: { shark: 2, pegasus: 1 },
      },
      {
        id: "2b",
        text: "自然の中でゆっくり過ごす",
        points: { deer: 3 },
      },
      {
        id: "2c",
        text: "仲間と一緒に盛り上がる",
        points: { wolf: 2, phoenix: 1 },
      },
      {
        id: "2d",
        text: "静かに読書や勉強をする",
        points: { dragon: 2, kitsune: 1 },
      },
    ],
  },
  {
    id: 3,
    type: "choice",
    text: "あなたが大切にしている価値観は？",
    options: [
      {
        id: "3a",
        text: "情熱と再挑戦",
        points: { phoenix: 2, shark: 1 },
      },
      {
        id: "3b",
        text: "自由と理想",
        points: { pegasus: 2, wolf: 1 },
      },
      {
        id: "3c",
        text: "安定と繁栄",
        points: { elephant: 2, turtle: 1 },
      },
      {
        id: "3d",
        text: "調和と成長",
        points: { deer: 2, dragon: 1 },
      },
    ],
  },
  {
    id: 4,
    type: "text",
    text: "あなたの叶えたい夢は何ですか？",
    placeholder: "例：起業して自分の会社を作りたい、世界中を旅したい、など",
  },
  {
    id: 5,
    type: "choice",
    text: "友人からよく言われることは？",
    options: [
      {
        id: "5a",
        text: "頼りになる、信頼できる",
        points: { elephant: 2, turtle: 1 },
      },
      {
        id: "5b",
        text: "不思議な魅力がある",
        points: { kitsune: 2, deer: 1 },
      },
      {
        id: "5c",
        text: "一緒にいると元気が出る",
        points: { phoenix: 2, wolf: 1 },
      },
      {
        id: "5d",
        text: "夢が大きい、理想が高い",
        points: { pegasus: 2, dragon: 1 },
      },
    ],
  },
  {
    id: 6,
    type: "choice",
    text: "夢を叶えるために最も大切なことは？",
    options: [
      {
        id: "6a",
        text: "諦めない強い心",
        points: { phoenix: 2, shark: 1 },
      },
      {
        id: "6b",
        text: "直感を信じる勇気",
        points: { kitsune: 2, wolf: 1 },
      },
      {
        id: "6c",
        text: "仲間との絆",
        points: { wolf: 2, deer: 1 },
      },
      {
        id: "6d",
        text: "長期的な計画",
        points: { turtle: 2, dragon: 1 },
      },
    ],
  },
  {
    id: 7,
    type: "text",
    text: "今、あなたが一番大切にしていることは何ですか？",
    placeholder: "例：家族、仕事、健康、趣味、など",
  },
  {
    id: 8,
    type: "choice",
    text: "ストレスを感じたときの対処法は？",
    options: [
      {
        id: "8a",
        text: "体を動かしてスッキリする",
        points: { shark: 2, phoenix: 1 },
      },
      {
        id: "8b",
        text: "自然の中でリフレッシュ",
        points: { deer: 2, turtle: 1 },
      },
      {
        id: "8c",
        text: "信頼できる人に話を聞いてもらう",
        points: { wolf: 2, elephant: 1 },
      },
      {
        id: "8d",
        text: "静かに自分と向き合う",
        points: { kitsune: 2, dragon: 1 },
      },
    ],
  },
  {
    id: 9,
    type: "choice",
    text: "あなたの強みは？",
    options: [
      {
        id: "9a",
        text: "リーダーシップと影響力",
        points: { dragon: 2, wolf: 1 },
      },
      {
        id: "9b",
        text: "共感力と癒しの力",
        points: { deer: 2, kitsune: 1 },
      },
      {
        id: "9c",
        text: "集中力と突破力",
        points: { shark: 2, phoenix: 1 },
      },
      {
        id: "9d",
        text: "忍耐力と安定感",
        points: { turtle: 2, elephant: 1 },
      },
    ],
  },
  {
    id: 10,
    type: "choice",
    text: "5年後、どんな自分でいたい？",
    options: [
      {
        id: "10a",
        text: "大きな夢を叶えている自分",
        points: { phoenix: 2, dragon: 1 },
      },
      {
        id: "10b",
        text: "自由に世界を飛び回る自分",
        points: { pegasus: 2, shark: 1 },
      },
      {
        id: "10c",
        text: "大切な人を幸せにしている自分",
        points: { wolf: 2, elephant: 1 },
      },
      {
        id: "10d",
        text: "穏やかで充実した日々を送る自分",
        points: { deer: 2, turtle: 1 },
      },
    ],
  },
];

// 診断結果を計算する関数（選択式のみ）
export function calculateResult(answers: Array<{ questionId: number; answerId?: string; textAnswer?: string }>): string {
  const scores: Record<string, number> = {
    phoenix: 0,
    kitsune: 0,
    pegasus: 0,
    elephant: 0,
    deer: 0,
    dragon: 0,
    turtle: 0,
    shark: 0,
    wolf: 0,
  };

  // 各回答のポイントを集計（選択式のみ）
  answers.forEach((answer) => {
    if (answer.answerId) {
      const question = questions.find((q) => q.id === answer.questionId);
      if (question && question.options) {
        const option = question.options.find((opt) => opt.id === answer.answerId);
        if (option) {
          Object.entries(option.points).forEach(([type, points]) => {
            scores[type] += points;
          });
        }
      }
    }
  });

  // 最高スコアのタイプを返す
  let maxType = "phoenix";
  let maxScore = 0;

  Object.entries(scores).forEach(([type, score]) => {
    if (score > maxScore) {
      maxScore = score;
      maxType = type;
    }
  });

  return maxType;
}

// スコア詳細を取得する関数（デバッグ・詳細表示用）
export function calculateScores(answers: Array<{ questionId: number; answerId?: string; textAnswer?: string }>): Record<string, number> {
  const scores: Record<string, number> = {
    phoenix: 0,
    kitsune: 0,
    pegasus: 0,
    elephant: 0,
    deer: 0,
    dragon: 0,
    turtle: 0,
    shark: 0,
    wolf: 0,
  };

  answers.forEach((answer) => {
    if (answer.answerId) {
      const question = questions.find((q) => q.id === answer.questionId);
      if (question && question.options) {
        const option = question.options.find((opt) => opt.id === answer.answerId);
        if (option) {
          Object.entries(option.points).forEach(([type, points]) => {
            scores[type] += points;
          });
        }
      }
    }
  });

  return scores;
}
