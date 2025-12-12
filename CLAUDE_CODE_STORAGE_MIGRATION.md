# 🔧 Claude Code への指示: Supabase Storageへの画像マイグレーション

## 🚨 問題の概要

管理画面で**98%のユーザー（253件中249件）のカード画像が表示されない**問題。

| 項目 | 件数 | 割合 |
|------|------|------|
| card_image_url がある | 4件 | **1.6%** |
| card_image_base64 のみ | 32件 | 12% |
| どちらもない | 221件 | 86% |

**原因**: 
1. Base64データはDBに保存されているが、サイズが大きすぎて（1件あたり約1MB）APIレスポンスやダウンロードがタイムアウト
2. Supabase Storageへのアップロードが失敗している（バケットがない、または権限の問題）

## 🎯 解決策

**Supabase Storageを使って画像をURLで参照できるようにする**

1. Supabase Storageバケットを作成
2. 既存のBase64データをStorageにアップロードするマイグレーションスクリプトを実行
3. 今後のカード生成でも自動的にStorageにアップロード

## 📋 実施手順

### ステップ1: Supabase Storageバケットの確認・作成

Supabaseダッシュボード（https://supabase.com/dashboard）で：

1. **Storage** セクションを開く
2. **card-images** バケットが存在するか確認
3. 存在しない場合は作成：
   - バケット名: `card-images`
   - Public bucket: **ON**（公開アクセス可能）

または、SQLで作成：

```sql
-- バケット作成（存在しない場合）
INSERT INTO storage.buckets (id, name, public)
VALUES ('card-images', 'card-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 公開読み取りポリシーを追加
CREATE POLICY IF NOT EXISTS "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'card-images');

-- 認証済みユーザーのアップロードを許可
CREATE POLICY IF NOT EXISTS "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'card-images');
```

### ステップ2: マイグレーションスクリプトの作成

**ファイル**: `scripts/migrate-images-to-storage.ts`

```typescript
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

      // ファイル名を生成
      const fileName = `${record.id}-${encodeURIComponent(record.user_name)}-${record.dream_type}.png`;

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
```

### ステップ3: マイグレーションスクリプトを実行

```bash
cd /Users/okajima/引き寄せノート講座ローンチプロジェクト/dream-type-gacha

# dotenvをインストール（未インストールの場合）
npm install dotenv

# マイグレーション実行
npx tsx scripts/migrate-images-to-storage.ts
```

### ステップ4: カード生成APIの確認・修正

`src/app/api/generate-card-gemini/route.ts`の`uploadCardImage`関数が正しく動作しているか確認。

もしバケットが存在しない場合に自動作成するロジックを追加：

```typescript
async function uploadCardImage(imageBuffer: Buffer, userName: string, dreamType: string): Promise<string | null> {
  const fileName = `${Date.now()}-${encodeURIComponent(userName)}-${dreamType}.png`;
  const client = adminSupabase || supabase;
  
  if (!client) {
    console.error("❌ Supabaseクライアントが未初期化");
    return null;
  }

  try {
    // バケット存在確認・作成
    const { data: buckets } = await client.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.id === "card-images");
    
    if (!bucketExists) {
      console.log("📦 card-images バケットを作成中...");
      await client.storage.createBucket("card-images", { public: true });
    }

    // アップロード
    const { error: uploadError } = await client.storage
      .from("card-images")
      .upload(fileName, imageBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("❌ アップロードエラー:", uploadError.message);
      return null;
    }

    // 公開URLを取得
    const { data: urlData } = client.storage
      .from("card-images")
      .getPublicUrl(fileName);

    console.log("✅ 画像アップロード完了:", urlData.publicUrl);
    return urlData.publicUrl;

  } catch (error) {
    console.error("❌ uploadCardImage エラー:", error);
    return null;
  }
}
```

### ステップ5: 管理画面でURLを優先的に使用

`src/app/admin/page.tsx`のサムネイル表示で、URLがあればそれを優先的に使用するように確認。

現在の実装で問題なければそのまま。

### ステップ6: ビルド・デプロイ

```bash
cd /Users/okajima/引き寄せノート講座ローンチプロジェクト/dream-type-gacha
npm run build
vercel --prod
```

## 🔍 確認方法

1. **マイグレーション後の確認**
   ```sql
   SELECT 
     COUNT(*) as total,
     COUNT(card_image_url) as with_url,
     COUNT(card_image_base64) as with_base64
   FROM generation_logs
   WHERE success = true;
   ```

2. **管理画面で確認**
   - `/admin` → 「全診断一覧」タブ
   - サムネイルが表示されることを確認
   - 拡大ボタンで画像が表示されることを確認
   - ダウンロードが正常に動作することを確認

## 🎯 期待される結果

- ✅ すべてのユーザーのカード画像がサムネイルに表示される
- ✅ 拡大モーダルで画像が即座に表示される
- ✅ ダウンロードが正常に動作する
- ✅ APIレスポンスが軽量（URLのみ返す）
- ✅ 今後のカード生成でも自動的にStorageにアップロード

## ⚠️ 注意事項

1. **SUPABASE_SERVICE_ROLE_KEY**が設定されていることを確認
2. マイグレーションには時間がかかる可能性がある（1件あたり約100ms）
3. Supabase Storageの容量制限を確認（無料プランは1GB）
4. バケットのポリシーが正しく設定されていることを確認

## 📊 データサイズの見積もり

- Base64データ: 約1MB/件
- PNG画像: 約750KB/件（Base64より小さい）
- 32件のBase64がある場合: 約24MBのストレージ使用

---

**この指示書をClaude Codeに渡して、Supabase Storageへのマイグレーションを実行してください。**

