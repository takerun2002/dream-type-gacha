import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { dreamTypes } from "@/lib/dreamTypes";
import { calculateResult, calculateScores } from "@/lib/questions";
import { calculateDailyStem, FourPillarsData } from "@/lib/fourPillars";
import { 
  DreamTypeDiagnosisEngine, 
  FortuneDiagnosisResult,
  ELEMENT_INFO 
} from "@/lib/fortuneEngine";

// Gemini API初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Gemini 2.5 Proでパーソナライズされた診断メッセージを生成
 */
async function generatePersonalizedMessage(
  userName: string,
  dreamType: typeof dreamTypes[keyof typeof dreamTypes],
  fourPillarsData: FourPillarsData | null,
  fortuneData: FortuneDiagnosisResult | null,
  answers: Array<{ questionId: number; answerId?: string; textAnswer?: string }>,
  scores: Record<string, number>
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  // 記述式回答を抽出
  const { questions: allQuestions } = await import("@/lib/questions");
  const textAnswers = answers
    .filter((a) => a.textAnswer)
    .map((a) => {
      const question = allQuestions.find((q) => q.id === a.questionId);
      return `Q: ${question?.text}\nA: ${a.textAnswer}`;
    })
    .join("\n\n");

  // 四柱推命情報（既存）
  let fourPillarsInfo = "";
  if (fourPillarsData) {
    fourPillarsInfo = `
【四柱推命データ（日干）】
日干: ${fourPillarsData.stem}（${fourPillarsData.element}・${fourPillarsData.polarity}）
性格キーワード: ${fourPillarsData.keywords.join("、")}
四柱推命的特徴: ${fourPillarsData.description}
`;
  }

  // 統合占術情報（Manus AI調査版）
  let fortuneInfo = "";
  if (fortuneData) {
    const balance = fortuneData.bazi.elementBalance;
    const dominantElements = Object.entries(balance)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([elem, val]) => `${ELEMENT_INFO[elem as keyof typeof ELEMENT_INFO]?.name}(${val})`)
      .join("、");

    fortuneInfo = `
【統合占術データ】
◆ 四柱推命（命式）
  年柱: ${fortuneData.bazi.meishiki.year.pillar}
  月柱: ${fortuneData.bazi.meishiki.month.pillar}
  日柱: ${fortuneData.bazi.meishiki.day.pillar}
  五行バランス: ${dominantElements} が強い

◆ 九星気学
  本命星: ${fortuneData.kyusei.info.name}
  特性: ${fortuneData.kyusei.info.character}
  系統: ${fortuneData.kyusei.info.type}

◆ 数秘術
  ライフパスナンバー: ${fortuneData.numerology.lifePathNumber.number}
  タイプ: ${fortuneData.numerology.lifePathNumber.info.name}
  使命: ${fortuneData.numerology.lifePathNumber.info.mission}

◆ 占術診断スコア
  主要タイプ: ${fortuneData.dreamType.primary.info.name}（スコア${fortuneData.dreamType.primary.score.toFixed(1)}）
  副次タイプ: ${fortuneData.dreamType.secondary.info.name}（スコア${fortuneData.dreamType.secondary.score.toFixed(1)}）
`;
  }

  // プロンプト構築
  const prompt = `あなたは「引き寄せノート」の専門家で、きんまん先生の夢タイプ診断を担当しています。

【ユーザー情報】
名前: ${userName}
診断結果: ${dreamType.name}（${dreamType.nameEn}）
タイプの特徴: ${dreamType.keywords.join("、")}
${dreamType.description}
${fourPillarsInfo}
${fortuneInfo}

【ユーザーの回答】
${textAnswers || "記述式の回答はありませんでした。"}

【診断スコア（質問回答）】
${Object.entries(scores)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 3)
  .map(([type, score]) => `${dreamTypes[type]?.name}: ${score}点`)
  .join("\n")}

【指示】
上記の情報を基に、${userName}さんに寄り添った、温かく励ましのメッセージを200〜300文字で作成してください。

以下の要素を含めてください：
1. ${userName}さんの夢や大切にしていることへの共感
2. ${dreamType.name}としての強みや可能性
3. 占術データ（四柱推命の五行バランス、九星気学の本命星、数秘術のライフパス）を自然に織り交ぜながら、その人の本質的な強みを肯定する
4. 引き寄せノートの具体的なアドバイス
5. 前向きで希望に満ちた言葉

文体は優しく、親しみやすく、でも真剣に寄り添う感じでお願いします。絵文字は使わず、純粋な日本語で書いてください。`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // 余分な改行や空白を整理
    return text.trim().replace(/\n{3,}/g, "\n\n");
  } catch (error) {
    console.error("Gemini API エラー:", error);
    // フォールバック: デフォルトメッセージ
    return `${userName}さん、あなたの夢タイプは「${dreamType.name}」です。\n\n${dreamType.description}\n\n引き寄せノートには、あなたの夢や大切にしていることを書き出してみてください。${dreamType.name}としてのあなたの強みを活かして、素敵な未来を引き寄せていきましょう。`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, answers, birthDate } = body;

    if (!name || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { success: false, error: "名前と回答が必要です" },
        { status: 400 }
      );
    }

    // 質問回答から診断結果を計算
    const resultType = calculateResult(answers);
    const scores = calculateScores(answers);
    const typeData = dreamTypes[resultType];

    if (!typeData) {
      return NextResponse.json(
        { success: false, error: "診断結果の取得に失敗しました" },
        { status: 500 }
      );
    }

    // 四柱推命データを計算（既存）
    let fourPillarsData: FourPillarsData | null = null;
    if (birthDate && birthDate.year && birthDate.month && birthDate.day) {
      fourPillarsData = calculateDailyStem(birthDate.year, birthDate.month, birthDate.day);
    }

    // 統合占術データを計算（Manus AI調査版: 四柱推命・九星気学・数秘術）
    let fortuneData: FortuneDiagnosisResult | null = null;
    if (birthDate && birthDate.year && birthDate.month && birthDate.day) {
      fortuneData = DreamTypeDiagnosisEngine.diagnose(
        birthDate.year, 
        birthDate.month, 
        birthDate.day, 
        12 // デフォルト正午
      );
    }

    // 占術スコアと質問スコアを統合して最終タイプを決定
    let finalDreamType = resultType;
    if (fortuneData) {
      // 質問スコアと占術スコアを統合（質問60%、占術40%）
      const fortuneScores = fortuneData.dreamType.allScores;
      const combinedScores: Record<string, number> = {};
      
      for (const type of Object.keys(scores)) {
        const questionScore = scores[type] || 0;
        const fortuneScore = fortuneScores[type] || 0;
        combinedScores[type] = (questionScore * 0.6) + (fortuneScore * 0.4);
      }
      
      // 最高スコアのタイプを最終結果に
      const topType = Object.entries(combinedScores)
        .sort((a, b) => b[1] - a[1])[0][0];
      
      finalDreamType = topType;
    }

    const finalTypeData = dreamTypes[finalDreamType] || typeData;

    // Gemini APIでパーソナライズされたメッセージを生成
    const personalizedMessage = await generatePersonalizedMessage(
      name,
      finalTypeData,
      fourPillarsData,
      fortuneData,
      answers,
      scores
    );

    // レスポンスを返す
    return NextResponse.json({
      success: true,
      result: {
        dreamType: finalDreamType,
        typeName: finalTypeData.name,
        typeNameEn: finalTypeData.nameEn,
        icon: finalTypeData.icon,
        color: finalTypeData.color,
        frameColor: finalTypeData.frameColor,
        cardImage: finalTypeData.cardImage,
        element: finalTypeData.element,
        keywords: finalTypeData.keywords,
        personality: finalTypeData.personality,
        description: finalTypeData.description,
        strengths: finalTypeData.strengths,
        advice: finalTypeData.advice,
        personalizedMessage,
        scores,
        fourPillarsData,
        fortuneData, // 統合占術データも返す
      },
    });
  } catch (error) {
    console.error("診断エラー:", error);
    return NextResponse.json(
      { success: false, error: "診断処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
