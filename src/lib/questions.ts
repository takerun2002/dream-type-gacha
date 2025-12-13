// 診断用質問データ - 9種類のきんまんカード対応 + 記述式質問追加
// 🔄 バランス調整版v2: 全タイプが均等に出るように設計

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

/**
 * 質問設計のバランス目標:
 * - 選択式8問 × 4選択肢 = 32選択肢
 * - 各選択肢: メイン(+2) × 1, サブ(+1) × 1
 * - 9タイプ: 各合計ポイントが10-11になるよう均等配分
 */

export const questions: Question[] = [
  {
    id: 1,
    type: "choice",
    text: "困難に直面したとき、あなたはどうしますか？",
    options: [
      {
        id: "1a",
        text: "何度でも立ち上がって挑戦する",
        points: { phoenix: 2, elephant: 1 },
      },
      {
        id: "1b",
        text: "直感を信じて別の道を探す",
        points: { kitsune: 2, dragon: 1 },
      },
      {
        id: "1c",
        text: "高い視点から状況を見直す",
        points: { pegasus: 2, turtle: 1 },
      },
      {
        id: "1d",
        text: "焦らず時間をかけて解決する",
        points: { turtle: 2, wolf: 1 },
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
        points: { deer: 2, elephant: 1 },
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
        points: { elephant: 2, shark: 1 },
      },
      {
        id: "5b",
        text: "不思議な魅力がある",
        points: { kitsune: 2, deer: 1 },
      },
      {
        id: "5c",
        text: "一緒にいると元気が出る",
        points: { wolf: 2, phoenix: 1 },
      },
      {
        id: "5d",
        text: "夢が大きい、理想が高い",
        points: { dragon: 2, pegasus: 1 },
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
        points: { shark: 2, phoenix: 1 },
      },
      {
        id: "6b",
        text: "直感を信じる勇気",
        points: { kitsune: 2, pegasus: 1 },
      },
      {
        id: "6c",
        text: "仲間との絆",
        points: { wolf: 2, elephant: 1 },
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
        points: { shark: 2, wolf: 1 },
      },
      {
        id: "8b",
        text: "自然の中でリフレッシュ",
        points: { deer: 2, turtle: 1 },
      },
      {
        id: "8c",
        text: "信頼できる人に話を聞いてもらう",
        points: { elephant: 2, kitsune: 1 },
      },
      {
        id: "8d",
        text: "静かに自分と向き合う",
        points: { dragon: 2, deer: 1 },
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
        points: { dragon: 2, shark: 1 },
      },
      {
        id: "9b",
        text: "共感力と癒しの力",
        points: { deer: 2, kitsune: 1 },
      },
      {
        id: "9c",
        text: "集中力と突破力",
        points: { phoenix: 2, turtle: 1 },
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
        points: { wolf: 2, kitsune: 1 },
      },
      {
        id: "10d",
        text: "穏やかで充実した日々を送る自分",
        points: { kitsune: 2, elephant: 1 },
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

  // 最高スコアのタイプを返す（同点の場合も同じ回答なら同じ結果になるよう決定論的に選択）
  let maxScore = 0;
  const topTypes: string[] = [];

  Object.entries(scores).forEach(([type, score]) => {
    if (score > maxScore) {
      maxScore = score;
      topTypes.length = 0;
      topTypes.push(type);
    } else if (score === maxScore) {
      topTypes.push(type);
    }
  });

  // 同点の場合は決定論的に選択（同じ回答なら毎回同じ結果）
  if (topTypes.length > 1) {
    const rank: Record<string, number> = {
      phoenix: 0,
      kitsune: 1,
      pegasus: 2,
      elephant: 3,
      deer: 4,
      dragon: 5,
      turtle: 6,
      shark: 7,
      wolf: 8,
    };
    const sortedTopTypes = topTypes
      .slice()
      .sort((a, b) => (rank[a] ?? 999) - (rank[b] ?? 999));

    const seed = answers
      .filter((a) => a.answerId)
      .map((a) => `${a.questionId}:${a.answerId}`)
      .sort()
      .join("|");
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    const chosen = sortedTopTypes[hash % sortedTopTypes.length];

    return chosen;
  }

  return topTypes[0] || "phoenix";
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

// デバッグ用: ポイント分布を確認する関数
export function analyzePointDistribution(): { main: Record<string, number>; sub: Record<string, number> } {
  const mainCount: Record<string, number> = {
    phoenix: 0, kitsune: 0, pegasus: 0, elephant: 0,
    deer: 0, dragon: 0, turtle: 0, shark: 0, wolf: 0,
  };
  const subCount: Record<string, number> = {
    phoenix: 0, kitsune: 0, pegasus: 0, elephant: 0,
    deer: 0, dragon: 0, turtle: 0, shark: 0, wolf: 0,
  };

  questions.forEach((q) => {
    if (q.options) {
      q.options.forEach((opt) => {
        Object.entries(opt.points).forEach(([type, points]) => {
          if (points >= 2) {
            mainCount[type]++;
          } else {
            subCount[type]++;
          }
        });
      });
    }
  });

  return { main: mainCount, sub: subCount };
}
