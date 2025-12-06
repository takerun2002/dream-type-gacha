/**
 * テスト用診断レコードのクリアスクリプト
 * Supabaseからテストレコードを削除
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("⚠️ Supabaseが設定されていません。ローカルストレージのみクリアが必要です。");
  console.log("\n📋 ブラウザで以下のコードを実行してください：");
  console.log("----------------------------------------");
  console.log(`localStorage.removeItem('dream_diagnosis_completed');
localStorage.removeItem('dream_diagnosis_fp');
sessionStorage.clear();
console.log('✅ ローカルストレージをクリアしました');`);
  console.log("----------------------------------------");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearRecentRecords() {
  console.log("🗑️ Supabaseの診断レコードを確認中...\n");

  try {
    // 最新10件のレコードを取得
    const { data: records, error: fetchError } = await supabase
      .from("diagnosis_records")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (fetchError) {
      console.error("❌ レコード取得エラー:", fetchError.message);
      return;
    }

    if (!records || records.length === 0) {
      console.log("📭 診断レコードがありません。");
      return;
    }

    console.log(`📋 最新の診断レコード（${records.length}件）:`);
    records.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.user_name} (${r.dream_type}) - ${new Date(r.created_at).toLocaleString('ja-JP')}`);
    });

    // 最新のレコードを削除
    const latestRecord = records[0];
    console.log(`\n🗑️ 最新のレコードを削除中: ${latestRecord.user_name}...`);

    const { error: deleteError } = await supabase
      .from("diagnosis_records")
      .delete()
      .eq("id", latestRecord.id);

    if (deleteError) {
      console.error("❌ 削除エラー:", deleteError.message);
      return;
    }

    console.log("✅ Supabaseレコード削除完了！\n");

  } catch (error) {
    console.error("❌ エラー:", error);
  }

  console.log("📋 次に、ブラウザのコンソールで以下を実行してください：");
  console.log("----------------------------------------");
  console.log(`localStorage.removeItem('dream_diagnosis_completed');
localStorage.removeItem('dream_diagnosis_fp');
sessionStorage.clear();
location.reload();`);
  console.log("----------------------------------------");
}

clearRecentRecords();

