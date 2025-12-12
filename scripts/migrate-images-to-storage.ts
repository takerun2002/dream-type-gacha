/**
 * Base64画像データをSupabase Storageにマイグレーションするスクリプト
 *
 * 使用方法:
 * npx tsx scripts/migrate-images-to-storage.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ 環境変数が設定されていません");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "設定済み" : "未設定");
  console.error("SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "設定済み" : "未設定");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log("🚀 画像マイグレーション開始\n");

  // 1. バケットの確認・作成
  console.log("📦 バケット確認中...");
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

  if (bucketError) {
    console.error("❌ バケット一覧取得エラー:", bucketError.message);
    return;
  }

  const cardImagesBucket = buckets.find(b => b.id === "card-images");

  if (!cardImagesBucket) {
    console.log("📦 card-images バケットを作成中...");
    const { error: createError } = await supabase.storage.createBucket("card-images", {
      public: true,
    });

    if (createError) {
      console.error("❌ バケット作成エラー:", createError.message);
      return;
    }
    console.log("✅ バケット作成完了");
  } else {
    console.log("✅ card-images バケットは存在します");
  }

  // 2. Base64データを持つがURLがないレコードを取得
  console.log("\n🔍 マイグレーション対象を検索中...");

  const { data: records, error: fetchError } = await supabase
    .from("generation_logs")
    .select("id, user_name, dream_type, card_image_base64, card_image_url")
    .eq("success", true)
    .not("card_image_base64", "is", null)
    .is("card_image_url", null);

  if (fetchError) {
    console.error("❌ レコード取得エラー:", fetchError.message);
    return;
  }

  console.log(`📊 マイグレーション対象: ${records?.length || 0}件\n`);

  if (!records || records.length === 0) {
    console.log("✅ マイグレーション対象がありません");
    return;
  }

  // 3. 各レコードをマイグレーション
  let successCount = 0;
  let errorCount = 0;

  for (const record of records) {
    try {
      console.log(`🔄 処理中: ${record.user_name} (ID: ${record.id})`);

      // Base64をBufferに変換
      const base64Data = record.card_image_base64;
      const buffer = Buffer.from(base64Data, "base64");

      // ファイル名を生成（日本語を避けてIDとdream_typeのみ）
      const fileName = `${record.id}-${record.dream_type}.png`;

      // Storageにアップロード
      const { error: uploadError } = await supabase.storage
        .from("card-images")
        .upload(fileName, buffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        console.error(`  ❌ アップロードエラー: ${uploadError.message}`);
        errorCount++;
        continue;
      }

      // 公開URLを取得
      const { data: urlData } = supabase.storage
        .from("card-images")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // generation_logsを更新
      const { error: updateError } = await supabase
        .from("generation_logs")
        .update({ card_image_url: publicUrl })
        .eq("id", record.id);

      if (updateError) {
        console.error(`  ❌ レコード更新エラー: ${updateError.message}`);
        errorCount++;
        continue;
      }

      console.log(`  ✅ 完了: ${publicUrl}`);
      successCount++;

      // レート制限対策
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`  ❌ 予期せぬエラー:`, error);
      errorCount++;
    }
  }

  // 4. 結果サマリー
  console.log("\n" + "=".repeat(50));
  console.log("📊 マイグレーション結果");
  console.log("=".repeat(50));
  console.log(`✅ 成功: ${successCount}件`);
  console.log(`❌ 失敗: ${errorCount}件`);
  console.log(`📊 合計: ${records.length}件`);
}

main().catch(console.error);
