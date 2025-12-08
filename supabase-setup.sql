-- ============================================
-- 夢タイプ診断ガチャ - Supabase テーブル作成
-- ============================================

-- 診断記録テーブル
CREATE TABLE IF NOT EXISTS diagnosis_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  dream_type TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_agent TEXT,
  card_image_url TEXT,
  card_image_base64 TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 既存テーブルにカラムを追加（既に存在する場合）
ALTER TABLE diagnosis_records ADD COLUMN IF NOT EXISTS card_image_url TEXT;
ALTER TABLE diagnosis_records ADD COLUMN IF NOT EXISTS card_image_base64 TEXT;

-- インデックス（検索高速化）
CREATE INDEX IF NOT EXISTS idx_diagnosis_fingerprint ON diagnosis_records(fingerprint);
CREATE INDEX IF NOT EXISTS idx_diagnosis_ip ON diagnosis_records(ip_address);
CREATE INDEX IF NOT EXISTS idx_diagnosis_created_at ON diagnosis_records(created_at);

-- RLS（Row Level Security）有効化
ALTER TABLE diagnosis_records ENABLE ROW LEVEL SECURITY;

-- 挿入ポリシー（誰でも挿入可能）
DROP POLICY IF EXISTS "Allow insert for all" ON diagnosis_records;
CREATE POLICY "Allow insert for all" ON diagnosis_records
  FOR INSERT
  WITH CHECK (true);

-- 読み取りポリシー（誰でも読み取り可能）
DROP POLICY IF EXISTS "Allow read for all" ON diagnosis_records;
CREATE POLICY "Allow read for all" ON diagnosis_records
  FOR SELECT
  USING (true);

-- 更新ポリシー（誰でも更新可能）
DROP POLICY IF EXISTS "Allow update for all" ON diagnosis_records;
CREATE POLICY "Allow update for all" ON diagnosis_records
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 生成ログテーブル（カード画像生成の記録）
-- ============================================
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

-- 既存テーブルにカラムを追加（既に存在する場合）
ALTER TABLE generation_logs ADD COLUMN IF NOT EXISTS card_image_url TEXT;
ALTER TABLE generation_logs ADD COLUMN IF NOT EXISTS card_image_base64 TEXT;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_generation_logs_user ON generation_logs(user_name);
CREATE INDEX IF NOT EXISTS idx_generation_logs_created ON generation_logs(created_at);

-- RLS有効化
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;

-- 挿入ポリシー（誰でも挿入可能）
DROP POLICY IF EXISTS "Allow insert for all" ON generation_logs;
CREATE POLICY "Allow insert for all" ON generation_logs
  FOR INSERT
  WITH CHECK (true);

-- 読み取りポリシー（誰でも読み取り可能）
DROP POLICY IF EXISTS "Allow read for all" ON generation_logs;
CREATE POLICY "Allow read for all" ON generation_logs
  FOR SELECT
  USING (true);

-- 更新ポリシー（誰でも更新可能）
DROP POLICY IF EXISTS "Allow update for all" ON generation_logs;
CREATE POLICY "Allow update for all" ON generation_logs
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 使い方：
-- 1. Supabase Dashboard → SQL Editor
-- 2. このSQLを貼り付けて実行
-- ============================================
















