/**
 * 初期FAQデータ投入スクリプト
 * よくある質問を事前に登録してRAGの精度を上げる
 */

import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const geminiApiKey = process.env.GEMINI_API_KEY_SUPPORT || process.env.GEMINI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const genAI = new GoogleGenerativeAI(geminiApiKey);

// 初期FAQデータ
const initialFAQs = [
  {
    category: "name_mismatch",
    question: "別の人の名前が表示される",
    answer: "共有デバイスで診断した可能性があります。\n\n対処法:\n1. 別のブラウザまたは端末でお試しください\n2. ブラウザのキャッシュをクリアしてください\n3. それでも解決しない場合は、サポートセンターへお問い合わせください",
    tags: ["名前", "バグ", "共有デバイス"],
    priority: 10,
  },
  {
    category: "card_issue",
    question: "カードが生成されない、表示されない",
    answer: "混雑時は生成に時間がかかることがあります。\n\n対処法:\n1. しばらくお待ちください（最大1-2分）\n2. ページを再読み込みしてください\n3. 別のブラウザでお試しください\n\nそれでも解決しない場合は、サポートセンターへお問い合わせください。",
    tags: ["カード", "生成", "表示"],
    priority: 9,
  },
  {
    category: "general",
    question: "もう一度診断したい",
    answer: "診断は1人1回限りとなっております。\n\n別の結果が欲しい場合は:\n1. 別のブラウザまたは端末でお試しください\n2. サポートセンターへお問い合わせください\n\n※ 同じデバイスでは再診断できません",
    tags: ["再診断", "制限"],
    priority: 8,
  },
  {
    category: "card_issue",
    question: "カードの保存方法",
    answer: "結果画面の「写真に保存」ボタンをタップしてください。\n\nまたは:\n1. カード画像を長押し\n2. 「画像を保存」を選択\n\n※ メールで受け取ることもできます",
    tags: ["カード", "保存", "ダウンロード"],
    priority: 7,
  },
  {
    category: "general",
    question: "診断結果がおかしい",
    answer: "診断結果は、四柱推命・九星気学・数秘術を組み合わせたAI診断です。\n\n結果についてのご質問は:\n1. サポートセンターへお問い合わせください\n2. きんまん先生の引き寄せノート講座で詳しく解説されています",
    tags: ["診断", "結果", "質問"],
    priority: 6,
  },
  {
    category: "bug",
    question: "エラーが出る",
    answer: "一時的なエラーの可能性があります。\n\n対処法:\n1. ページを再読み込みしてください\n2. ブラウザのキャッシュをクリアしてください\n3. 別のブラウザでお試しください\n\nエラーが続く場合は、サポートセンターへお問い合わせください。",
    tags: ["エラー", "不具合"],
    priority: 5,
  },
  {
    category: "general",
    question: "メールで鑑定書を受け取れない",
    answer: "メールが届かない場合:\n1. 迷惑メールフォルダを確認してください\n2. メールアドレスが正しいか確認してください\n3. 数分待ってから再度お試しください\n\nそれでも届かない場合は、サポートセンターへお問い合わせください。",
    tags: ["メール", "鑑定書", "受信"],
    priority: 4,
  },
  // 追加FAQ（残り9件）
  {
    category: "general",
    question: "診断は何回でもできますか？",
    answer: "❌ いいえ、診断は**おひとり様1回限り**となっております。\n\n⚠️ **重要**: 他の人に診断結果を共有したり、複数回診断することはできません。\n\n同じデバイス・同じブラウザでは再診断できませんので、ご注意ください。\n\n別の結果が欲しい場合は、サポートセンターへお問い合わせください。",
    tags: ["診断", "制限", "1回限り", "再診断", "重要"],
    priority: 15,
  },
  {
    category: "general",
    question: "診断結果を他の人に共有してもいいですか？",
    answer: "❌ **他の人に共有しないでください。**\n\n診断結果は、あなた専用のパーソナライズされた鑑定書です。\n\n他の人に共有すると:\n- 診断の意味が薄れてしまいます\n- あなた自身の引き寄せの力が弱まる可能性があります\n\n**大切なのは、あなた自身が結果を受け取り、行動することです。**\n\nきんまん先生の引き寄せノート講座で、より詳しく学べます。",
    tags: ["共有", "禁止", "重要", "鑑定書"],
    priority: 14,
  },
  {
    category: "name_mismatch",
    question: "なぜ他の人のカードがプリントされて生成されてしまうのか",
    answer: "**技術的な原因**:\n\n1. **デバイス識別の問題**: 同じデバイス（スマホ・PC）から診断すると、システムが同じ人と認識する可能性があります\n\n2. **IPアドレスの共有**: 同じWi-Fiやネットワークからアクセスすると、IPアドレスが同じになり、混同されることがあります\n\n3. **ブラウザキャッシュ**: 以前の診断データがブラウザに残っていると、新しい診断と混ざることがあります\n\n**解決策**:\n- ✅ **別のデバイスで診断する**（最も確実）\n- ✅ **別のブラウザを使う**（Chrome → Safari、Safari → Chrome）\n- ✅ **シークレットモードで診断する**\n- ✅ **ブラウザのキャッシュをクリアする**\n\nご不便をおかけして申し訳ございません。",
    tags: ["名前", "バグ", "原因", "技術", "カード", "生成"],
    priority: 12,
  },
  {
    category: "card_issue",
    question: "iPhoneでカードを保存する方法",
    answer: "📱 **iPhoneでの保存方法**:\n\n**方法1: ボタンから保存**\n1. 結果画面の「写真に保存」ボタンをタップ\n2. 写真アプリに保存されます\n\n**方法2: 画像を長押し**\n1. カード画像を長押し\n2. 「画像を保存」を選択\n3. 写真アプリに保存されます\n\n**方法3: スクリーンショット**\n1. カードが表示されている状態で\n2. 電源ボタン + 音量上ボタン（iPhone X以降）\n3. または ホームボタン + 電源ボタン（iPhone 8以前）\n\n保存後は、写真アプリの「最近追加された項目」から確認できます。",
    tags: ["iPhone", "保存", "カード", "写真", "iOS"],
    priority: 11,
  },
  {
    category: "card_issue",
    question: "Androidでカードを保存する方法",
    answer: "📱 **Androidでの保存方法**:\n\n**方法1: ボタンから保存**\n1. 結果画面の「写真に保存」ボタンをタップ\n2. ギャラリーアプリに保存されます\n\n**方法2: 画像を長押し**\n1. カード画像を長押し\n2. 「画像をダウンロード」または「画像を保存」を選択\n3. ギャラリーアプリに保存されます\n\n**方法3: ブラウザのメニューから**\n1. カード画像を長押し\n2. ブラウザのメニュー（3点リーダー）をタップ\n3. 「画像を保存」を選択\n\n保存後は、ギャラリーアプリの「ダウンロード」フォルダから確認できます。",
    tags: ["Android", "保存", "カード", "写真", "ギャラリー"],
    priority: 10,
  },
  {
    category: "general",
    question: "診断に時間がかかる",
    answer: "診断は、AIがあなた専用の鑑定書を生成するため、少し時間がかかります。\n\n**通常の処理時間**:\n- 質問への回答: 約1-2分\n- カード生成: 約30秒-1分\n- 合計: 約2-3分程度\n\n**混雑時**:\n- より時間がかかることがあります（最大5分程度）\n- しばらくお待ちください\n\n**タイムアウトした場合**:\n- ページを再読み込みしてください\n- それでも解決しない場合は、サポートセンターへお問い合わせください",
    tags: ["時間", "処理", "待機", "タイムアウト"],
    priority: 4,
  },
  {
    category: "card_issue",
    question: "カードの画像がぼやけている、画質が悪い",
    answer: "カードの画質について：\n\n**原因**:\n- スマホの画面サイズによって、表示が小さく見えることがあります\n- 保存時に圧縮されることがあります\n\n**対処法**:\n1. **PCで保存する**と、より高画質で保存できます\n2. **「写真に保存」ボタンから保存**すると、高画質で保存されます\n3. **メールで受け取る**と、元の画質で受け取れます\n\n**それでも画質が悪い場合**:\n- サポートセンターへお問い合わせください\n- 再生成の対応をさせていただきます",
    tags: ["カード", "画質", "ぼやける", "画像"],
    priority: 3,
  },
  {
    category: "general",
    question: "診断は無料ですか？",
    answer: "✅ **はい、診断は完全無料です。**\n\n夢タイプ診断ガチャは、**きんまん先生の引き寄せノート講座の特典**として提供されています。\n\n**診断で受け取れるもの**:\n- あなた専用の夢タイプ診断結果\n- パーソナライズされたカード\n- 鑑定書（メールで受け取ることも可能）\n\n**注意**:\n- 診断は1人1回限りです\n- 他の人に共有しないでください\n\nきんまん先生の引き寄せノート講座で、より詳しく学べます。",
    tags: ["無料", "料金", "特典"],
    priority: 2,
  },
  {
    category: "general",
    question: "診断結果をSNSに投稿してもいいですか？",
    answer: "⚠️ **診断結果のSNS投稿について**:\n\n**推奨しません**が、投稿される場合は：\n- カード画像のみの投稿は可能です\n- ただし、**他の人に診断結果を共有しないでください**\n- あなた自身の結果として楽しんでください\n\n**注意**:\n- 診断結果はあなた専用のパーソナライズされた鑑定書です\n- 他の人に共有すると、診断の意味が薄れてしまいます\n- 大切なのは、あなた自身が結果を受け取り、行動することです\n\nきんまん先生の引き寄せノート講座で、より詳しく学べます。",
    tags: ["SNS", "投稿", "共有", "注意"],
    priority: 1,
  },
];

async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Embedding error:", error);
    return null;
  }
}

async function seedFAQs() {
  console.log("🌱 FAQデータを投入中...\n");

  for (const faq of initialFAQs) {
    console.log(`📝 ${faq.question} を処理中...`);
    
    // ベクトル化（質問+回答を組み合わせて）
    const embedding = await generateEmbedding(`${faq.question} ${faq.answer}`);
    
    if (!embedding) {
      console.log("  ⚠️ ベクトル化に失敗しました");
      continue;
    }

    // Supabaseに挿入
    const { data, error } = await supabase
      .from("faq_items")
      .insert({
        category: faq.category,
        question: faq.question,
        answer: faq.answer,
        tags: faq.tags,
        priority: faq.priority,
        embedding,
      })
      .select()
      .single();

    if (error) {
      console.log(`  ❌ エラー: ${error.message}`);
    } else {
      console.log(`  ✅ 登録完了: ${data.id}`);
    }

    // APIレート制限考慮
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log("\n✨ FAQデータ投入完了！");
}

// 実行
seedFAQs().catch(console.error);



