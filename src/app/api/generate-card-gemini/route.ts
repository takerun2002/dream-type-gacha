/**
 * カード画像生成API - Google Gemini API優先 + FAL AIフォールバック
 * NanoBanana Pro (Gemini 2.0 Flash) → FAL AI (nano-banana)
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { fal } from "@fal-ai/client";
import fs from "fs";
import path from "path";
import satori from "satori";
import sharp from "sharp";
import React from "react";

// 🔐 APIキーチェック（サーバーサイドのみ）
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("⚠️ GEMINI_API_KEY is not set!");
}

// Gemini API初期化（優先）
const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY || "",
});

// FAL AI初期化（フォールバック）
fal.config({
  credentials: process.env.FAL_KEY || "",
});

// ==================== 型定義 ====================

interface FortuneDataForCard {
  bazi?: {
    yearPillar: string;
    monthPillar: string;
    dayPillar: string;
    elementBalance: {
      wood: number;
      fire: number;
      earth: number;
      metal: number;
      water: number;
    };
  };
  kyusei?: {
    name: string;
    character: string;
  };
  numerology?: {
    lifePathNumber: number;
    name: string;
    mission: string;
  };
}

interface CardTemplate {
  id: string;
  cardImage: string;
  primaryColor: string;
  attribute: string;
  attributeKanji: string;
  attributeEmoji: string;
}

interface GenerateCardRequest {
  dreamType: string;
  typeName: string;
  displayName: string;
  icon: string;
  userName: string;
  element: string;
  keywords: string[];
  personality: string;
  strengths: string[];
  personalizedMessage: string;
  fortuneData?: FortuneDataForCard;
  compatibility?: {
    goodTypes: string[];
    luckyColor: string;
    luckyNumber: string;
  };
}

// ==================== テンプレート設定 ====================

const CARD_TEMPLATES: Record<string, CardTemplate> = {
  phoenix: { 
    id: "phoenix", 
    cardImage: "/cards/kinman-phoenix.png", 
    primaryColor: "#f97316",
    attribute: "FIRE",
    attributeKanji: "火",
    attributeEmoji: "🔥"
  },
  kitsune: { 
    id: "kitsune", 
    cardImage: "/cards/kinman-kitsune.png", 
    primaryColor: "#eab308",
    attribute: "LIGHT",
    attributeKanji: "光",
    attributeEmoji: "✨"
  },
  pegasus: { 
    id: "pegasus", 
    cardImage: "/cards/kinman-pegasus.png", 
    primaryColor: "#a855f7",
    attribute: "WIND",
    attributeKanji: "風",
    attributeEmoji: "🌬️"
  },
  elephant: { 
    id: "elephant", 
    cardImage: "/cards/kinman-elephant.png", 
    primaryColor: "#6b7280",
    attribute: "EARTH",
    attributeKanji: "地",
    attributeEmoji: "🌍"
  },
  deer: { 
    id: "deer", 
    cardImage: "/cards/kinman-deer.png", 
    primaryColor: "#22c55e",
    attribute: "WOOD",
    attributeKanji: "木",
    attributeEmoji: "🌿"
  },
  dragon: { 
    id: "dragon", 
    cardImage: "/cards/kinman-dragon.png", 
    primaryColor: "#ef4444",
    attribute: "FIRE",
    attributeKanji: "炎",
    attributeEmoji: "🐉"
  },
  turtle: { 
    id: "turtle", 
    cardImage: "/cards/kinman-turtle.png", 
    primaryColor: "#14b8a6",
    attribute: "WATER",
    attributeKanji: "水",
    attributeEmoji: "🌊"
  },
  shark: { 
    id: "shark", 
    cardImage: "/cards/kinman-shark.png", 
    primaryColor: "#3b82f6",
    attribute: "WATER",
    attributeKanji: "海",
    attributeEmoji: "🦈"
  },
  wolf: { 
    id: "wolf", 
    cardImage: "/cards/kinman-wolf.png", 
    primaryColor: "#8b5cf6",
    attribute: "DARK",
    attributeKanji: "闘",
    attributeEmoji: "🐺"
  },
};

// 相性マップ
const COMPATIBILITY_MAP: Record<string, { goodTypes: string[]; luckyColor: string; luckyNumber: string }> = {
  phoenix: { goodTypes: ["龍", "狼"], luckyColor: "オレンジ・ゴールド", luckyNumber: "3, 9" },
  kitsune: { goodTypes: ["鹿", "亀"], luckyColor: "イエロー・ホワイト", luckyNumber: "5, 7" },
  pegasus: { goodTypes: ["鳳凰", "狐"], luckyColor: "パープル・シルバー", luckyNumber: "1, 8" },
  elephant: { goodTypes: ["亀", "鹿"], luckyColor: "グレー・ブラウン", luckyNumber: "2, 6" },
  deer: { goodTypes: ["狐", "象"], luckyColor: "グリーン・ベージュ", luckyNumber: "4, 7" },
  dragon: { goodTypes: ["鳳凰", "鯱"], luckyColor: "レッド・ゴールド", luckyNumber: "8, 9" },
  turtle: { goodTypes: ["象", "鯱"], luckyColor: "ターコイズ・ネイビー", luckyNumber: "2, 4" },
  shark: { goodTypes: ["龍", "亀"], luckyColor: "ブルー・シルバー", luckyNumber: "1, 6" },
  wolf: { goodTypes: ["鳳凰", "ペガサス"], luckyColor: "パープル・ブラック", luckyNumber: "3, 5" },
};

// 四柱推命から導き出す形容詞マップ
const ELEMENT_ADJECTIVES: Record<string, string[]> = {
  wood: ["成長する", "発展する", "創造の", "躍動する"],
  fire: ["情熱の", "輝く", "燃える", "熱き"],
  earth: ["安定の", "堅実な", "大地の", "揺るぎない"],
  metal: ["鋭き", "高潔な", "精錬された", "輝ける"],
  water: ["流れる", "深淵の", "知恵の", "癒しの"],
};

// 九星から導き出す形容詞
const KYUSEI_ADJECTIVES: Record<string, string> = {
  "一白水星": "知恵深き",
  "二黒土星": "慈愛の",
  "三碧木星": "躍動する",
  "四緑木星": "調和の",
  "五黄土星": "帝王の",
  "六白金星": "高貴なる",
  "七赤金星": "華やかなる",
  "八白土星": "堅固なる",
  "九紫火星": "輝ける",
};

// ==================== タイトル形容詞生成 ====================

function generateTitleAdjective(fortuneData?: FortuneDataForCard): string {
  if (!fortuneData) return "覚醒せし";
  
  // 九星から形容詞を取得
  if (fortuneData.kyusei?.name) {
    const adj = KYUSEI_ADJECTIVES[fortuneData.kyusei.name];
    if (adj) return adj;
  }
  
  // 五行バランスから最も強い要素を取得
  if (fortuneData.bazi?.elementBalance) {
    const balance = fortuneData.bazi.elementBalance;
    const maxElement = Object.entries(balance).reduce((a, b) => 
      b[1] > a[1] ? b : a
    )[0];
    const adjectives = ELEMENT_ADJECTIVES[maxElement];
    if (adjectives) {
      return adjectives[Math.floor(Math.random() * adjectives.length)];
    }
  }
  
  return "覚醒せし";
}

// ==================== 画像読み込み ====================

function loadCardImageAsBase64(cardPath: string): string {
  const fullPath = path.join(process.cwd(), "public", cardPath);
  const imageBuffer = fs.readFileSync(fullPath);
  return imageBuffer.toString("base64");
}

// ==================== プロンプト生成 ====================

function buildCardPrompt(
  data: GenerateCardRequest,
  template: CardTemplate,
  titleAdjective: string
): string {
  const fortuneInfo = data.fortuneData;
  const kyuseiText = fortuneInfo?.kyusei?.name || "";
  const numerologyNum = fortuneInfo?.numerology?.lifePathNumber || 9;
  
  // 五行バランス（レーダーチャート用）
  const elementBalance = fortuneInfo?.bazi?.elementBalance || {
    wood: 2, fire: 3, earth: 2, metal: 1, water: 2
  };
  
  const compat = data.compatibility || COMPATIBILITY_MAP[data.dreamType] || {
    goodTypes: ["不明"],
    luckyColor: "不明",
    luckyNumber: "不明"
  };

  const strengthsList = (data.strengths || []).slice(0, 2);
  
  const message = data.personalizedMessage.length > 120 
    ? data.personalizedMessage.substring(0, 117) + "..." 
    : data.personalizedMessage;

  // 完全なタイトル: 「躍動する不死鳥タイプ」
  const fullTitle = `${titleAdjective}${data.displayName}タイプ`;

  return `
Edit this trading card image with PREMIUM, LUXURIOUS styling.

=== CRITICAL RULES ===
1. PRESERVE ALL 4 CORNERS of the card frame - DO NOT crop, remove, or white out any corners
2. Keep the original golden/metallic card border FULLY INTACT
3. The card must remain a complete rectangle with rounded corners
4. DO NOT add any white areas, masks, or cropping to edges
5. Keep the original character illustration COMPLETELY INTACT

=== CARD LAYOUT ===

【TOP HEADER】
┌─────────────────────────────────────────────┐
│ [${template.attributeKanji}]  ${fullTitle}    [PENTAGON]│
│  ↑                                    ↑      │
│  LEFT                              RIGHT     │
│  CIRCLE                            CHART     │
└─────────────────────────────────────────────┘

LEFT CIRCLE (attribute emblem):
- Place "${template.attributeKanji}" in the LEFT circular area
- Circle filled with ${template.primaryColor} background
- "${template.attributeKanji}" in WHITE, BOLD, centered
- Premium seal/stamp look

CENTER TITLE:
- "${fullTitle}" in elegant Japanese serif font (明朝体)
- Color: ${template.primaryColor} or dark brown

RIGHT SIDE - PENTAGON RADAR CHART (五行バランス):
- Draw a small PENTAGON/5-sided radar chart
- 5 axes labeled: 木(top), 火(top-right), 土(bottom-right), 金(bottom-left), 水(top-left)
- Values (1-5 scale):
  * 木(Wood): ${elementBalance.wood}
  * 火(Fire): ${elementBalance.fire}
  * 土(Earth): ${elementBalance.earth}
  * 金(Metal): ${elementBalance.metal}
  * 水(Water): ${elementBalance.water}
- Fill color: ${template.primaryColor} with 50% opacity
- Border: ${template.primaryColor} solid line
- Size: Small, fits in header corner (~60x60px)
- Clean, minimalist gaming stat chart style

【ILLUSTRATION AREA】
- DO NOT modify the character art
- Keep existing frame

【TYPE LINE】 (elegant font)
【${template.attribute}属性 ／ ${data.displayName}族】

【TEXT BOX】 (PREMIUM styling, 12pt, readable)

━━━━━━━━━━━━━━━━━━
■ ${data.userName}さんへ

▶ 特性：${data.personality || "情熱的な行動力"}

▶ 強み
　${strengthsList[0] || "不屈の精神"}
　${strengthsList[1] || "変化への適応力"}

▶ 相性：${compat.goodTypes.join("・")}
▶ 開運色：${compat.luckyColor}
▶ 本命星：${kyuseiText || "一白水星"}

━━━━━━━━━━━━━━━━━━
${message}
━━━━━━━━━━━━━━━━━━

【BOTTOM BAR】
Left: "DREAM ★★★★★"
Right: "LUCK-${numerologyNum}"

【FOOTER】
"© きんまん先生 × Dream Note" "DTD-${data.dreamType.toUpperCase().substring(0, 3)}001"

=== STYLING RULES ===

1. PREMIUM FONTS: Elegant Japanese serif for title, clean sans for body
2. LEFT CIRCLE: "${template.attributeKanji}" seal emblem
3. RIGHT: Pentagon radar chart showing 五行 balance
4. Color: ${template.primaryColor} accent, gold metallic touches
5. Text box: Cream/ivory background, high contrast
6. ALL text SHARP and READABLE
7. DO NOT modify character illustration
`;
}

// ==================== Gemini画像編集 ====================

// FAL AI用の型定義
interface FalImageFile {
  url: string;
  content_type?: string;
}

interface FalNanoBananaResult {
  data: {
    images: FalImageFile[];
  };
}

/**
 * Gemini APIで画像編集を試行
 */
async function tryGeminiImageEdit(
  cardBase64: string,
  editPrompt: string
): Promise<string | null> {
  console.log("🔷 Gemini API (NanoBanana Pro相当) で画像生成を試行...");
  
  try {
    // Gemini 2.0 Flash experimental (画像生成対応)
    const params = {
      model: "gemini-2.0-flash-exp-image-generation",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "image/png",
                data: cardBase64,
              },
            },
            { text: editPrompt },
          ],
        },
      ],
      // 画像生成を有効化
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (ai.models.generateContent as any)(params);

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const partData = part as any;
        if (partData.inlineData?.data) {
          console.log("✅ Gemini API で画像生成成功！");
          return partData.inlineData.data;
        }
      }
    }

    console.log("⚠️ Gemini API: 画像が返されませんでした");
    return null;
  } catch (error: unknown) {
    console.error("⚠️ Gemini API エラー:", error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * FAL AIで画像編集を試行（フォールバック）
 */
async function tryFalImageEdit(
  cardBase64: string,
  editPrompt: string
): Promise<string | null> {
  console.log("🔶 FAL AI (nano-banana) にフォールバック...");
  
  if (!process.env.FAL_KEY) {
    console.error("⚠️ FAL_KEY が設定されていません");
    return null;
  }

  try {
    const result = await fal.subscribe("fal-ai/nano-banana/edit", {
      input: {
        prompt: editPrompt,
        image_urls: [`data:image/png;base64,${cardBase64}`],
        num_images: 1,
        output_format: "png",
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS" && update.logs) {
          update.logs.map((log) => log.message).forEach((msg) => console.log("FAL:", msg));
        }
      },
    }) as FalNanoBananaResult;

    if (result.data?.images?.[0]?.url) {
      console.log("✅ FAL AI で画像生成成功！");
      // URLから画像をBase64に変換
      const imageResponse = await fetch(result.data.images[0].url);
      const imageBuffer = await imageResponse.arrayBuffer();
      return Buffer.from(imageBuffer).toString("base64");
    }

    console.log("⚠️ FAL AI: 画像が返されませんでした");
    return null;
  } catch (error: unknown) {
    console.error("⚠️ FAL AI エラー:", error instanceof Error ? error.message : error);
    return null;
  }
}

// ==================== Satori フォールバック ====================

// 画像サイズ
const CARD_WIDTH = 1024;
const CARD_HEIGHT = 1365;

async function loadFont(): Promise<ArrayBuffer> {
  const fontPaths = [
    path.join(process.cwd(), "public", "fonts", "A-OTF-ShinGoPro-Regular.otf"),
    path.join(process.cwd(), "public", "fonts", "NotoSansJP-Regular.ttf"),
  ];

  for (const fontPath of fontPaths) {
    try {
      const fontBuffer = fs.readFileSync(fontPath);
      return fontBuffer.buffer.slice(
        fontBuffer.byteOffset,
        fontBuffer.byteOffset + fontBuffer.byteLength
      );
    } catch {
      continue;
    }
  }

  throw new Error("No Japanese font available");
}

function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let currentLine = "";
  const paragraphs = text.split("\n");

  for (const paragraph of paragraphs) {
    for (const char of paragraph) {
      currentLine += char;
      if (currentLine.length >= maxChars) {
        lines.push(currentLine);
        currentLine = "";
      }
    }
    if (currentLine) {
      lines.push(currentLine);
      currentLine = "";
    }
  }

  return lines;
}

/**
 * Satori + Sharp でテキストをオーバーレイ（確実なフォールバック）
 */
async function generateCardWithSatori(
  cardPath: string,
  data: GenerateCardRequest,
  template: CardTemplate,
  titleAdjective: string
): Promise<string> {
  console.log("🔷 Satori + Sharp でカード生成（確実なフォールバック）...");

  try {
    const fontData = await loadFont();
    const fullTitle = `${titleAdjective}${data.displayName}タイプ`;
    const messageLines = wrapText(data.personalizedMessage, 35);

    // 簡易的な五行バランスの可視化テキスト
    const elementBalance = data.fortuneData?.bazi?.elementBalance || {
      wood: 2, fire: 3, earth: 2, metal: 1, water: 2
    };
    const elementText = `木${elementBalance.wood} 火${elementBalance.fire} 土${elementBalance.earth} 金${elementBalance.metal} 水${elementBalance.water}`;

    // 相性情報
    const compat = data.compatibility || COMPATIBILITY_MAP[data.dreamType] || {
      goodTypes: ["不明"], luckyColor: "不明", luckyNumber: "不明"
    };

    const element = React.createElement(
      "div",
      {
        style: {
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          display: "flex",
          position: "relative",
          fontFamily: "NotoSansJP",
        },
      },
      [
        // ヘッダー: 属性アイコン + タイトル + 五行
        React.createElement(
          "div",
          {
            key: "header",
            style: {
              position: "absolute",
              left: 28,
              top: 28,
              display: "flex",
              alignItems: "center",
              gap: 12,
            },
          },
          [
            // 属性アイコン
            React.createElement(
              "div",
              {
                key: "icon",
                style: {
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  backgroundColor: template.primaryColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                  fontWeight: "bold",
                  color: "white",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                },
              },
              template.attributeKanji
            ),
            // タイプ名
            React.createElement(
              "div",
              {
                key: "title",
                style: {
                  backgroundColor: "rgba(0,0,0,0.7)",
                  color: template.primaryColor,
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: 24,
                  fontWeight: "bold",
                  textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                },
              },
              fullTitle
            ),
          ]
        ),
        // 五行バランス（右上）
        React.createElement(
          "div",
          {
            key: "elements",
            style: {
              position: "absolute",
              right: 28,
              top: 28,
              backgroundColor: "rgba(0,0,0,0.7)",
              color: "#FFD700",
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: "bold",
            },
          },
          elementText
        ),
        // メッセージエリア
        React.createElement(
          "div",
          {
            key: "message",
            style: {
              position: "absolute",
              left: 50,
              top: 1060,
              width: 924,
              height: 260,
              padding: "16px 20px",
              backgroundColor: "rgba(255,255,245,0.95)",
              borderRadius: 12,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              border: `3px solid ${template.primaryColor}`,
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            },
          },
          [
            // ユーザー名
            React.createElement(
              "div",
              {
                key: "userName",
                style: {
                  fontSize: 20,
                  fontWeight: "bold",
                  color: template.primaryColor,
                  marginBottom: 6,
                },
              },
              `■ ${data.userName}さんへ`
            ),
            // 特性・強み
            React.createElement(
              "div",
              {
                key: "traits",
                style: {
                  fontSize: 14,
                  color: "#333",
                  marginBottom: 6,
                  lineHeight: 1.5,
                },
              },
              `▶ 特性：${data.personality || "情熱的な行動力"} | 相性：${compat.goodTypes.join("・")} | 開運色：${compat.luckyColor}`
            ),
            // メッセージ本文
            React.createElement(
              "div",
              {
                key: "messageText",
                style: {
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: "#333",
                  whiteSpace: "pre-wrap",
                },
              },
              messageLines.slice(0, 6).join("\n")
            ),
          ]
        ),
        // フッター
        React.createElement(
          "div",
          {
            key: "footer",
            style: {
              position: "absolute",
              left: 50,
              bottom: 20,
              right: 50,
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              color: "#666",
            },
          },
          [
            React.createElement("span", { key: "left" }, "© きんまん先生 × Dream Note"),
            React.createElement("span", { key: "right" }, `DTD-${data.dreamType.toUpperCase().substring(0, 3)}001`),
          ]
        ),
      ]
    );

    const svg = await satori(element, {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      fonts: [
        {
          name: "NotoSansJP",
          data: fontData,
          weight: 400,
          style: "normal",
        },
      ],
    });

    // ベースカードと合成
    const cardImagePath = path.join(process.cwd(), "public", cardPath);
    const baseCard = sharp(cardImagePath);
    const textOverlayPng = await sharp(Buffer.from(svg)).png().toBuffer();

    const result = await baseCard
      .composite([{ input: textOverlayPng, top: 0, left: 0 }])
      .png({ quality: 90 })
      .toBuffer();

    console.log("✅ Satori + Sharp でカード生成成功！");
    return result.toString("base64");
  } catch (error) {
    console.error("⚠️ Satori フォールバックエラー:", error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * カード画像を編集（Gemini優先 → FALフォールバック → Satoriフォールバック）
 */
async function editCardWithGemini(
  cardBase64: string,
  data: GenerateCardRequest,
  template: CardTemplate,
  titleAdjective: string
): Promise<string> {
  const editPrompt = buildCardPrompt(data, template, titleAdjective);

  // 1. Gemini API (Google) を優先的に試行
  const geminiResult = await tryGeminiImageEdit(cardBase64, editPrompt);
  if (geminiResult) {
    return geminiResult;
  }

  // 2. エラー時はFAL AIにフォールバック
  const falResult = await tryFalImageEdit(cardBase64, editPrompt);
  if (falResult) {
    return falResult;
  }

  // 3. 両方失敗した場合はSatori + Sharpで確実に生成
  console.log("⚠️ AI画像編集APIが失敗、Satori + Sharp にフォールバック...");
  try {
    return await generateCardWithSatori(template.cardImage, data, template, titleAdjective);
  } catch {
    // 最終手段: 元のカード画像を返す
    console.log("⚠️ 全ての方法が失敗、元のカード画像を使用します");
    return cardBase64;
  }
}

// ==================== API ハンドラー ====================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const {
      dreamType,
      typeName,
      displayName,
      icon,
      userName,
      element,
      keywords,
      personality,
      strengths,
      personalizedMessage,
      fortuneData,
      compatibility,
    } = body as GenerateCardRequest;

    if (!dreamType || !userName || !personalizedMessage) {
      return NextResponse.json(
        { error: "必須パラメータが不足しています" },
        { status: 400 }
      );
    }

    const template = CARD_TEMPLATES[dreamType];
    if (!template) {
      return NextResponse.json(
        { error: `不明なタイプ: ${dreamType}` },
        { status: 400 }
      );
    }

    // 四柱推命から形容詞を生成
    const titleAdjective = generateTitleAdjective(fortuneData);
    const fullTitle = `${titleAdjective}${displayName}タイプ`;
    
    console.log(`カード生成開始: ${fullTitle} for ${userName}`);

    const cardBase64 = loadCardImageAsBase64(template.cardImage);

    const editedImageBase64 = await editCardWithGemini(
      cardBase64,
      {
        dreamType,
        typeName: typeName || `${displayName}タイプ`,
        displayName: displayName || dreamType,
        icon: icon || "✨",
        userName,
        element: element || template.attribute,
        keywords: keywords || [],
        personality: personality || "",
        strengths: strengths || [],
        personalizedMessage,
        fortuneData,
        compatibility,
      },
      template,
      titleAdjective
    );

    const imageBuffer = Buffer.from(editedImageBase64, "base64");

    console.log(`カード生成完了: ${imageBuffer.length} bytes`);

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": imageBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("カード生成エラー:", error);
    return NextResponse.json(
      {
        error: "カード生成に失敗しました",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "ok",
    message: "Premium Card Generation API (Google Gemini優先 → FAL AIフォールバック)",
    primaryAPI: "Google Gemini 2.0 Flash (NanoBanana Pro相当)",
    fallbackAPI: "FAL AI nano-banana",
    supportedTypes: Object.keys(CARD_TEMPLATES),
  });
}
