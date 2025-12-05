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

async function main() {
  console.log("🔮 バッジ背景削除開始\n");

  // 1. 「完全無料」バッジの背景削除
  await removeBackground(
    `${ASSETS_DIR}/badge-free.png`,
    `${ASSETS_DIR}/badge-free-nobg.png`
  );

  // 2. 「全9タイプ」バッジの背景削除
  await removeBackground(
    `${ASSETS_DIR}/badge-types.png`,
    `${ASSETS_DIR}/badge-types-nobg.png`
  );

  console.log("\n🎉 バッジ背景削除完了！");
}

main().catch(console.error);



