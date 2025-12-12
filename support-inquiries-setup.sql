-- support_inquiries テーブル作成
-- サポート問い合わせログを蓄積するためのテーブル

CREATE TABLE IF NOT EXISTS support_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_name TEXT,
  dream_type TEXT,
  fingerprint TEXT,
  issue_summary TEXT NOT NULL,
  conversation JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  resolved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_support_inquiries_status ON support_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_support_inquiries_created_at ON support_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_inquiries_user_name ON support_inquiries(user_name);

-- RLS (Row Level Security) ポリシー
-- 注意: 本番環境ではRLSを有効にし、適切なポリシーを設定してください

-- テーブルにコメント追加
COMMENT ON TABLE support_inquiries IS 'サポート問い合わせログ（RASチャットからの報告）';
COMMENT ON COLUMN support_inquiries.status IS '問い合わせ状態: open=未対応, in_progress=対応中, resolved=解決済み';
COMMENT ON COLUMN support_inquiries.conversation IS 'RASチャットとの会話履歴（JSONB形式）';
