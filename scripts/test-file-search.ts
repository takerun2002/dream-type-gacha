/**
 * Gemini File Search テストスクリプト
 */

import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY_SUPPORT || process.env.GEMINI_API_KEY;
const FILE_SEARCH_STORE_NAME = process.env.GEMINI_FILE_SEARCH_STORE_NAME || "fileSearchStores/dreamtypegachafaq-shrheaijatxi";

if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY が設定されていません");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

async function testFileSearch() {
  console.log("🔍 File Search テストを実行中...\n");
  console.log(`📁 Store: ${FILE_SEARCH_STORE_NAME}\n`);

  const testQueries = [
    "診断は何回でもできますか？",
    "iPhoneでカードを保存する方法",
    "別の人の名前が表示される",
    "もう一度診断したい",
  ];

  for (const query of testQueries) {
    console.log(`\n📝 質問: "${query}"`);
    console.log("-".repeat(50));

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: query,
        config: {
          tools: [
            {
              fileSearch: {
                fileSearchStoreNames: [FILE_SEARCH_STORE_NAME],
              },
            },
          ],
        },
      });

      const text = response.text || "(回答なし)";
      console.log(`💬 回答:\n${text.substring(0, 500)}${text.length > 500 ? "..." : ""}`);

      // grounding metadata を確認
      const groundingMetadata = (response as { groundingMetadata?: unknown }).groundingMetadata;
      if (groundingMetadata) {
        console.log("\n📌 引用情報:");
        console.log(JSON.stringify(groundingMetadata, null, 2).substring(0, 300));
      }
    } catch (error) {
      console.error(`❌ 検索エラー: ${error}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

testFileSearch().catch(console.error);
