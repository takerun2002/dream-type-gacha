import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

// Supabaseクライアント
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Discord Webhook URL（環境変数で設定、未設定でもエラーにしない）
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Gemini API
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface SupportRequestBody {
  user: {
    name: string;
    dreamType: string;
    fingerprint?: string;
  };
  conversation: ConversationMessage[];
  issue: string;
  severity?: "low" | "medium" | "high";
  scenario?: {
    selectedCategory: string;
    viewedFaqs: string[];
  };
}

// LLMで問い合わせを分析し、対応提案を生成
async function analyzeInquiryWithLLM(
  issue: string,
  userName: string,
  dreamType: string,
  scenario?: { selectedCategory: string; viewedFaqs: string[] }
): Promise<{ summary: string; suggestedResponse: string; priority: string }> {
  if (!ai) {
    return {
      summary: issue.substring(0, 100),
      suggestedResponse: "Gemini API未設定のため自動分析できません",
      priority: "medium",
    };
  }

  try {
    const prompt = `あなたはカスタマーサポートのアシスタントです。以下の問い合わせを分析し、対応方法を提案してください。

【サービス概要】
夢タイプ診断ガチャ - きんまん先生の引き寄せノート講座の特典として提供している無料の診断サービス。
四柱推命・九星気学・数秘術を組み合わせたAI診断で、ユーザー専用のカード画像を生成する。
診断は1人1回限り。

【ユーザー情報】
- 名前: ${userName}
- 夢タイプ: ${dreamType}
${scenario ? `- 確認したFAQカテゴリ: ${scenario.selectedCategory}` : ""}
${scenario?.viewedFaqs?.length ? `- 確認したFAQ: ${scenario.viewedFaqs.join(", ")}` : ""}

【問い合わせ内容】
${issue}

【出力形式】
以下の形式でJSONで回答してください：
{
  "summary": "問い合わせ内容の要約（50文字以内）",
  "suggestedResponse": "CSが返信する際の提案文（200文字以内、丁寧な敬語で）",
  "priority": "high/medium/low のいずれか"
}

priorityの基準:
- high: 金銭トラブル、個人情報漏洩、サービス利用不可など緊急性の高いもの
- medium: 機能の不具合、画像保存できないなど通常のトラブル
- low: 質問、要望、軽微な問題`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = response.text || "";

    // JSONを抽出
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || issue.substring(0, 100),
          suggestedResponse: parsed.suggestedResponse || "自動分析できませんでした",
          priority: parsed.priority || "medium",
        };
      } catch {
        console.error("JSON解析エラー:", text);
      }
    }

    return {
      summary: issue.substring(0, 100),
      suggestedResponse: "自動分析できませんでした",
      priority: "medium",
    };
  } catch (error) {
    console.error("LLM分析エラー:", error);
    return {
      summary: issue.substring(0, 100),
      suggestedResponse: "LLM分析エラー",
      priority: "medium",
    };
  }
}

export async function POST(request: Request) {
  try {
    const body: SupportRequestBody = await request.json();
    const { user, conversation, issue, scenario } = body;

    // 入力バリデーション
    if (!user?.name || !issue) {
      return NextResponse.json(
        { success: false, error: "必須項目が不足しています" },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();

    // 結果を追跡
    const results: { webhook?: boolean; database?: boolean; error?: string } = {};

    // LLM分析を実行
    const analysis = await analyzeInquiryWithLLM(
      issue,
      user.name,
      user.dreamType || "不明",
      scenario
    );

    // 1. Discord Webhook送信（URL設定されている場合のみ）
    if (DISCORD_WEBHOOK_URL) {
      try {
        // 夢タイプの日本語名マッピング
        const dreamTypeNames: Record<string, string> = {
          phoenix: "不死鳥",
          dragon: "龍",
          wolf: "狼",
          deer: "鹿",
          fox: "妖狐",
          kitsune: "妖狐",
          turtle: "亀",
          pegasus: "ペガサス",
          elephant: "象",
          shark: "シャーク",
        };

        const dreamTypeName = user.dreamType
          ? dreamTypeNames[user.dreamType] || user.dreamType
          : "不明";

        // 会話履歴を整形（最新5件まで）
        const recentConversation = (conversation || []).slice(-5);
        const conversationText = recentConversation.length > 0
          ? recentConversation
              .map((msg) => `**${msg.role === "user" ? "ユーザー" : "RASくん"}**: ${msg.content.substring(0, 150)}${msg.content.length > 150 ? "..." : ""}`)
              .join("\n")
          : "会話履歴なし";

        // 優先度に応じた色
        const priorityColors: Record<string, number> = {
          high: 0xff0000,    // 赤
          medium: 0xffa500,  // オレンジ
          low: 0x00ff00,     // 緑
        };

        const priorityLabels: Record<string, string> = {
          high: "🔴 緊急",
          medium: "🟡 通常",
          low: "🟢 低",
        };

        // シナリオ情報
        const scenarioText = scenario
          ? `カテゴリ: ${scenario.selectedCategory}\n確認FAQ: ${scenario.viewedFaqs?.length || 0}件`
          : "シナリオ情報なし";

        // Discord Embed形式のペイロード（2つのEmbed）
        const discordPayload = {
          content: `📨 **新しいサポート問い合わせ** ${priorityLabels[analysis.priority] || priorityLabels.medium}`,
          embeds: [
            {
              title: "問い合わせ内容",
              color: priorityColors[analysis.priority] || priorityColors.medium,
              fields: [
                {
                  name: "👤 ユーザー名",
                  value: user.name || "不明",
                  inline: true,
                },
                {
                  name: "🎴 夢タイプ",
                  value: dreamTypeName,
                  inline: true,
                },
                {
                  name: "📂 カテゴリ",
                  value: scenario?.selectedCategory || "その他",
                  inline: true,
                },
                {
                  name: "📝 お困りの内容",
                  value: issue.substring(0, 800) || "内容なし",
                  inline: false,
                },
                {
                  name: "📋 シナリオ情報",
                  value: scenarioText,
                  inline: false,
                },
                {
                  name: "💬 直近の会話",
                  value: conversationText.substring(0, 800) || "なし",
                  inline: false,
                },
              ],
              timestamp,
              footer: {
                text: "夢タイプ診断ガチャ サポート",
              },
            },
            {
              title: "🤖 AI分析・対応提案",
              color: 0x5865f2, // Discord青
              fields: [
                {
                  name: "📊 要約",
                  value: analysis.summary,
                  inline: false,
                },
                {
                  name: "💡 推奨対応",
                  value: analysis.suggestedResponse,
                  inline: false,
                },
                {
                  name: "⚡ 優先度",
                  value: priorityLabels[analysis.priority] || "🟡 通常",
                  inline: true,
                },
              ],
              footer: {
                text: "Gemini AI による自動分析",
              },
            },
          ],
        };

        const webhookResponse = await fetch(DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(discordPayload),
        });
        results.webhook = webhookResponse.ok;
        if (!webhookResponse.ok) {
          console.error("Discord Webhook送信失敗:", await webhookResponse.text());
        }
      } catch (webhookError) {
        console.error("Discord Webhook送信エラー:", webhookError);
        results.webhook = false;
      }
    } else {
      console.log("DISCORD_WEBHOOK_URL未設定のためWebhookスキップ");
    }

    // 2. Supabaseに保存
    if (supabaseUrl && supabaseAnonKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        const { error: dbError } = await supabase
          .from("support_inquiries")
          .insert({
            user_name: user.name,
            dream_type: user.dreamType || null,
            fingerprint: user.fingerprint || null,
            issue_summary: issue,
            conversation: conversation || [],
            status: "open",
            notes: JSON.stringify({
              scenario,
              aiAnalysis: analysis,
            }),
          });

        if (dbError) {
          console.error("DB保存エラー:", dbError);
          results.database = false;
          results.error = dbError.message;
        } else {
          results.database = true;
        }
      } catch (dbError) {
        console.error("Supabaseエラー:", dbError);
        results.database = false;
      }
    } else {
      console.log("Supabase未設定のためDB保存スキップ");
    }

    // 少なくともどちらか一方が成功すればOK
    const success = results.webhook || results.database;

    return NextResponse.json({
      success,
      message: success
        ? "サポートに報告しました"
        : "報告に失敗しました。時間をおいて再度お試しください。",
      details: results,
    });
  } catch (error) {
    console.error("Support webhook API error:", error);
    return NextResponse.json(
      { success: false, error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
