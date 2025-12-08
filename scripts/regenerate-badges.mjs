import { fal } from "@fal-ai/client";
import fs from "fs";

fal.config({
  credentials: "2119fdd6-23d0-44a6-9c22-932a62b4126f:5881f0e3fb013f61564554ca663ea949"
});

const ASSETS_DIR = "/Users/okajima/引き寄せノート講座ローンチプロジェクト/dream-type-gacha/public/thumbnail-assets";

async function generateBadge(prompt, filename) {
  console.log(`🎨 バッジ生成中: ${filename}...`);
  
  try {
    const result = await fal.subscribe("fal-ai/nano-banana-pro", {
      input: {
        prompt: prompt,
        aspect_ratio: "16:9",
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

async function removeBackground(inputPath, outputPath) {
  console.log(`🔧 背景削除: ${inputPath}...`);
  
  try {
    const imageData = fs.readFileSync(inputPath);
    const base64 = `data:image/png;base64,${imageData.toString('base64')}`;
    
    const result = await fal.subscribe("fal-ai/birefnet", {
      input: {
        image_url: base64,
      },
      logs: true,
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

async function main() {
  console.log("🔮 リッチバッジ再生成開始\n");

  // 1. 「🔮完全無料」- シンプルな背景で生成
  const badge1Path = await generateBadge(
    `Single line Japanese text "🔮完全無料" on pure solid black background, extremely bold 3D metallic font, deep red to crimson gradient fill, thick golden outline border, glossy embossed effect with sparkle highlights, pachinko slot machine style typography, game banner text, centered composition, no other elements, clean simple background`,
    "badge-free-v2.png"
  );

  // 2. 「✨全9タイプ」- シンプルな背景で生成  
  const badge2Path = await generateBadge(
    `Single line Japanese text "✨全9タイプ" on pure solid black background, extremely bold 3D metallic font, golden to orange gradient fill, thick black outline border, glossy embossed effect with sparkle highlights, pachinko slot machine style typography, game banner text, centered composition, no other elements, clean simple background`,
    "badge-types-v2.png"
  );

  // 背景削除
  if (badge1Path) {
    await removeBackground(badge1Path, `${ASSETS_DIR}/badge-free-clean.png`);
  }
  if (badge2Path) {
    await removeBackground(badge2Path, `${ASSETS_DIR}/badge-types-clean.png`);
  }

  console.log("\n🎉 バッジ再生成完了！");
}

main().catch(console.error);
















