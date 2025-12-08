# 🚨 緊急修正指示 - カード画像が全く表示されない問題

## 🔴 根本原因（特定済み）

**データベーススキーマの不備：**
1. `generation_logs` テーブルが存在しない
2. `diagnosis_records` テーブルに `card_image_url` と `card_image_base64` カラムがない
3. RLSの UPDATE ポリシーがない

## 🚀 緊急対応手順（3ステップ）

### ステップ1: データベースマイグレーション実行（最優先）

1. **Supabase Dashboard** を開く
2. **SQL Editor** に移動
3. `EMERGENCY_MIGRATION.sql` の内容をコピー＆実行

```sql
-- このSQLを実行してください（EMERGENCY_MIGRATION.sql の内容）

-- 1. diagnosis_records テーブルにカラム追加
ALTER TABLE diagnosis_records ADD COLUMN IF NOT EXISTS card_image_url TEXT;
ALTER TABLE diagnosis_records ADD COLUMN IF NOT EXISTS card_image_base64 TEXT;

-- 2. generation_logs テーブルを作成
CREATE TABLE IF NOT EXISTS generation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL,
  dream_type TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  api_used TEXT,
  card_image_url TEXT,
  card_image_base64 TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS有効化とポリシー設定
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert for all" ON generation_logs;
CREATE POLICY "Allow insert for all" ON generation_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read for all" ON generation_logs;
CREATE POLICY "Allow read for all" ON generation_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update for all" ON generation_logs;
CREATE POLICY "Allow update for all" ON generation_logs FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for all" ON diagnosis_records;
CREATE POLICY "Allow update for all" ON diagnosis_records FOR UPDATE USING (true) WITH CHECK (true);
```

### ステップ2: Vercel環境変数確認

Vercel Dashboard → Settings → Environment Variables で確認：

- [ ] `SUPABASE_SERVICE_ROLE_KEY` が設定されている
- [ ] すべての環境（Production, Preview, Development）に設定されている

### ステップ3: コードをデプロイ

```bash
cd /Users/okajima/引き寄せノート講座ローンチプロジェクト/dream-type-gacha
npm run build
git add -A
git commit -m "fix: カード画像保存のデバッグログ追加"
git push origin main
```

## ✅ 修正内容（完了済み）

### コード修正
- `src/app/api/generate-card-gemini/route.ts`:
  - Supabaseクライアント初期化状態のログ追加
  - `logGeneration()` 関数のデバッグログ強化
  - どのクライアント（adminSupabase/supabase）が使われているか表示
  - INSERT/UPDATE の詳細なエラー情報出力

### SQLスキーマ修正
- `supabase-setup.sql`: 完全なスキーマに更新
- `EMERGENCY_MIGRATION.sql`: 緊急マイグレーション用SQL新規作成

## 📋 確認チェックリスト

- [x] `logGeneration()` 関数に `card_image_base64` パラメータがある
- [x] `logGeneration()` 内で `card_image_base64` が payload に含まれている
- [x] デバッグログが追加されている
- [ ] **Supabase で SQL マイグレーション実行**
- [ ] **Vercel に `SUPABASE_SERVICE_ROLE_KEY` が設定されている**
- [ ] **デプロイ後にテスト実行**

## 🔍 デプロイ後の確認方法

1. 新しい診断を実行
2. Vercel Functions Logs を確認
3. 以下のログが出力されていることを確認：
   ```
   🔍 Supabase初期化状態: supabase=true, adminSupabase=true
   🔍 使用クライアント: adminSupabase(service_role)
   📦 Base64データサイズ: XXXXX 文字
   ✅ generation_logs Insert 成功
   ✅ diagnosis_records 更新成功
   ```

---

**優先度**: 🔴🔴🔴 最高（顧客クレーム対応中）
**期限**: 即座に対応


