/**
 * カード画像生成API - Google Gemini API優先 + FAL AI NanoBanana Proフォールバック
 * 
 * 正しいモデル名（公式ドキュメント確認済み）:
 * - Gemini API: gemini-3-pro-image-preview (= NanoBanana Pro相当)
 * - FAL AI: fal-ai/nano-banana-pro/edit (= Gemini 3 Pro Image)
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { fal } from "@fal-ai/client";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

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

// Supabaseクライアント（ログ記録用）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

// ログ記録ヘルパー（adminSupabaseを優先使用）
async function logGeneration(
  userName: string,
  dreamType: string,
  success: boolean,
  errorMessage?: string,
  apiUsed?: "gemini" | "fal",
  cardImageUrl?: string,
  cardImageBase64?: string
) {
  // adminSupabase（service role）を優先、なければ通常のsupabaseを使用
  const client = adminSupabase || supabase;
  if (!client) {
    console.error("❌ logGeneration: Supabaseクライアントが未初期化");
    return;
  }

  try {
    const payload: Record<string, unknown> = {
      user_name: userName,
      dream_type: dreamType,
      success,
      error_message: errorMessage || null,
      api_used: apiUsed || null,
    };
    if (cardImageUrl) {
      payload.card_image_url = cardImageUrl;
    }
    if (cardImageBase64) {
      payload.card_image_base64 = cardImageBase64;
      console.log(`📦 Base64データサイズ: ${cardImageBase64.length} 文字`);
    }

    console.log(`📝 generation_logs にInsert開始: userName=${userName}, hasUrl=${!!cardImageUrl}, hasBase64=${!!cardImageBase64}`);

    const { data, error } = await client.from("generation_logs").insert(payload).select();

    if (error) {
      console.error("❌ generation_logs Insert エラー:", error.message);
      console.error("❌ エラー詳細:", JSON.stringify(error));
    } else {
      console.log("✅ generation_logs Insert 成功:", data);
    }
  } catch (error) {
    console.error("❌ Log recording error:", error);
  }
}

// カード画像をSupabase Storageにアップロードし、公開URLを返す
// 優先: service role (adminSupabase)。失敗・未設定時は anon クライアントでフォールバック試行。
async function uploadCardImage(imageBuffer: Buffer, userName: string, dreamType: string): Promise<string | null> {
  const fileName = `${Date.now()}-${encodeURIComponent(userName)}-${dreamType}.png`;

  // 1) Service role でアップロード（推奨）
  if (adminSupabase) {
    try {
      // バケット存在確認
      const { data: buckets } = await adminSupabase.storage.listBuckets();
      const cardsExists = buckets?.some((b) => b.name === "cards");

      if (!cardsExists) {
        console.log("📦 cardsバケットを作成中...(service role)");
        const { error: bucketError } = await adminSupabase.storage.createBucket("cards", {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
        });
        if (bucketError) {
          console.error("❌ バケット作成エラー (service role):", bucketError.message);
        } else {
          console.log("✅ cardsバケット作成成功 (service role)");
        }
      }

      console.log(`📤 画像アップロード開始 (service role): ${fileName} (${imageBuffer.length} bytes)`);

      const { data: uploadData, error: uploadError } = await adminSupabase.storage
        .from("cards")
        .upload(fileName, imageBuffer, {
          contentType: "image/png",
          upsert: true, // 同名ファイルは上書き
        });

      if (!uploadError) {
        console.log("✅ アップロード成功 (service role):", uploadData?.path);
        const { data: publicUrlData } = adminSupabase.storage.from("cards").getPublicUrl(fileName);
        const publicUrl = publicUrlData?.publicUrl || null;
        console.log("🔗 公開URL:", publicUrl);
        if (publicUrl) return publicUrl;
      } else {
        console.error("❌ Storage upload error (service role):", uploadError.message);
      }
    } catch (error) {
      console.error("❌ Storage upload failed (service role):", error);
    }
  } else {
    console.error("❌ adminSupabase未初期化（SUPABASE_SERVICE_ROLE_KEY 未設定の可能性）");
  }

  // 2) フォールバック: anon クライアントでアップロード（バケットが既に存在する前提）
  if (supabase) {
    try {
      console.warn("⚠️ service role unavailable. Trying anon upload fallback...");
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("cards")
        .upload(fileName, imageBuffer, {
          contentType: "image/png",
          upsert: true,
        });
      if (!uploadError) {
        console.log("✅ アップロード成功 (anon fallback):", uploadData?.path);
        const { data: publicUrlData } = supabase.storage.from("cards").getPublicUrl(fileName);
        const publicUrl = publicUrlData?.publicUrl || null;
        console.log("🔗 公開URL (anon fallback):", publicUrl);
        return publicUrl;
      } else {
        console.error("❌ Storage upload error (anon fallback):", uploadError.message);
      }
    } catch (error) {
      console.error("❌ Storage upload failed (anon fallback):", error);
    }
  } else {
    console.error("❌ supabase anon client 未初期化（NEXT_PUBLIC_SUPABASE_URL / ANON_KEY 未設定の可能性）");
  }

  return null;
}

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
Edit this trading card image with PREMIUM, LUXURIOUS styling (高級感・箔押し感・光沢を強調) and keep the original illustration EXACTLY as-is.
OUTPUT: PORTRAIT ORIENTATION (9:16 aspect ratio) - optimized for smartphone wallpaper. DO NOT DOWNSCALE; keep sharpness and high resolution. DO NOT RESIZE CANVAS.

=== CRITICAL RULES ===
1. PRESERVE ALL 4 CORNERS of the card frame - DO NOT crop, remove, or white out any corners
2. Keep the original golden/metallic card border FULLY INTACT
3. The card must remain a complete rectangle with rounded corners (PORTRAIT/VERTICAL layout)
4. DO NOT add any white areas, masks, or cropping to edges
5. Keep the original character illustration COMPLETELY INTACT
6. The final image MUST be in PORTRAIT orientation (taller than wide) for iPhone wallpaper use
7. DO NOT change the main illustration’s pose, proportions, or colors. Preserve lighting and composition; only enhance clarity and metallic sheen.
8. Make all text, icons, and charts ULTRA SHARP and PRINT-READY (no blur, no watercolor/pastel wash).
9. DO NOT move, crop, or resize the top header bar or its margin; keep the exact padding so the top edge never cuts the header.
10. DO NOT move the pentagon radar chart from the top-right header; keep it inside the header box with the same size and spacing.
11. DO NOT alter gold border thickness or corner radius; keep frame thickness identical.

=== CARD LAYOUT ===

【TOP HEADER】(位置と余白を絶対に変えない)
┌─────────────────────────────────────────────┐
│ [${template.attributeKanji}]  ${fullTitle}    [PENTAGON]│  ← 左の属性丸・中央タイトル・右のレーダーチャートをこの行に収める
│  ↑                                    ↑      │
│  LEFT                              RIGHT     │
│  CIRCLE                            CHART     │
└─────────────────────────────────────────────┘

LEFT CIRCLE (attribute emblem) – 位置とサイズ固定:
- Place "${template.attributeKanji}" in the LEFT circular area
- Circle filled with ${template.primaryColor} background
- "${template.attributeKanji}" in WHITE, BOLD, centered
- Premium seal/stamp look

CENTER TITLE – 位置固定:
- "${fullTitle}" in elegant Japanese serif font (明朝体)
- Color: ${template.primaryColor} or dark brown

RIGHT SIDE - PENTAGON RADAR CHART (五行バランス) – 位置固定:
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
 * Gemini API (gemini-3-pro-image-preview) で画像編集を試行
 * 公式ドキュメント: https://ai.google.dev/gemini-api/docs/models
 */
async function tryGeminiImageEdit(
  cardBase64: string,
  editPrompt: string
): Promise<string | null> {
  console.log("🔷 Gemini API (gemini-3-pro-image-preview) で画像生成を試行...");
  
  if (!GEMINI_API_KEY) {
    console.error("⚠️ GEMINI_API_KEY が設定されていません");
    return null;
  }

  try {
    // Gemini 3 Pro Image Preview（= NanoBanana Pro相当）
    const params = {
      model: "gemini-3-pro-image-preview",
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
      // 画像生成を有効化（iPhone壁紙用に9:16縦長、2K解像度）
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
        imageConfig: {
          aspectRatio: "9:16",
          imageSize: "2K",
        },
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (ai.models.generateContent as any)(params);

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const partData = part as any;
        if (partData.inlineData?.data) {
          console.log("✅ Gemini API (gemini-3-pro-image-preview) で画像生成成功！");
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
 * FAL AI (fal-ai/nano-banana-pro/edit) で画像編集を試行（フォールバック）
 * 公式ドキュメント: https://fal.ai/models/fal-ai/nano-banana-pro/edit/api
 */
async function tryFalImageEdit(
  cardBase64: string,
  editPrompt: string
): Promise<string | null> {
  console.log("🔶 FAL AI (fal-ai/nano-banana-pro/edit) にフォールバック...");
  
  if (!process.env.FAL_KEY) {
    console.error("⚠️ FAL_KEY が設定されていません");
    return null;
  }

  try {
    // NanoBanana Pro (= Gemini 3 Pro Image) - iPhone壁紙用に2K解像度
    const result = await fal.subscribe("fal-ai/nano-banana-pro/edit", {
      input: {
        prompt: editPrompt,
        image_urls: [`data:image/png;base64,${cardBase64}`],
        num_images: 1,
        output_format: "png",
        resolution: "2K",
        aspect_ratio: "9:16",
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS" && update.logs) {
          update.logs.map((log) => log.message).forEach((msg) => console.log("FAL:", msg));
        }
      },
    }) as FalNanoBananaResult;

    if (result.data?.images?.[0]?.url) {
      console.log("✅ FAL AI (nano-banana-pro) で画像生成成功！");
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

/**
 * カード画像を編集（Gemini優先 → FAL AIフォールバック → エラー）
 */
async function editCardWithGemini(
  cardBase64: string,
  data: GenerateCardRequest,
  template: CardTemplate,
  titleAdjective: string
): Promise<string> {
  const editPrompt = buildCardPrompt(data, template, titleAdjective);

  // 1. Gemini API (gemini-3-pro-image-preview) を優先的に試行
  const geminiResult = await tryGeminiImageEdit(cardBase64, editPrompt);
  if (geminiResult) {
    return geminiResult;
  }

  // 2. エラー時はFAL AI (nano-banana-pro/edit) にフォールバック
  const falResult = await tryFalImageEdit(cardBase64, editPrompt);
  if (falResult) {
    return falResult;
  }

  // 3. 両方失敗した場合はエラーをスロー
  throw new Error("画像生成に失敗しました。Gemini APIとFAL AIの両方がエラーを返しました。");
}

// ==================== API ハンドラー ====================

export async function POST(request: NextRequest): Promise<NextResponse> {
  let userName = "unknown";
  let dreamType = "unknown";
  
  try {
    const body = await request.json();
    const {
      dreamType: dt,
      typeName,
      displayName,
      icon,
      userName: un,
      element,
      keywords,
      personality,
      strengths,
      personalizedMessage,
      fortuneData,
      compatibility,
    } = body as GenerateCardRequest;

    userName = un || "unknown";
    dreamType = dt || "unknown";

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

    console.log(`✅ カード生成完了: ${imageBuffer.length} bytes for ${userName}`);

    // 生成画像をストレージに保存して公開URLを取得
    let cardImageUrl: string | null = null;
    try {
      console.log("📦 画像のストレージ保存を開始...");
      cardImageUrl = await uploadCardImage(imageBuffer, userName, dreamType);
      if (cardImageUrl) {
        console.log(`✅ 画像保存成功: ${cardImageUrl}`);
      } else {
        console.warn("⚠️ 画像保存がnullを返しました（バケット未作成の可能性）");
      }
    } catch (e) {
      console.error('❌ カード画像の保存に失敗:', e);
    }

    // Base64データも保存（URLが取得できない場合のフォールバック）
    const cardImageBase64 = `data:image/png;base64,${editedImageBase64}`;

    // 診断レコードにも保存（あれば）
    const dbClient = adminSupabase || supabase;
    if (dbClient) {
      try {
        const updateData: { card_image_url?: string; card_image_base64?: string } = {};
        if (cardImageUrl) updateData.card_image_url = cardImageUrl;
        updateData.card_image_base64 = cardImageBase64;

        console.log(`📝 diagnosis_records 更新開始: userName=${userName}, hasUrl=${!!cardImageUrl}, hasBase64=${!!cardImageBase64}`);

        const { data: updateResult, error: updateError } = await dbClient
          .from('diagnosis_records')
          .update(updateData)
          .eq('user_name', userName)
          .select();

        if (updateError) {
          console.error('❌ diagnosis_records 更新エラー:', updateError.message);
          console.error('❌ エラー詳細:', JSON.stringify(updateError));
        } else {
          console.log(`✅ diagnosis_records 更新成功:`, updateResult);
        }
      } catch (e) {
        console.error('❌ diagnosis_records 更新に失敗:', e);
      }
    } else {
      console.error('❌ diagnosis_records 更新スキップ: Supabaseクライアントなし');
    }

    // 成功ログ記録（Base64も含む）
    console.log(`📝 生成ログ記録: userName=${userName}, dreamType=${dreamType}, cardImageUrl=${cardImageUrl || 'null'}`);
    await logGeneration(userName, dreamType, true, undefined, 'gemini', cardImageUrl || undefined, cardImageBase64);

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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // エラーログ記録
    await logGeneration(userName, dreamType, false, errorMessage);

    return NextResponse.json(
      {
        error: "カード生成に失敗しました",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "ok",
    message: "Premium Card Generation API (Google Gemini優先 → FAL AI NanoBanana Proフォールバック)",
    primaryAPI: "Google Gemini 3 Pro Image Preview (gemini-3-pro-image-preview)",
    fallbackAPI: "FAL AI NanoBanana Pro (fal-ai/nano-banana-pro/edit)",
    supportedTypes: Object.keys(CARD_TEMPLATES),
  });
}
