import { fal } from "@fal-ai/client";
import fs from "fs";
import path from "path";

fal.config({
  credentials: "2119fdd6-23d0-44a6-9c22-932a62b4126f:5881f0e3fb013f61564554ca663ea949"
});

const OUTPUT_DIR = "/Users/okajima/引き寄せノート講座ローンチプロジェクト/dream-type-gacha/public/kinman-assets";

// きんまんさんの基本プロンプト
const BASE_PROMPT = `Chibi anime character, cute young boy with golden blonde hair and warm brown eyes, wearing a white traditional Japanese kimono/haori, soft pastel color palette, clean line art, kawaii style, simple design, full body, transparent background PNG`;

// 生成するポーズ・表情のバリエーション
const VARIATIONS = [
  // 表情バリエーション
  {
    name: "happy",
    filename: "kinman-happy.png",
    prompt: `${BASE_PROMPT}, very happy expression, big smile, sparkling eyes, hands raised in celebration, joyful pose`
  },
  {
    name: "surprised",
    filename: "kinman-surprised.png", 
    prompt: `${BASE_PROMPT}, surprised expression, wide open eyes, open mouth, hands up near face in shock, cute surprised pose`
  },
  {
    name: "thinking",
    filename: "kinman-thinking.png",
    prompt: `${BASE_PROMPT}, thinking expression, one finger on chin, tilted head, curious look, contemplating pose`
  },
  {
    name: "excited",
    filename: "kinman-excited.png",
    prompt: `${BASE_PROMPT}, excited expression, stars in eyes, fists pumped up, energetic jumping pose, enthusiasm`
  },
  {
    name: "wink",
    filename: "kinman-wink.png",
    prompt: `${BASE_PROMPT}, playful wink expression, one eye closed, peace sign hand gesture, cute mischievous smile`
  },
  {
    name: "proud",
    filename: "kinman-proud.png",
    prompt: `${BASE_PROMPT}, proud confident expression, arms crossed, slight smirk, standing tall pose`
  },
  {
    name: "shy",
    filename: "kinman-shy.png",
    prompt: `${BASE_PROMPT}, shy blushing expression, looking down slightly, hands together nervously, pink cheeks`
  },
  {
    name: "sleepy",
    filename: "kinman-sleepy.png",
    prompt: `${BASE_PROMPT}, sleepy drowsy expression, half-closed eyes, yawning, rubbing eyes with hand`
  },
  // ポーズバリエーション  
  {
    name: "pointing",
    filename: "kinman-pointing.png",
    prompt: `${BASE_PROMPT}, pointing forward with finger, confident smile, explaining pose, teaching gesture`
  },
  {
    name: "waving",
    filename: "kinman-waving.png",
    prompt: `${BASE_PROMPT}, friendly wave, one hand raised waving hello, warm welcoming smile`
  },
  {
    name: "thumbsup",
    filename: "kinman-thumbsup.png",
    prompt: `${BASE_PROMPT}, thumbs up gesture, encouraging smile, supportive pose, positive energy`
  },
  {
    name: "praying",
    filename: "kinman-praying.png",
    prompt: `${BASE_PROMPT}, prayer pose, hands together in front of chest, serene peaceful expression, spiritual`
  },
  {
    name: "reading",
    filename: "kinman-reading.png",
    prompt: `${BASE_PROMPT}, holding and reading a book or scroll, focused expression, studious pose`
  },
  {
    name: "crystal-ball",
    filename: "kinman-crystal-ball.png",
    prompt: `${BASE_PROMPT}, holding a glowing crystal ball, mystical expression, fortune teller pose, magical aura`
  },
  {
    name: "cards",
    filename: "kinman-cards.png",
    prompt: `${BASE_PROMPT}, holding tarot cards, mysterious smile, card spread pose, divination`
  },
  {
    name: "celebrating",
    filename: "kinman-celebrating.png",
    prompt: `${BASE_PROMPT}, celebrating with confetti, arms up in victory, huge joyful smile, party pose`
  }
];

async function generateCharacter(variation) {
  console.log(`\n🎨 生成中: ${variation.name}...`);
  
  try {
    // NanoBanana Proで生成
    const result = await fal.subscribe("fal-ai/nano-banana-pro", {
      input: {
        prompt: variation.prompt,
        aspect_ratio: "1:1",
        num_images: 1,
        output_format: "png",
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
      const response = await fetch(imageUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      
      const tempPath = path.join(OUTPUT_DIR, `temp-${variation.filename}`);
      fs.writeFileSync(tempPath, buffer);
      console.log(`\n  ✅ 生成完了: ${tempPath}`);
      
      // 背景削除
      console.log(`  🔧 背景削除中...`);
      const bgResult = await removeBackground(tempPath, path.join(OUTPUT_DIR, variation.filename));
      
      // 一時ファイル削除
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      
      return bgResult;
    }
  } catch (error) {
    console.error(`\n  ❌ エラー: ${error.message}`);
  }
  return false;
}

async function removeBackground(inputPath, outputPath) {
  try {
    const imageData = fs.readFileSync(inputPath);
    const base64 = `data:image/png;base64,${imageData.toString('base64')}`;
    
    const result = await fal.subscribe("fal-ai/birefnet", {
      input: {
        image_url: base64,
      },
      logs: false,
    });

    if (result.data?.image?.url) {
      const response = await fetch(result.data.image.url);
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(outputPath, buffer);
      console.log(`  ✅ 背景削除完了: ${outputPath}`);
      return true;
    }
  } catch (error) {
    console.error(`  ❌ 背景削除エラー: ${error.message}`);
  }
  return false;
}

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("🎭 きんまんキャラクターシート生成");
  console.log("═══════════════════════════════════════════════════");
  console.log(`📁 出力先: ${OUTPUT_DIR}`);
  console.log(`📝 生成予定: ${VARIATIONS.length}種類`);
  console.log("═══════════════════════════════════════════════════\n");

  // 出力ディレクトリ作成
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 ディレクトリ作成: ${OUTPUT_DIR}`);
  }

  const results = {
    success: [],
    failed: []
  };

  for (const variation of VARIATIONS) {
    const success = await generateCharacter(variation);
    if (success) {
      results.success.push(variation.name);
    } else {
      results.failed.push(variation.name);
    }
    
    // API制限対策で少し待機
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // 結果サマリー
  console.log("\n═══════════════════════════════════════════════════");
  console.log("📊 生成結果サマリー");
  console.log("═══════════════════════════════════════════════════");
  console.log(`✅ 成功: ${results.success.length}/${VARIATIONS.length}`);
  if (results.success.length > 0) {
    console.log(`   → ${results.success.join(", ")}`);
  }
  if (results.failed.length > 0) {
    console.log(`❌ 失敗: ${results.failed.length}/${VARIATIONS.length}`);
    console.log(`   → ${results.failed.join(", ")}`);
  }
  console.log("═══════════════════════════════════════════════════");
  
  // TypeScript型定義ファイル生成
  const typeDef = `// Auto-generated kinman character assets
export const KINMAN_ASSETS = {
${results.success.map(name => `  "${name}": "/kinman-assets/kinman-${name}.png"`).join(",\n")}
} as const;

export type KinmanAssetKey = keyof typeof KINMAN_ASSETS;
`;
  
  const typeFilePath = "/Users/okajima/引き寄せノート講座ローンチプロジェクト/dream-type-gacha/src/lib/kinmanAssets.ts";
  fs.writeFileSync(typeFilePath, typeDef);
  console.log(`\n📝 型定義ファイル生成: ${typeFilePath}`);
  
  console.log("\n🎉 キャラクターシート生成完了！");
}

main().catch(console.error);

























