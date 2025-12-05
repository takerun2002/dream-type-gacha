#!/usr/bin/env node
/**
 * FAL AI NanoBanana Pro で Three.js 用スピリチュアル素材を生成
 * 
 * 使い方:
 *   FAL_KEY=your-key node scripts/generate-assets.mjs
 *   または
 *   node scripts/generate-assets.mjs (環境変数が設定されている場合)
 */

import { fal } from "@fal-ai/client";
import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// FAL AI設定
const FAL_KEY = process.env.FAL_KEY;

if (!FAL_KEY) {
  console.error("❌ FAL_KEY環境変数が設定されていません");
  console.log("使用方法: FAL_KEY=your-key node scripts/generate-assets.mjs");
  process.exit(1);
}

fal.config({
  credentials: FAL_KEY,
});

// 出力ディレクトリ
const OUTPUT_DIR = path.join(__dirname, "../public/textures");

// 生成する素材の定義
const ASSETS = [
  {
    name: "starfield",
    filename: "starfield-bg.png",
    prompt: `Beautiful spiritual cosmic starfield background, deep purple and pink nebula, golden stardust particles, ethereal glowing stars, mystical aurora lights, seamless tileable texture, dark space background with vibrant colors, magical dreamy atmosphere, high quality, 4k resolution`,
    negative_prompt: `text, watermark, logo, blurry, low quality, people, faces, characters`,
    size: "landscape_16_9",
  },
  {
    name: "light_orb",
    filename: "light-orb.png",
    prompt: `Single magical glowing light orb, soft pink and purple gradient, ethereal glow effect, transparent background, spiritual energy ball, mystical aura, bokeh light effect, isolated on black background, high quality render`,
    negative_prompt: `text, watermark, multiple objects, busy background, people`,
    size: "square",
  },
  {
    name: "aurora_wave",
    filename: "aurora-wave.png",
    prompt: `Ethereal aurora borealis wave, flowing spiritual energy, pink purple and gold colors, mystical light ribbons, transparent overlay texture, magical flowing lights, dreamy atmosphere, seamless horizontal pattern, black background`,
    negative_prompt: `text, watermark, logo, landscape, mountains, people`,
    size: "landscape_16_9",
  },
  {
    name: "stardust",
    filename: "stardust-particles.png",
    prompt: `Golden and pink stardust particles, magical sparkles, glittering light dots, transparent background, scattered star particles, fairy dust effect, bokeh lights, isolated sparkle elements on black background`,
    negative_prompt: `text, watermark, people, objects, busy composition`,
    size: "square",
  },
  {
    name: "sacred_geometry",
    filename: "sacred-geometry.png",
    prompt: `Sacred geometry pattern, golden ratio spiral, mystical mandala, glowing purple and gold lines, spiritual symbol, ethereal light traces, subtle geometric pattern, meditation visual, isolated on black background`,
    negative_prompt: `text, watermark, people, realistic, photo`,
    size: "square",
  },
  {
    name: "manifestation_light",
    filename: "manifestation-light.png",
    prompt: `Manifestation energy beam, vertical light pillar, pink and purple gradient, spiritual ascending light, magical golden sparkles, ethereal glow, dreamy atmosphere, isolated on dark background, high quality`,
    negative_prompt: `text, watermark, people, objects, busy`,
    size: "portrait_4_3",
  },
];

// 画像をダウンロード
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve(filepath);
      });
    }).on("error", (err) => {
      fs.unlink(filepath, () => {}); // 失敗したファイルを削除
      reject(err);
    });
  });
}

// メイン処理
async function main() {
  console.log("🎨 Three.js用スピリチュアル素材を生成します...\n");

  // 出力ディレクトリを作成
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const asset of ASSETS) {
    console.log(`\n✨ 生成中: ${asset.name}`);
    console.log(`   プロンプト: ${asset.prompt.substring(0, 60)}...`);

    try {
      const result = await fal.subscribe("fal-ai/nano-banana-pro", {
        input: {
          prompt: asset.prompt,
          negative_prompt: asset.negative_prompt,
          image_size: asset.size,
          num_inference_steps: 30,
          guidance_scale: 7.5,
          num_images: 1,
          enable_safety_checker: true,
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            process.stdout.write(".");
          }
        },
      });

      if (result.data?.images?.[0]?.url) {
        const imageUrl = result.data.images[0].url;
        const filepath = path.join(OUTPUT_DIR, asset.filename);
        
        await downloadImage(imageUrl, filepath);
        console.log(`\n   ✅ 保存完了: ${filepath}`);
      } else {
        console.log(`\n   ❌ 画像URLが取得できませんでした`);
      }
    } catch (error) {
      console.error(`\n   ❌ エラー: ${error.message}`);
    }
  }

  console.log("\n\n🎉 素材生成が完了しました！");
  console.log(`📁 保存先: ${OUTPUT_DIR}`);
}

main().catch(console.error);

