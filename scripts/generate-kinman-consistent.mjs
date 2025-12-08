/**
 * きんまん先生のキャラクター一貫性を保ったアニメーション生成
 * FAL AI Flux Kontext を使用して元画像の特徴を維持
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

// 元のきんまん画像をアップロード
const kinmanImagePath = path.join(__dirname, "../public/kinman-assets/kinman-crystal-ball.png");
const kinmanImageBuffer = await fs.readFile(kinmanImagePath);
const kinmanBase64 = kinmanImageBuffer.toString('base64');
const kinmanDataUrl = `data:image/png;base64,${kinmanBase64}`;

console.log("🔮 Flux Kontextでキャラクター一貫性を保ったフレーム生成開始...\n");

// 各フレームのプロンプト（元画像をベースに水晶玉の光だけを変更）
const framePrompts = [
  "Make the crystal ball glow with soft blue magical light. Add small sparkles around it. Keep the exact same character design, pose, and clothes.",
  "Make the crystal ball glow brightly with purple swirling magical energy. Add more sparkles floating upward. The character should smile slightly. Keep exact same character design and clothes.",
  "Make the crystal ball radiate brilliant golden rainbow light. Add maximum sparkles and stars around. The character looks happy and mystical. Keep exact same character design and clothes.",
];

const frames = [];

for (let i = 0; i < framePrompts.length; i++) {
  console.log(`📸 フレーム ${i + 1}/${framePrompts.length} 生成中...`);
  console.log(`   プロンプト: ${framePrompts[i].substring(0, 50)}...`);
  
  try {
    const result = await fal.subscribe("fal-ai/flux-pro/kontext", {
      input: {
        prompt: framePrompts[i],
        image_url: kinmanDataUrl,
        output_format: "png",
        seed: 42, // 一貫性のため固定シード
        guidance_scale: 3.5,
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
      
      // 画像をダウンロード
      const response = await fetch(imageUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      
      // 背景除去
      console.log("   🔧 背景除去中...");
      const rembgResult = await fal.subscribe("fal-ai/imageutils/rembg", {
        input: { image_url: imageUrl },
      });
      
      const transparentUrl = rembgResult.data?.image?.url || rembgResult.image?.url || imageUrl;
      
      if (transparentUrl !== imageUrl) {
        console.log("   ✅ 背景除去成功！");
        const transparentResponse = await fetch(transparentUrl);
        const transparentBuffer = Buffer.from(await transparentResponse.arrayBuffer());
        const filepath = path.join(outputDir, `kinman-fortune-frame-${i + 1}.png`);
        await fs.writeFile(filepath, transparentBuffer);
        frames.push(filepath);
      } else {
        const filepath = path.join(outputDir, `kinman-fortune-frame-${i + 1}.png`);
        await fs.writeFile(filepath, buffer);
        frames.push(filepath);
      }
      
      console.log(`   💾 保存: kinman-fortune-frame-${i + 1}.png\n`);
    } else {
      console.log("   ⚠️ 画像URLが見つかりません");
      console.log("   結果:", JSON.stringify(result, null, 2).substring(0, 300));
    }
  } catch (error) {
    console.error(`   ❌ エラー: ${error.message}`);
    
    // フォールバック: NanoBanana Pro (edit) を使用
    console.log("   🔄 フォールバック: NanoBanana Pro (edit) で試行...");
    try {
      const fallbackResult = await fal.subscribe("fal-ai/nano-banana-pro/edit", {
        input: {
          prompt: framePrompts[i],
          image_urls: [kinmanDataUrl],
          num_images: 1,
          output_format: "png",
        },
      });
      
      const fallbackUrl = fallbackResult.data?.images?.[0]?.url || fallbackResult.images?.[0]?.url;
      if (fallbackUrl) {
        console.log("   ✅ フォールバック成功！");
        
        // 背景除去
        const rembgResult = await fal.subscribe("fal-ai/imageutils/rembg", {
          input: { image_url: fallbackUrl },
        });
        const transparentUrl = rembgResult.data?.image?.url || rembgResult.image?.url || fallbackUrl;
        
        const response = await fetch(transparentUrl);
        const buffer = Buffer.from(await response.arrayBuffer());
        const filepath = path.join(outputDir, `kinman-fortune-frame-${i + 1}.png`);
        await fs.writeFile(filepath, buffer);
        frames.push(filepath);
        console.log(`   💾 保存: kinman-fortune-frame-${i + 1}.png\n`);
      }
    } catch (fallbackError) {
      console.error(`   ❌ フォールバックも失敗: ${fallbackError.message}`);
    }
  }
}

if (frames.length > 0) {
  console.log("🎉 フレーム生成完了！");
  console.log(`📁 生成ファイル: ${frames.length}枚`);
  
  // WebPアニメーション作成コマンドを表示
  console.log("\n💡 WebPアニメーション作成コマンド:");
  console.log("   ffmpeg -y -framerate 1 -i kinman-fortune-frame-%d.png -c:v libwebp -lossless 1 -loop 0 kinman-fortune.webp");
} else {
  console.log("❌ フレーム生成に失敗しました");
}














