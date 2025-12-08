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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス（検索高速化）
CREATE INDEX IF NOT EXISTS idx_diagnosis_fingerprint ON diagnosis_records(fingerprint);
CREATE INDEX IF NOT EXISTS idx_diagnosis_ip ON diagnosis_records(ip_address);
CREATE INDEX IF NOT EXISTS idx_diagnosis_created_at ON diagnosis_records(created_at);

-- RLS（Row Level Security）有効化
ALTER TABLE diagnosis_records ENABLE ROW LEVEL SECURITY;

-- 挿入ポリシー（誰でも挿入可能）
CREATE POLICY "Allow insert for all" ON diagnosis_records
  FOR INSERT
  WITH CHECK (true);

-- 読み取りポリシー（誰でも読み取り可能）
CREATE POLICY "Allow read for all" ON diagnosis_records
  FOR SELECT
  USING (true);

-- ============================================
-- 使い方：
-- 1. Supabase Dashboard → SQL Editor
-- 2. このSQLを貼り付けて実行
-- ============================================















