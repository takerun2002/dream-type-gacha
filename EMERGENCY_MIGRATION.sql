-- ============================================
-- 緊急マイグレーション: カード画像保存問題の修正
-- このSQLをSupabase Dashboard → SQL Editorで実行してください
-- ============================================

-- 1. diagnosis_records テーブルにカラム追加
ALTER TABLE diagnosis_records ADD COLUMN IF NOT EXISTS card_image_url TEXT;
ALTER TABLE diagnosis_records ADD COLUMN IF NOT EXISTS card_image_base64 TEXT;

-- 2. generation_logs テーブルを作成（存在しない場合）
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

-- 3. generation_logs テーブルにカラム追加（既存の場合）
ALTER TABLE generation_logs ADD COLUMN IF NOT EXISTS card_image_url TEXT;
ALTER TABLE generation_logs ADD COLUMN IF NOT EXISTS card_image_base64 TEXT;

-- 4. インデックス作成
CREATE INDEX IF NOT EXISTS idx_generation_logs_user ON generation_logs(user_name);
CREATE INDEX IF NOT EXISTS idx_generation_logs_created ON generation_logs(created_at);

-- 5. RLS有効化（generation_logs）
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;

-- 6. ポリシー設定（generation_logs）
DROP POLICY IF EXISTS "Allow insert for all" ON generation_logs;
CREATE POLICY "Allow insert for all" ON generation_logs
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read for all" ON generation_logs;
CREATE POLICY "Allow read for all" ON generation_logs
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow update for all" ON generation_logs;
CREATE POLICY "Allow update for all" ON generation_logs
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 7. ポリシー設定（diagnosis_records - UPDATEを追加）
DROP POLICY IF EXISTS "Allow update for all" ON diagnosis_records;
CREATE POLICY "Allow update for all" ON diagnosis_records
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 実行後の確認クエリ
-- ============================================
-- テーブル構造確認
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'generation_logs';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'diagnosis_records';

-- ポリシー確認
-- SELECT * FROM pg_policies WHERE tablename IN ('generation_logs', 'diagnosis_records');
