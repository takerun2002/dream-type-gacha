/**
 * Gemini File Search Store セットアップスクリプト
 * FAQデータをFile Search Storeに登録する
 */

import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as path from "path";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY_SUPPORT || process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY が設定されていません");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// FAQデータ（seed-faq-data.tsと同じ）
const faqData = [
  {
    id: "faq-001",
    category: "name_mismatch",
    question: "別の人の名前が表示される",
    answer: `共有デバイスで診断した可能性があります。

対処法:
1. 別のブラウザまたは端末でお試しください
2. ブラウザのキャッシュをクリアしてください
3. それでも解決しない場合は、サポートセンターへお問い合わせください`,
    tags: ["名前", "バグ", "共有デバイス"],
    priority: 10,
  },
  {
    id: "faq-002",
    category: "card_issue",
    question: "カードが生成されない、表示されない",
    answer: `混雑時は生成に時間がかかることがあります。

対処法:
1. しばらくお待ちください（最大1-2分）
2. ページを再読み込みしてください
3. 別のブラウザでお試しください

それでも解決しない場合は、サポートセンターへお問い合わせください。`,
    tags: ["カード", "生成", "表示"],
    priority: 9,
  },
  {
    id: "faq-003",
    category: "general",
    question: "もう一度診断したい",
    answer: `診断は1人1回限りとなっております。

別の結果が欲しい場合は:
1. 別のブラウザまたは端末でお試しください
2. サポートセンターへお問い合わせください

※ 同じデバイスでは再診断できません`,
    tags: ["再診断", "制限"],
    priority: 8,
  },
  {
    id: "faq-004",
    category: "card_issue",
    question: "カードの保存方法",
    answer: `結果画面の「写真に保存」ボタンをタップしてください。

または:
1. カード画像を長押し
2. 「画像を保存」を選択

※ メールで受け取ることもできます`,
    tags: ["カード", "保存", "ダウンロード"],
    priority: 7,
  },
  {
    id: "faq-005",
    category: "general",
    question: "診断結果がおかしい",
    answer: `診断結果は、四柱推命・九星気学・数秘術を組み合わせたAI診断です。

結果についてのご質問は:
1. サポートセンターへお問い合わせください
2. きんまん先生の引き寄せノート講座で詳しく解説されています`,
    tags: ["診断", "結果", "質問"],
    priority: 6,
  },
  {
    id: "faq-006",
    category: "bug",
    question: "エラーが出る",
    answer: `一時的なエラーの可能性があります。

対処法:
1. ページを再読み込みしてください
2. ブラウザのキャッシュをクリアしてください
3. 別のブラウザでお試しください

エラーが続く場合は、サポートセンターへお問い合わせください。`,
    tags: ["エラー", "不具合"],
    priority: 5,
  },
  {
    id: "faq-007",
    category: "general",
    question: "メールで鑑定書を受け取れない",
    answer: `メールが届かない場合:
1. 迷惑メールフォルダを確認してください
2. メールアドレスが正しいか確認してください
3. 数分待ってから再度お試しください

それでも届かない場合は、サポートセンターへお問い合わせください。`,
    tags: ["メール", "鑑定書", "受信"],
    priority: 4,
  },
  {
    id: "faq-008",
    category: "general",
    question: "診断は何回でもできますか？",
    answer: `いいえ、診断はおひとり様1回限りとなっております。

重要: 他の人に診断結果を共有したり、複数回診断することはできません。

同じデバイス・同じブラウザでは再診断できませんので、ご注意ください。

別の結果が欲しい場合は、サポートセンターへお問い合わせください。`,
    tags: ["診断", "制限", "1回限り", "再診断", "重要"],
    priority: 15,
  },
  {
    id: "faq-009",
    category: "general",
    question: "診断結果を他の人に共有してもいいですか？",
    answer: `他の人に共有しないでください。

診断結果は、あなた専用のパーソナライズされた鑑定書です。

他の人に共有すると:
- 診断の意味が薄れてしまいます
- あなた自身の引き寄せの力が弱まる可能性があります

大切なのは、あなた自身が結果を受け取り、行動することです。

きんまん先生の引き寄せノート講座で、より詳しく学べます。`,
    tags: ["共有", "禁止", "重要", "鑑定書"],
    priority: 14,
  },
  {
    id: "faq-010",
    category: "name_mismatch",
    question: "なぜ他の人のカードがプリントされて生成されてしまうのか",
    answer: `技術的な原因:

1. デバイス識別の問題: 同じデバイス（スマホ・PC）から診断すると、システムが同じ人と認識する可能性があります

2. IPアドレスの共有: 同じWi-Fiやネットワークからアクセスすると、IPアドレスが同じになり、混同されることがあります

3. ブラウザキャッシュ: 以前の診断データがブラウザに残っていると、新しい診断と混ざることがあります

解決策:
- 別のデバイスで診断する（最も確実）
- 別のブラウザを使う（Chrome → Safari、Safari → Chrome）
- シークレットモードで診断する
- ブラウザのキャッシュをクリアする

ご不便をおかけして申し訳ございません。`,
    tags: ["名前", "バグ", "原因", "技術", "カード", "生成"],
    priority: 12,
  },
  {
    id: "faq-011",
    category: "card_issue",
    question: "iPhoneでカードを保存する方法",
    answer: `iPhoneでの保存方法:

方法1: ボタンから保存
1. 結果画面の「写真に保存」ボタンをタップ
2. 写真アプリに保存されます

方法2: 画像を長押し
1. カード画像を長押し
2. 「画像を保存」を選択
3. 写真アプリに保存されます

方法3: スクリーンショット
1. カードが表示されている状態で
2. 電源ボタン + 音量上ボタン（iPhone X以降）
3. または ホームボタン + 電源ボタン（iPhone 8以前）

保存後は、写真アプリの「最近追加された項目」から確認できます。`,
    tags: ["iPhone", "保存", "カード", "写真", "iOS"],
    priority: 11,
  },
  {
    id: "faq-012",
    category: "card_issue",
    question: "Androidでカードを保存する方法",
    answer: `Androidでの保存方法:

方法1: ボタンから保存
1. 結果画面の「写真に保存」ボタンをタップ
2. ギャラリーアプリに保存されます

方法2: 画像を長押し
1. カード画像を長押し
2. 「画像をダウンロード」または「画像を保存」を選択
3. ギャラリーアプリに保存されます

方法3: ブラウザのメニューから
1. カード画像を長押し
2. ブラウザのメニュー（3点リーダー）をタップ
3. 「画像を保存」を選択

保存後は、ギャラリーアプリの「ダウンロード」フォルダから確認できます。`,
    tags: ["Android", "保存", "カード", "写真", "ギャラリー"],
    priority: 10,
  },
  {
    id: "faq-013",
    category: "general",
    question: "診断に時間がかかる",
    answer: `診断は、AIがあなた専用の鑑定書を生成するため、少し時間がかかります。

通常の処理時間:
- 質問への回答: 約1-2分
- カード生成: 約30秒-1分
- 合計: 約2-3分程度

混雑時:
- より時間がかかることがあります（最大5分程度）
- しばらくお待ちください

タイムアウトした場合:
- ページを再読み込みしてください
- それでも解決しない場合は、サポートセンターへお問い合わせください`,
    tags: ["時間", "処理", "待機", "タイムアウト"],
    priority: 4,
  },
  {
    id: "faq-014",
    category: "card_issue",
    question: "カードの画像がぼやけている、画質が悪い",
    answer: `カードの画質について:

原因:
- スマホの画面サイズによって、表示が小さく見えることがあります
- 保存時に圧縮されることがあります

対処法:
1. PCで保存すると、より高画質で保存できます
2. 「写真に保存」ボタンから保存すると、高画質で保存されます
3. メールで受け取ると、元の画質で受け取れます

それでも画質が悪い場合:
- サポートセンターへお問い合わせください
- 再生成の対応をさせていただきます`,
    tags: ["カード", "画質", "ぼやける", "画像"],
    priority: 3,
  },
  {
    id: "faq-015",
    category: "general",
    question: "診断は無料ですか？",
    answer: `はい、診断は完全無料です。

夢タイプ診断ガチャは、きんまん先生の引き寄せノート講座の特典として提供されています。

診断で受け取れるもの:
- あなた専用の夢タイプ診断結果
- パーソナライズされたカード
- 鑑定書（メールで受け取ることも可能）

注意:
- 診断は1人1回限りです
- 他の人に共有しないでください

きんまん先生の引き寄せノート講座で、より詳しく学べます。`,
    tags: ["無料", "料金", "特典"],
    priority: 2,
  },
  {
    id: "faq-016",
    category: "general",
    question: "診断結果をSNSに投稿してもいいですか？",
    answer: `診断結果のSNS投稿について:

推奨しませんが、投稿される場合は：
- カード画像のみの投稿は可能です
- ただし、他の人に診断結果を共有しないでください
- あなた自身の結果として楽しんでください

注意:
- 診断結果はあなた専用のパーソナライズされた鑑定書です
- 他の人に共有すると、診断の意味が薄れてしまいます
- 大切なのは、あなた自身が結果を受け取り、行動することです

きんまん先生の引き寄せノート講座で、より詳しく学べます。`,
    tags: ["SNS", "投稿", "共有", "注意"],
    priority: 1,
  },
];

// FAQをテキストファイル形式に変換
function createFAQDocument(): string {
  let content = "# 夢タイプ診断ガチャ FAQ\n\n";
  content += "このドキュメントには、夢タイプ診断ガチャに関するよくある質問と回答が含まれています。\n\n";
  content += "---\n\n";

  for (const faq of faqData) {
    content += `## ${faq.question}\n\n`;
    content += `**カテゴリ**: ${faq.category}\n`;
    content += `**優先度**: ${faq.priority}\n`;
    content += `**タグ**: ${faq.tags.join(", ")}\n\n`;
    content += `### 回答\n\n${faq.answer}\n\n`;
    content += "---\n\n";
  }

  return content;
}

// 個別のFAQファイルを作成（メタデータフィルタリング用）
function createIndividualFAQFiles(): Array<{ filename: string; content: string; metadata: Record<string, string | number> }> {
  return faqData.map((faq) => ({
    filename: `${faq.id}.txt`,
    content: `質問: ${faq.question}\n\n回答:\n${faq.answer}\n\nカテゴリ: ${faq.category}\nタグ: ${faq.tags.join(", ")}`,
    metadata: {
      category: faq.category,
      priority: faq.priority,
      faq_id: faq.id,
    },
  }));
}

async function setupFileSearchStore() {
  console.log("🚀 Gemini File Search Store セットアップを開始します...\n");

  try {
    // 1. File Search Store を作成
    console.log("📁 File Search Store を作成中...");
    const fileSearchStore = await ai.fileSearchStores.create({
      config: { displayName: "dream-type-gacha-faq" },
    });
    console.log(`✅ Store 作成完了: ${fileSearchStore.name}\n`);

    // Store名を保存（後で使用するため）
    const storeName = fileSearchStore.name;

    // 一時ディレクトリを作成
    const tmpDir = path.join(process.cwd(), "tmp-faq-files");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    // 2. 統合FAQドキュメントをアップロード
    console.log("📤 統合FAQドキュメントをアップロード中...");
    const faqDocContent = createFAQDocument();
    const faqDocPath = path.join(tmpDir, "faq-all.txt");
    fs.writeFileSync(faqDocPath, faqDocContent, "utf-8");

    let operation = await ai.fileSearchStores.uploadToFileSearchStore({
      file: faqDocPath,
      fileSearchStoreName: storeName,
      config: {
        displayName: "FAQ統合ドキュメント",
      },
    });

    // アップロード完了を待機
    console.log("⏳ インデックス作成中...");
    const opName = (operation as { name?: string }).name;
    if (opName) {
      while (!operation.done) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        operation = await ai.operations.get({ operation: opName });
        console.log("  処理中...");
      }
    } else {
      // operation.name がない場合は少し待って続行
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    console.log("✅ 統合FAQドキュメントのアップロード完了\n");

    // 3. 個別FAQファイルをアップロード（メタデータ付き）
    console.log("📤 個別FAQファイルをアップロード中...\n");
    const individualFiles = createIndividualFAQFiles();

    for (const file of individualFiles) {
      const filePath = path.join(tmpDir, file.filename);
      fs.writeFileSync(filePath, file.content, "utf-8");

      console.log(`  📝 ${file.filename} をアップロード中...`);

      let fileOperation = await ai.fileSearchStores.uploadToFileSearchStore({
        file: filePath,
        fileSearchStoreName: storeName,
        config: {
          displayName: file.filename,
          customMetadata: [
            { key: "category", stringValue: file.metadata.category as string },
            { key: "priority", numericValue: file.metadata.priority as number },
            { key: "faq_id", stringValue: file.metadata.faq_id as string },
          ],
        },
      });

      // 完了を待機
      const fileOpName = (fileOperation as { name?: string }).name;
      if (fileOpName) {
        while (!fileOperation.done) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          fileOperation = await ai.operations.get({ operation: fileOpName });
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
      console.log(`  ✅ ${file.filename} 完了`);

      // レート制限対策
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // 一時ファイルをクリーンアップ
    console.log("\n🧹 一時ファイルをクリーンアップ中...");
    fs.rmSync(tmpDir, { recursive: true, force: true });

    console.log("\n✨ セットアップ完了！");
    console.log(`\n📌 File Search Store 名: ${storeName}`);
    console.log("\nこの名前を .env.local に追加してください:");
    console.log(`GEMINI_FILE_SEARCH_STORE_NAME=${storeName}`);

    // Store名を .env.local に追記
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, "utf-8");
      if (!envContent.includes("GEMINI_FILE_SEARCH_STORE_NAME")) {
        envContent += `\n# Gemini File Search Store\nGEMINI_FILE_SEARCH_STORE_NAME=${storeName}\n`;
        fs.writeFileSync(envPath, envContent, "utf-8");
        console.log("\n✅ .env.local に自動追記しました");
      }
    }

    return storeName;
  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
    throw error;
  }
}

// テスト検索
async function testFileSearch(storeName: string) {
  console.log("\n🔍 テスト検索を実行中...\n");

  const testQueries = [
    "診断は何回でもできますか？",
    "iPhoneでカードを保存する方法",
    "別の人の名前が表示される",
    "もう一度診断したい",
  ];

  for (const query of testQueries) {
    console.log(`\n📝 質問: "${query}"`);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: query,
        config: {
          tools: [
            {
              fileSearch: {
                fileSearchStoreNames: [storeName],
              },
            },
          ],
        },
      });

      console.log(`💬 回答: ${response.text?.substring(0, 200)}...`);
    } catch (error) {
      console.error(`❌ 検索エラー: ${error}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

// メイン実行
async function main() {
  try {
    const storeName = await setupFileSearchStore();
    await testFileSearch(storeName);
  } catch (error) {
    console.error("セットアップに失敗しました:", error);
    process.exit(1);
  }
}

main();
