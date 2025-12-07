/**
 * きんまん先生の高品質動画生成
 * FAL AI の Kling Video v2 を使用して滑らかな動画を生成
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
console.log("✅ FAL_KEY 設定完了\n");

const outputDir = path.join(__dirname, "../public/animations");
await fs.mkdir(outputDir, { recursive: true });

// 元のきんまん画像をBase64エンコード
const kinmanImagePath = path.join(__dirname, "../public/kinman-assets/kinman-crystal-ball.png");
const kinmanImageBuffer = await fs.readFile(kinmanImagePath);
const kinmanBase64 = kinmanImageBuffer.toString('base64');
const kinmanDataUrl = `data:image/png;base64,${kinmanBase64}`;

console.log("🎬 きんまん先生の動画生成を開始...\n");

// 動画生成のプロンプト
const videoPrompt = `
A cute chibi anime fortune teller boy with golden blonde hair is sitting cross-legged on a purple cushion, holding a glowing crystal ball.
The crystal ball pulses with magical blue and purple energy, emitting sparkles and mystical light.
The boy looks into the crystal ball with a gentle, focused expression.
Soft magical particles float around him.
The background is a mystical purple gradient with subtle stars.
Smooth, gentle animation. High quality anime style.
`.trim();

async function generateVideo() {
  console.log("📸 Step 1: Kling Video v2 で動画生成中...");
  console.log("   ※ 2-5分かかる場合があります\n");

  try {
    const result = await fal.subscribe("fal-ai/kling-video/v2/master/image-to-video", {
      input: {
        prompt: videoPrompt,
        image_url: kinmanDataUrl,
        duration: "5", // 5秒
        aspect_ratio: "1:1",
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log(`   ⏳ 処理中... ${update.logs?.slice(-1)[0]?.message || ''}`);
        } else if (update.status === "IN_QUEUE") {
          console.log(`   📋 キューで待機中... position: ${update.queue_position || 'unknown'}`);
        }
      },
    });

    console.log("\n📦 結果:", JSON.stringify(result.data || result, null, 2));

    const videoUrl = result.data?.video?.url || result.video?.url;
    if (videoUrl) {
      console.log("\n✅ 動画生成成功！");
      console.log("🎥 URL:", videoUrl);
      
      // 動画をダウンロード
      const response = await fetch(videoUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      const outputPath = path.join(outputDir, "kinman-fortune.mp4");
      await fs.writeFile(outputPath, buffer);
      console.log(`💾 保存完了: ${outputPath}`);
      
      // WebM版も作成（透過サポートのため）
      console.log("\n💡 WebM変換コマンド:");
      console.log("   ffmpeg -i kinman-fortune.mp4 -c:v libvpx-vp9 -b:v 2M kinman-fortune.webm");
      
      return outputPath;
    }
  } catch (error) {
    console.error("❌ Kling Video v2 エラー:", error.message);
    console.log("\n🔄 代替モデル（MiniMax）を試行中...");
  }

  // フォールバック: MiniMax Video
  try {
    const result = await fal.subscribe("fal-ai/minimax-video/image-to-video", {
      input: {
        prompt: videoPrompt,
        image_url: kinmanDataUrl,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log(`   ⏳ 処理中...`);
        }
      },
    });

    const videoUrl = result.data?.video?.url || result.video?.url;
    if (videoUrl) {
      console.log("\n✅ MiniMax動画生成成功！");
      
      const response = await fetch(videoUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      const outputPath = path.join(outputDir, "kinman-fortune.mp4");
      await fs.writeFile(outputPath, buffer);
      console.log(`💾 保存完了: ${outputPath}`);
      
      return outputPath;
    }
  } catch (error) {
    console.error("❌ MiniMax Video エラー:", error.message);
  }

  // フォールバック: Luma Dream Machine
  try {
    console.log("\n🔄 代替モデル（Luma Dream Machine）を試行中...");
    
    const result = await fal.subscribe("fal-ai/luma-dream-machine/image-to-video", {
      input: {
        prompt: videoPrompt,
        image_url: kinmanDataUrl,
        aspect_ratio: "1:1",
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log(`   ⏳ 処理中...`);
        }
      },
    });

    const videoUrl = result.data?.video?.url || result.video?.url;
    if (videoUrl) {
      console.log("\n✅ Luma動画生成成功！");
      
      const response = await fetch(videoUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      const outputPath = path.join(outputDir, "kinman-fortune.mp4");
      await fs.writeFile(outputPath, buffer);
      console.log(`💾 保存完了: ${outputPath}`);
      
      return outputPath;
    }
  } catch (error) {
    console.error("❌ Luma エラー:", error.message);
  }

  console.error("\n💥 全ての動画生成モデルが失敗しました");
  return null;
}

async function main() {
  try {
    const videoPath = await generateVideo();
    
    if (videoPath) {
      console.log("\n" + "=".repeat(50));
      console.log("🎉 動画生成完了！");
      console.log("=".repeat(50));
      console.log(`\n📁 出力ファイル: ${videoPath}`);
      console.log("\n💡 次のステップ:");
      console.log("   1. 動画をプレビューして確認");
      console.log("   2. result/page.tsx を更新してMP4を使用");
    }
  } catch (error) {
    console.error("💥 エラー:", error);
  }
}

main();







