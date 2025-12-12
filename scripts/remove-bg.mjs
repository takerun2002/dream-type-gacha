#!/usr/bin/env node
/**
 * FAL AI birefnet で背景削除
 */

import { fal } from "@fal-ai/client";
import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FAL_KEY = process.env.FAL_KEY;

if (!FAL_KEY) {
  console.error("❌ FAL_KEY環境変数が設定されていません");
  process.exit(1);
}

fal.config({ credentials: FAL_KEY });

const IMAGES_DIR = path.join(__dirname, "../public/images");

// 処理する画像
const IMAGES = [
  { name: "kinman-sitting", file: "kinman-sitting.png" },
  { name: "kinman-standing", file: "kinman-standing.png" },
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
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// 画像をBase64に変換
function imageToBase64(filepath) {
  const data = fs.readFileSync(filepath);
  return `data:image/png;base64,${data.toString("base64")}`;
}

async function main() {
  console.log("🎨 きんまんキャラの背景を削除します...\n");

  for (const img of IMAGES) {
    const inputPath = path.join(IMAGES_DIR, img.file);
    const outputPath = path.join(IMAGES_DIR, img.file.replace(".png", "-transparent.png"));

    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️ ${img.file} が見つかりません`);
      continue;
    }

    console.log(`✨ 処理中: ${img.name}`);

    try {
      const imageBase64 = imageToBase64(inputPath);

      const result = await fal.subscribe("fal-ai/birefnet", {
        input: {
          image_url: imageBase64,
          model: "General Use (Light)",
          operating_resolution: "1024x1024",
          output_format: "png",
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            process.stdout.write(".");
          }
        },
      });

      if (result.data?.image?.url) {
        // バックアップを作成
        const backupPath = path.join(IMAGES_DIR, img.file.replace(".png", "-backup.png"));
        fs.copyFileSync(inputPath, backupPath);
        console.log(`\n   📦 バックアップ: ${backupPath}`);

        // 透過画像をダウンロードして元のファイルを置き換え
        await downloadImage(result.data.image.url, inputPath);
        console.log(`   ✅ 透過完了: ${inputPath}`);
      } else {
        console.log(`\n   ❌ 画像URLが取得できませんでした`);
      }
    } catch (error) {
      console.error(`\n   ❌ エラー: ${error.message}`);
    }
  }

  console.log("\n\n🎉 背景削除が完了しました！");
}

main().catch(console.error);
























