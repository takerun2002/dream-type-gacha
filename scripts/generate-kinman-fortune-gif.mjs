/**
 * きんまん先生の占いGIFアニメーション生成スクリプト
 * FAL AI (Kling Video) を使用して動画→GIF変換
 */

import * as fal from "@fal-ai/serverless-client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env.local から環境変数を読み込み
dotenv.config({ path: path.join(__dirname, "../.env.local") });

// FAL AI 設定
const falKey = process.env.FAL_KEY;
if (!falKey) {
  console.error("❌ FAL_KEY が設定されていません");
  console.log("   .env.local に FAL_KEY=xxx を設定してください");
  process.exit(1);
}

fal.config({
  credentials: falKey,
});

console.log("✅ FAL_KEY 設定完了");

async function generateFortuneAnimation() {
  console.log("🔮 きんまん先生の占いアニメーション生成を開始...\n");

  // 入力画像のパス
  const inputImagePath = path.join(__dirname, "../public/kinman-assets/kinman-crystal-ball.png");
  
  if (!fs.existsSync(inputImagePath)) {
    console.error("❌ 入力画像が見つかりません:", inputImagePath);
    process.exit(1);
  }

  // 画像をBase64に変換
  const imageBuffer = fs.readFileSync(inputImagePath);
  const base64Image = imageBuffer.toString("base64");
  const imageDataUrl = `data:image/png;base64,${base64Image}`;

  console.log("📤 画像をアップロード中...");

  try {
    // FAL AIのImage-to-Video APIを使用
    console.log("🎬 アニメーション生成中（Kling Video API）...");
    console.log("   ※ 数分かかる場合があります\n");

    const result = await fal.subscribe("fal-ai/kling-video/v2.0/standard/image-to-video", {
      input: {
        prompt: "A cute chibi anime boy in traditional Japanese clothing holding a glowing crystal ball. The crystal ball glows with magical purple and rainbow light, swirling energy inside. Sparkles and magical particles float around. The boy has a gentle smile. Mystical fortune telling atmosphere. Subtle floating motion. Soft lighting.",
        image_url: imageDataUrl,
        duration: "5", // 5秒
        aspect_ratio: "1:1",
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log(`   進捗: ${update.logs?.slice(-1)[0]?.message || "処理中..."}`);
        }
      },
    });

    console.log("\n✅ 動画生成完了！");
    console.log("📹 動画URL:", result.video?.url);

    if (result.video?.url) {
      // 動画をダウンロード
      console.log("\n📥 動画をダウンロード中...");
      const videoResponse = await fetch(result.video.url);
      const videoBuffer = await videoResponse.arrayBuffer();
      
      const outputPath = path.join(__dirname, "../public/animations/kinman-fortune.mp4");
      
      // animations ディレクトリを作成
      const animationsDir = path.dirname(outputPath);
      if (!fs.existsSync(animationsDir)) {
        fs.mkdirSync(animationsDir, { recursive: true });
      }
      
      fs.writeFileSync(outputPath, Buffer.from(videoBuffer));
      console.log("✅ 保存完了:", outputPath);

      // WebM版も作成（ブラウザ互換性のため）
      console.log("\n📝 使用方法:");
      console.log("   動画: /animations/kinman-fortune.mp4");
      console.log("   ※ GIF変換が必要な場合は ffmpeg を使用:");
      console.log("   ffmpeg -i kinman-fortune.mp4 -vf 'fps=15,scale=300:-1:flags=lanczos' kinman-fortune.gif");
    }

    return result;

  } catch (error) {
    console.error("❌ エラー:", error.message);
    
    // フォールバック: 静止画からシンプルなアニメーション生成を試行
    console.log("\n🔄 代替方法を試行中...");
    
    try {
      // NanoBanana Proで複数フレームの画像を生成（きんまん先生の特徴を厳密に指定）
      console.log("   NanoBanana Proで占いシーンを生成（金髪きんまん先生統一）...");
      
      const frames = [];
      
      // きんまん先生の特徴を厳密に定義
      const kinmanDescription = `
        STRICT CHARACTER DESIGN - MUST FOLLOW EXACTLY:
        - Cute chibi anime boy (5-6 years old appearance)
        - BLONDE/GOLDEN YELLOW hair (NOT brown, NOT black) - short messy hair
        - Big round brown eyes
        - Rosy cheeks, gentle smile
        - Traditional Japanese white kimono/haori with pastel cloud patterns (light blue, pink, purple clouds)
        - Green obi belt
        - Sitting cross-legged on the ground
        - Holding a glowing crystal ball with rainbow swirls inside
        - White/cream background
        - Chibi proportions (big head, small body)
      `.trim();
      
      const prompts = [
        `${kinmanDescription}. The crystal ball has a SOFT BLUE GLOW. Small sparkles around. Peaceful expression. Clean simple background.`,
        `${kinmanDescription}. The crystal ball has a BRIGHT PURPLE MAGICAL GLOW. More sparkles floating upward. Happy smile. Magical energy swirling.`,
        `${kinmanDescription}. The crystal ball has a RAINBOW RADIANT GLOW with golden light. Maximum sparkles and magical particles. Joyful expression. Mystical aura.`
      ];

      for (let i = 0; i < prompts.length; i++) {
        console.log(`   フレーム ${i + 1}/3 生成中...`);
        
        // 元のきんまん画像を参照画像として使用（image-to-image編集）
        const frameResult = await fal.subscribe("fal-ai/nano-banana-pro/edit", {
          input: {
            prompt: prompts[i],
            image_urls: [imageDataUrl], // 元のきんまん画像を参照
            num_images: 1,
            output_format: "png",
            resolution: "1K",
            strength: 0.6, // 元画像を60%維持、40%変更
          },
        });

        if (frameResult.images?.[0]?.url) {
          frames.push(frameResult.images[0].url);
        }
      }

      console.log("\n✅ フレーム生成完了！");
      console.log("📷 生成された画像:");
      frames.forEach((url, i) => console.log(`   フレーム ${i + 1}: ${url}`));

      // フレームをダウンロード
      const outputDir = path.join(__dirname, "../public/animations");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      for (let i = 0; i < frames.length; i++) {
        const response = await fetch(frames[i]);
        const buffer = await response.arrayBuffer();
        const framePath = path.join(outputDir, `kinman-fortune-frame-${i + 1}.png`);
        fs.writeFileSync(framePath, Buffer.from(buffer));
        console.log(`   保存: ${framePath}`);
      }

      return { frames };

    } catch (fallbackError) {
      console.error("❌ フォールバックも失敗:", fallbackError.message);
      throw fallbackError;
    }
  }
}

// 実行
generateFortuneAnimation()
  .then((result) => {
    console.log("\n🎉 完了！");
  })
  .catch((error) => {
    console.error("💥 失敗:", error);
    process.exit(1);
  });

