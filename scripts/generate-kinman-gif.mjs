/**
 * きんまん先生のGIFアニメーション生成スクリプト
 * FAL AI (AnimateDiff) を使用して本格的なGIFアニメーションを生成
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
  console.error("⚠️ FAL_KEY が設定されていません。`.env.local` ファイルを確認してください。");
  process.exit(1);
} else {
  console.log("✅ FAL_KEY 設定完了");
}

// FAL_KEY は環境変数から自動で読み込まれる

const outputDir = path.join(__dirname, "../public/animations");
await fs.mkdir(outputDir, { recursive: true });

console.log("🔮 きんまん先生のGIFアニメーション生成を開始...\n");

// Step 1: NanoBanana Pro で高品質な静止画を生成
async function generateBaseImage() {
  console.log("📸 Step 1: NanoBanana Pro で金髪きんまん先生の静止画を生成...");
  
  const kinmanPrompt = `
    Cute chibi anime fortune teller boy, BLONDE GOLDEN YELLOW hair, big round brown eyes,
    wearing traditional Japanese white kimono with pastel cloud patterns,
    green obi belt, sitting cross-legged, holding a glowing crystal ball with rainbow swirls,
    mystical purple aura, sparkles and stars around, magical atmosphere,
    transparent background, high quality, detailed, studio ghibli style
  `.trim().replace(/\s+/g, ' ');

  const result = await fal.subscribe("fal-ai/nano-banana-pro", {
    input: {
      prompt: kinmanPrompt,
      num_images: 1,
      output_format: "png",
      aspect_ratio: "1:1",
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS" && update.logs) {
        update.logs.map((log) => log.message).forEach((msg) => console.log("  ", msg));
      }
    },
  });

  if (result.images?.[0]?.url) {
    console.log("✅ 静止画生成完了！");
    return result.images[0].url;
  }
  throw new Error("静止画生成に失敗しました");
}

// Step 2: AnimateDiff で GIF/動画に変換
async function animateImage(imageUrl) {
  console.log("\n🎬 Step 2: AnimateDiff で動画生成...");
  console.log("   ※ 1〜2分かかる場合があります\n");

  const animationPrompt = `
    Cute chibi anime fortune teller boy with BLONDE GOLDEN hair, 
    crystal ball glowing and pulsing with magical rainbow light,
    sparkles floating upward, mystical purple energy swirling,
    gentle breathing animation, magical particles emanating,
    high quality animation, smooth motion, looping animation
  `.trim().replace(/\s+/g, ' ');

  const result = await fal.subscribe("fal-ai/fast-animatediff/video-to-video", {
    input: {
      video_url: imageUrl,
      prompt: animationPrompt,
      negative_prompt: "(bad quality, worst quality:1.2), blurry, distorted, deformed, brown hair, black hair",
      num_inference_steps: 20,
      strength: 0.5, // 元画像を50%維持
      guidance_scale: 7.5,
      fps: 8,
      first_n_seconds: 2,
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS" && update.logs) {
        update.logs.map((log) => log.message).forEach((msg) => console.log("  AnimateDiff:", msg));
      }
    },
  });

  if (result.video?.url) {
    console.log("✅ 動画生成完了！");
    return result.video.url;
  }
  throw new Error("動画生成に失敗しました");
}

// Step 3: 画像/動画を保存
async function downloadAndSave(url, filename) {
  console.log(`\n💾 保存中: ${filename}`);
  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  const filepath = path.join(outputDir, filename);
  await fs.writeFile(filepath, buffer);
  console.log(`   ✅ 保存完了: ${filepath}`);
  return filepath;
}

// 代替: 静止画フレームからシンプルなGIF生成（AnimateDiffが失敗した場合）
async function generateFramesForGif() {
  console.log("\n🖼️ 代替: 複数フレームを生成してGIF素材を作成...");
  
  const frames = [];
  // 背景を濃い紫〜インディゴで強制
  const basePrompt = `
    ((dark purple galaxy background)), ((deep indigo cosmic backdrop)), mystical starry night,
    Cute chibi anime fortune teller boy, BRIGHT GOLDEN BLONDE hair, big round brown eyes,
    wearing white kimono with cloud patterns, green obi belt, sitting cross-legged, 
    holding a glowing crystal ball, sparkles and stars,
    high quality, anime style, NO WHITE BACKGROUND
  `.trim().replace(/\s+/g, ' ');

  const framePrompts = [
    `${basePrompt}. Crystal ball with soft BLUE glow. ((dark purple space background))`,
    `${basePrompt}. Crystal ball with PURPLE magical swirls. ((deep indigo galaxy background))`,
    `${basePrompt}. Crystal ball with GOLDEN rainbow light. ((dark cosmic purple background with nebula))`,
  ];

  for (let i = 0; i < framePrompts.length; i++) {
    console.log(`\n   フレーム ${i + 1}/${framePrompts.length} 生成中...`);
    
    const result = await fal.subscribe("fal-ai/nano-banana-pro", {
      input: {
        prompt: framePrompts[i],
        num_images: 1,
        output_format: "png",
        aspect_ratio: "1:1",
        seed: 12345 + i, // 一貫性のため近いseed使用
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS" && update.logs) {
          update.logs.map((log) => log.message).forEach((msg) => console.log("    ", msg));
        }
      },
    });

    console.log("   NanoBanana 結果:", JSON.stringify(result, null, 2).substring(0, 500));
    
    // FAL AIのレスポンス形式を確認（result.data?.images または result.images）
    const imageUrl = result.data?.images?.[0]?.url || result.images?.[0]?.url;
    
    if (imageUrl) {
      // 背景を除去して透過PNG化
      const transparentUrl = await removeBackground(imageUrl);
      frames.push(transparentUrl);
      await downloadAndSave(transparentUrl, `kinman-fortune-frame-${i + 1}.png`);
    } else {
      console.log("   ⚠️ 画像URLが見つかりません");
    }
  }

  return frames;
}

// Step 3: 背景を除去（透過PNG化）
async function removeBackground(imageUrl) {
  console.log("   🔧 背景除去中...");
  
  try {
    const result = await fal.subscribe("fal-ai/imageutils/rembg", {
      input: {
        image_url: imageUrl,
      },
      logs: true,
    });

    // FAL AIのレスポンス形式: result.data.image.url または result.image.url
    const transparentUrl = result.data?.image?.url || result.image?.url;
    
    if (transparentUrl) {
      console.log("   ✅ 背景除去成功！");
      return transparentUrl;
    }
    console.log("   ⚠️ 背景除去結果にimage.urlがありません");
    console.log("   結果:", JSON.stringify(result, null, 2).substring(0, 300));
    return imageUrl;
  } catch (error) {
    console.error("   ❌ 背景除去エラー:", error.message);
    return imageUrl; // 失敗時は元画像を返す
  }
}

// メイン処理
async function main() {
  try {
    // まずAnimateDiffでの動画生成を試行
    console.log("=".repeat(50));
    console.log("🌟 方法1: AnimateDiff で動画生成");
    console.log("=".repeat(50));
    
    try {
      const baseImageUrl = await generateBaseImage();
      await downloadAndSave(baseImageUrl, "kinman-fortune-base.png");
      
      const videoUrl = await animateImage(baseImageUrl);
      await downloadAndSave(videoUrl, "kinman-fortune-animation.mp4");
      
      console.log("\n🎉 AnimateDiff 動画生成完了！");
      console.log("📁 出力ファイル: public/animations/kinman-fortune-animation.mp4");
      
    } catch (animateError) {
      console.error("\n⚠️ AnimateDiff失敗:", animateError.message);
      console.log("\n=".repeat(50));
      console.log("🌟 方法2: フレーム画像生成（GIF素材）");
      console.log("=".repeat(50));
      
      const frames = await generateFramesForGif();
      
      if (frames.length > 0) {
        console.log("\n🎉 フレーム生成完了！");
        console.log("📁 出力ファイル:");
        frames.forEach((_, i) => {
          console.log(`   - public/animations/kinman-fortune-frame-${i + 1}.png`);
        });
        console.log("\n💡 これらのフレームをCSSアニメーションで切り替えるか、");
        console.log("   ffmpeg等でGIF化してください:");
        console.log("   ffmpeg -framerate 1 -i kinman-fortune-frame-%d.png -loop 0 kinman-fortune.gif");
      }
    }
    
    console.log("\n✨ 処理完了！");
    
  } catch (error) {
    console.error("💥 エラー:", error);
    process.exit(1);
  }
}

main();

