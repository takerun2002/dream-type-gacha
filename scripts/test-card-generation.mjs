// Fal AI カード画像テスト生成スクリプト
import { fal } from "@fal-ai/client";
import fs from "fs";
import https from "https";
import path from "path";

// Fal AI設定
fal.config({
  credentials: "2119fdd6-23d0-44a6-9c22-932a62b4126f:5881f0e3fb013f61564554ca663ea949",
});

// テスト用プロンプト（不死鳥タイプ ノーマル）
const testPrompt = `A mystical phoenix card design, fantasy trading card style, 
majestic phoenix rising from flames, red and orange fire gradient background,
elegant purple and pink border frame, magical sparkles,
Japanese aesthetic, spiritual and ethereal atmosphere,
vertical card format 2:3 ratio, high quality digital art`;

async function generateTestCard() {
  console.log("🔥 不死鳥タイプ（ノーマル）カードを生成中...\n");
  console.log("プロンプト:", testPrompt, "\n");

  try {
    const result = await fal.subscribe("fal-ai/nano-banana-pro", {
      input: {
        prompt: testPrompt,
        aspect_ratio: "2:3",
        num_images: 1,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("⏳ 生成中...", update.logs?.map(log => log.message).join("\n"));
        }
      },
    });

    console.log("\n✅ 生成完了!");
    console.log("結果:", JSON.stringify(result, null, 2));

    // 画像URLがあれば保存
    if (result.images && result.images.length > 0) {
      const imageUrl = result.images[0].url;
      console.log("\n📸 画像URL:", imageUrl);

      // 画像をダウンロードして保存
      const outputDir = "./public/images/cards";
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const outputPath = path.join(outputDir, "phoenix-normal-test.png");
      
      // HTTPSで画像をダウンロード
      const file = fs.createWriteStream(outputPath);
      https.get(imageUrl, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          console.log(`\n💾 保存完了: ${outputPath}`);
        });
      }).on("error", (err) => {
        fs.unlink(outputPath, () => {});
        console.error("ダウンロードエラー:", err.message);
      });
    }

    return result;
  } catch (error) {
    console.error("❌ エラー:", error);
    throw error;
  }
}

// 実行
generateTestCard();



