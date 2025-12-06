/**
 * きんまん先生の厳密な一貫性を保ったアニメーション生成
 * Flux Kontext + 詳細なプロンプトで元画像の特徴を完全維持
 */

import { fal } from "@fal-ai/client";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FAL_KEY = process.env.FAL_KEY;

if (!FAL_KEY) {
  console.error("⚠️ FAL_KEY が設定されていません。");
  process.exit(1);
}
console.log("✅ FAL_KEY 設定完了");

const outputDir = path.join(__dirname, "../public/animations");
await fs.mkdir(outputDir, { recursive: true });

// 元のきんまん画像をBase64エンコード
const kinmanImagePath = path.join(__dirname, "../public/kinman-assets/kinman-crystal-ball.png");
const kinmanImageBuffer = await fs.readFile(kinmanImagePath);
const kinmanBase64 = kinmanImageBuffer.toString('base64');
const kinmanDataUrl = `data:image/png;base64,${kinmanBase64}`;

console.log("🔮 厳密な一貫性プロンプトでフレーム生成開始...\n");

// きんまん先生の特徴を厳密に定義（変更禁止箇所）
const CHARACTER_LOCK = `
STRICT RULES - DO NOT CHANGE ANY OF THESE:
- Character: Same cute chibi anime boy
- Hair: Exact same golden blonde messy hair style and color
- Eyes: Same big round brown eyes with highlights
- Face: Same rosy cheeks and gentle smile
- Outfit: EXACT same white kimono with pastel cloud patterns (pink, blue, purple clouds)
- Obi belt: Same sage green color
- Pose: Same sitting cross-legged position
- Hands: Same position holding the crystal ball
- Art style: Same clean anime chibi style
- Background: Keep transparent/white
`.trim();

// 各フレームのプロンプト（水晶玉の光のみ変更）
const framePrompts = [
  {
    prompt: `${CHARACTER_LOCK}

ONLY CHANGE THIS:
- Make the crystal ball emit a soft cyan-blue magical glow
- Add subtle sparkles around the crystal ball only
- Crystal ball interior: gentle swirling blue light

Keep everything else EXACTLY the same as the original image.`,
    description: "青い光"
  },
  {
    prompt: `${CHARACTER_LOCK}

ONLY CHANGE THIS:
- Make the crystal ball emit bright purple-violet magical energy
- Add purple sparkles and small stars floating upward from the ball
- Crystal ball interior: swirling purple and pink energy
- Add a subtle purple aura around the ball only

Keep everything else EXACTLY the same as the original image.`,
    description: "紫の魔法"
  },
  {
    prompt: `${CHARACTER_LOCK}

ONLY CHANGE THIS:
- Make the crystal ball radiate brilliant golden-yellow rainbow light
- Add golden sparkles, stars, and rainbow arc around the ball
- Crystal ball interior: vibrant swirling rainbow colors with golden glow
- Add warm golden light rays emanating from the ball

Keep everything else EXACTLY the same as the original image.`,
    description: "金色の虹"
  },
];

const frames = [];
const FIXED_SEED = 42; // 一貫性のため完全固定

for (let i = 0; i < framePrompts.length; i++) {
  const frame = framePrompts[i];
  console.log(`📸 フレーム ${i + 1}/${framePrompts.length} (${frame.description}) 生成中...`);
  
  try {
    const result = await fal.subscribe("fal-ai/flux-pro/kontext", {
      input: {
        prompt: frame.prompt,
        image_url: kinmanDataUrl,
        output_format: "png",
        seed: FIXED_SEED,
        guidance_scale: 2.5, // 低めに設定して元画像をより尊重
        aspect_ratio: "1:1",
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS" && update.logs) {
          update.logs.map((log) => log.message).forEach((msg) => console.log("   ", msg));
        }
      },
    });

    const imageUrl = result.data?.images?.[0]?.url || result.images?.[0]?.url;
    
    if (imageUrl) {
      console.log("   ✅ 生成成功！");
      
      // 背景除去
      console.log("   🔧 背景除去中...");
      const rembgResult = await fal.subscribe("fal-ai/imageutils/rembg", {
        input: { image_url: imageUrl },
      });
      
      const transparentUrl = rembgResult.data?.image?.url || rembgResult.image?.url || imageUrl;
      
      const response = await fetch(transparentUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      const filepath = path.join(outputDir, `kinman-fortune-frame-${i + 1}.png`);
      await fs.writeFile(filepath, buffer);
      frames.push(filepath);
      
      console.log(`   💾 保存: kinman-fortune-frame-${i + 1}.png\n`);
    } else {
      console.log("   ⚠️ 画像URLが見つかりません");
    }
  } catch (error) {
    console.error(`   ❌ エラー: ${error.message}`);
  }
}

if (frames.length === 3) {
  console.log("🎉 全フレーム生成完了！");
  
  // WebPアニメーション作成
  console.log("\n📦 WebPアニメーション作成中...");
  const { execSync } = await import('child_process');
  try {
    execSync(
      `cd "${outputDir}" && ffmpeg -y -framerate 1 -i kinman-fortune-frame-%d.png -c:v libwebp -lossless 1 -loop 0 -preset default -an kinman-fortune.webp`,
      { stdio: 'inherit' }
    );
    console.log("✅ WebPアニメーション作成完了！");
    console.log("📁 出力: public/animations/kinman-fortune.webp");
  } catch (ffmpegError) {
    console.log("⚠️ ffmpegコマンド実行エラー。手動で実行してください:");
    console.log("   ffmpeg -y -framerate 1 -i kinman-fortune-frame-%d.png -c:v libwebp -lossless 1 -loop 0 kinman-fortune.webp");
  }
} else {
  console.log(`❌ 生成失敗: ${frames.length}/3 フレームのみ生成`);
}

