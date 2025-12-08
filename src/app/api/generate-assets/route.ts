import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

// FAL AI設定
fal.config({
  credentials: process.env.FAL_KEY || "",
});

// 生成する素材の定義
const ASSET_PROMPTS = {
  // 1. スピリチュアルな星空背景
  starfield: {
    prompt: `Beautiful spiritual cosmic starfield background, deep purple and pink nebula, golden stardust particles, ethereal glowing stars, mystical aurora lights, seamless tileable texture, dark space background with vibrant colors, magical dreamy atmosphere, high quality, 4k resolution`,
    negative_prompt: `text, watermark, logo, blurry, low quality, people, faces, characters`,
    size: "landscape_16_9",
  },
  
  // 2. 光のオーブパーティクル
  light_orb: {
    prompt: `Single magical glowing light orb, soft pink and purple gradient, ethereal glow effect, transparent background, spiritual energy ball, mystical aura, bokeh light effect, isolated on black background, high quality render`,
    negative_prompt: `text, watermark, multiple objects, busy background, people`,
    size: "square",
  },
  
  // 3. 神秘的なオーロラ波動
  aurora_wave: {
    prompt: `Ethereal aurora borealis wave, flowing spiritual energy, pink purple and gold colors, mystical light ribbons, transparent overlay texture, magical flowing lights, dreamy atmosphere, seamless horizontal pattern, black background`,
    negative_prompt: `text, watermark, logo, landscape, mountains, people`,
    size: "landscape_16_9",
  },
  
  // 4. スターダストパーティクル
  stardust: {
    prompt: `Golden and pink stardust particles, magical sparkles, glittering light dots, transparent background, scattered star particles, fairy dust effect, bokeh lights, isolated sparkle elements on black background`,
    negative_prompt: `text, watermark, people, objects, busy composition`,
    size: "square",
  },
  
  // 5. 神聖幾何学模様
  sacred_geometry: {
    prompt: `Sacred geometry pattern, golden ratio spiral, mystical mandala, glowing purple and gold lines, spiritual symbol, ethereal light traces, transparent background, subtle geometric pattern, meditation visual`,
    negative_prompt: `text, watermark, people, realistic, photo`,
    size: "square",
  },
  
  // 6. 引き寄せの光
  manifestation_light: {
    prompt: `Manifestation energy beam, vertical light pillar, pink and purple gradient, spiritual ascending light, magical golden sparkles, ethereal glow, dreamy atmosphere, isolated on dark background, high quality`,
    negative_prompt: `text, watermark, people, objects, busy`,
    size: "portrait_4_3",
  },
};

type AssetType = keyof typeof ASSET_PROMPTS;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assetType } = body as { assetType: AssetType };

    if (!assetType || !ASSET_PROMPTS[assetType]) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid asset type",
          availableTypes: Object.keys(ASSET_PROMPTS),
        },
        { status: 400 }
      );
    }

    const config = ASSET_PROMPTS[assetType];

    // NanoBanana Pro で画像生成
    const result = await fal.subscribe("fal-ai/nanobanana-pro", {
      input: {
        prompt: config.prompt,
        negative_prompt: config.negative_prompt,
        image_size: config.size,
        num_inference_steps: 30,
        guidance_scale: 7.5,
        num_images: 1,
        enable_safety_checker: true,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log(`生成中: ${assetType}`);
        }
      },
    });

    // 結果を返す
    return NextResponse.json({
      success: true,
      assetType,
      images: result.data?.images || [],
      prompt: config.prompt,
    });
  } catch (error) {
    console.error("素材生成エラー:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "生成に失敗しました",
      },
      { status: 500 }
    );
  }
}

// 利用可能な素材タイプを取得
export async function GET() {
  return NextResponse.json({
    availableAssets: Object.keys(ASSET_PROMPTS),
    prompts: ASSET_PROMPTS,
  });
}















