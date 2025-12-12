import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { dreamTypes } from "@/lib/dreamTypes";

// Gemini API初期化
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("⚠️ GEMINI_API_KEY is not set!");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");

// 引き寄せノート講座の知識ベース
const KNOWLEDGE_BASE = `
【引き寄せノート講座について】
きんまん先生が教える「引き寄せノート講座」は、願いを叶えるためのノート術です。
自分の夢や願いを言語化し、ノートに書くことで潜在意識に働きかけ、現実を引き寄せる手法を学びます。

【夢タイプ診断ガチャについて】
夢タイプ診断ガチャは、引き寄せノート講座の特典コンテンツです。
質問に答えることで、あなたの夢の叶え方のタイプを診断し、パーソナライズされた鑑定書をお届けします。
診断には四柱推命、九星気学、数秘術の要素も取り入れています。

【8つの夢タイプ】
${Object.values(dreamTypes)
  .map(
    (type) => `
■ ${type.name}（${type.icon}）
キーワード: ${type.keywords.join("、")}
特徴: ${type.description}
強み: ${type.strengths.join("、")}
アドバイス: ${type.advice}
`
  )
  .join("\n")}

【引き寄せノートの基本的な書き方】
1. 願いは「〜したい」ではなく「〜している」と現在形で書く
2. 具体的にイメージできるように詳細を書く
3. 感謝の気持ちを添える
4. 定期的に見返して、叶った願いにはチェックを入れる
5. ネガティブな表現は避け、ポジティブな言葉を使う

【きんまん先生について】
引き寄せノート講座の講師。スピリチュアルと実践的なノート術を組み合わせた独自のメソッドで多くの方の夢の実現をサポートしています。

【お問い合わせ】
詳しい講座内容やお申し込みについては、公式サイトをご確認ください。
`;

// システムプロンプト
const SYSTEM_PROMPT = `あなたは「オペレーターRASくん」です。
きんまん先生の引き寄せノート講座と夢タイプ診断ガチャのサポートを担当しています。

あなたの性格と話し方：
- 明るく元気で、ユーザーを応援するポジティブな性格
- 親しみやすく、温かい言葉遣い
- スピリチュアルな知識がありつつも、わかりやすく説明できる
- 「〜ですよ！」「〜ですね！」など、少しカジュアルな敬語を使う
- 長すぎる回答は避け、200文字程度を目安に簡潔に答える
- 絵文字は使わない

以下の知識ベースを参照して回答してください：

${KNOWLEDGE_BASE}

回答の注意点：
1. 知識ベースにない情報は「わかりません」と正直に答える
2. 診断結果についての質問は、上記の夢タイプ情報を参照して答える
3. 講座の詳細な料金や日程などは「公式サイトでご確認ください」と案内する
4. 質問の意図が不明な場合は、優しく聞き返す
5. 常に前向きで、ユーザーの夢を応援する姿勢を持つ`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId } = body;

    if (!message) {
      return NextResponse.json(
        { error: "メッセージが必要です" },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "APIの設定に問題があります" },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const chat = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    const prompt = `${SYSTEM_PROMPT}

ユーザーからの質問: ${message}

上記の質問に対して、オペレーターRASくんとして回答してください。`;

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      response: text.trim(),
      sessionId,
    });
  } catch (error) {
    console.error("RAG Chat error:", error);
    return NextResponse.json(
      {
        error: "回答の生成に失敗しました",
        response:
          "すみません、一時的にエラーが発生しています。少し時間をおいてからもう一度お試しください。",
      },
      { status: 500 }
    );
  }
}
