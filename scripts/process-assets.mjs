import { fal } from "@fal-ai/client";
import fs from "fs";

fal.config({
  credentials: "2119fdd6-23d0-44a6-9c22-932a62b4126f:5881f0e3fb013f61564554ca663ea949"
});

const ASSETS_DIR = "/Users/okajima/引き寄せノート講座ローンチプロジェクト/dream-type-gacha/public/thumbnail-assets";

// 背景削除
async function removeBackground(inputPath, outputPath) {
  console.log(`🔧 背景削除中: ${inputPath}...`);
  
  try {
    // ファイルをBase64に変換
    const imageData = fs.readFileSync(inputPath);
    const base64 = `data:image/png;base64,${imageData.toString('base64')}`;
    
    const result = await fal.subscribe("fal-ai/birefnet", {
      input: {
        image_url: base64,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("  ⏳ 処理中...");
        }
      },
    });

    if (result.data?.image?.url) {
      const response = await fetch(result.data.image.url);
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(outputPath, buffer);
      console.log(`  ✅ 保存: ${outputPath}`);
      return true;
    }
  } catch (error) {
    console.error(`  ❌ エラー: ${error.message}`);
  }
  return false;
}

// リッチバッジ生成
async function generateRichBadge(text, filename, colors) {
  console.log(`🎨 バッジ生成中: ${text}...`);
  
  try {
    const result = await fal.subscribe("fal-ai/nano-banana-pro", {
      input: {
        prompt: `Japanese text "${text}" in extremely bold chunky 3D metallic font, ${colors} gradient fill with golden outline, thick black outer border, glossy embossed effect with highlights, Japanese pachinko/gacha game style typography, sparkling effects, premium quality, badge/label style, dark transparent background, high contrast`,
        aspect_ratio: "4:3",
        num_images: 1,
        output_format: "png",
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("  ⏳ 処理中...");
        }
      },
    });

    if (result.data?.images?.[0]?.url) {
      const imageUrl = result.data.images[0].url;
      const response = await fetch(imageUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      const outputPath = `${ASSETS_DIR}/${filename}`;
      fs.writeFileSync(outputPath, buffer);
      console.log(`  ✅ 保存: ${outputPath}`);
      return outputPath;
    }
  } catch (error) {
    console.error(`  ❌ エラー: ${error.message}`);
  }
  return null;
}

async function main() {
  console.log("🔮 素材加工開始\n");

  // 1. タイトル画像の背景削除
  await removeBackground(
    `${ASSETS_DIR}/title-rainbow.png`,
    `${ASSETS_DIR}/title-rainbow-nobg.png`
  );

  // 2. リッチバッジ生成：「完全無料」
  await generateRichBadge(
    "🔮完全無料",
    "badge-free.png",
    "red to dark red"
  );

  // 3. リッチバッジ生成：「全9タイプ」
  await generateRichBadge(
    "✨全9タイプ",
    "badge-types.png",
    "gold to orange"
  );

  console.log("\n🎉 素材加工完了！");
}

main().catch(console.error);
























