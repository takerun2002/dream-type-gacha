import { fal } from "@fal-ai/client";
import fs from "fs";

fal.config({
  credentials: "2119fdd6-23d0-44a6-9c22-932a62b4126f:5881f0e3fb013f61564554ca663ea949"
});

const OUTPUT_DIR = "/Users/okajima/引き寄せノート講座ローンチプロジェクト/dream-type-gacha/public/thumbnail-assets";

// 出力ディレクトリ作成
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function generateAsset(prompt, filename, aspectRatio = "16:9") {
  console.log(`🎨 生成中: ${filename}...`);
  
  try {
    const result = await fal.subscribe("fal-ai/nano-banana-pro", {
      input: {
        prompt: prompt,
        aspect_ratio: aspectRatio,
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
      const outputPath = `${OUTPUT_DIR}/${filename}`;
      fs.writeFileSync(outputPath, buffer);
      console.log(`  ✅ 保存: ${outputPath} (${Math.round(buffer.length / 1024)}KB)`);
      return outputPath;
    }
  } catch (error) {
    console.error(`  ❌ エラー: ${error.message}`);
  }
  return null;
}

async function main() {
  console.log("🔮 NanoBanana Pro サムネイル素材生成開始\n");

  // 1. スピリチュアル背景
  await generateAsset(
    `Mystical spiritual fortune-telling background with golden particles explosion, sacred geometry patterns, divine light rays bursting from center, floating magical sparkles and stars, purple and gold color scheme, cosmic energy swirls, crystal ball glow effect, tarot card magic atmosphere, Japanese gacha game style, premium mobile game aesthetic, 4K quality, no text, no characters`,
    "spiritual-bg.png",
    "16:9"
  );

  // 2. ギラギラタイトル「夢タイプ診断」
  await generateAsset(
    `Japanese text "夢タイプ診断" (Dream Type Diagnosis) in extremely bold chunky font style like Japanese pachinko game typography, rainbow gradient fill from red to orange to yellow to green to blue to purple, thick black outline with gold inner glow, 3D embossed metallic effect, sparkling highlights, dramatic drop shadow, text only on transparent/simple dark background, game logo style, premium quality Japanese typography, inspired by DOPA gacha game banners`,
    "title-rainbow.png",
    "16:9"
  );

  // 3. サブタイトル
  await generateAsset(
    `Japanese text "運命のカードがあなたを待つ" in elegant bold font, white text with pink glow effect and soft shadow, sparkle effects around text, magical mystical style, transparent background, fortune-telling aesthetic`,
    "subtitle.png",
    "16:9"
  );

  // 4. 「激アツ確定」バッジテキスト
  await generateAsset(
    `Japanese text "激アツ確定演出" in bold chunky gold gradient font with red outline and black shadow, pachinko slot machine style typography, metallic 3D effect, exciting promotional banner text style, sparkles and glow effects`,
    "hot-badge.png",
    "4:3"
  );

  // 5. ゴールドパーティクル爆発エフェクト（オーバーレイ用）
  await generateAsset(
    `Golden sparkle particle explosion effect, transparent/black background, magical burst of gold glitter and stars flying outward from center, lens flare, light rays, premium game effect, overlay asset, PNG with transparency feel`,
    "gold-particles.png",
    "1:1"
  );

  console.log("\n🎉 素材生成完了！");
}

main().catch(console.error);









