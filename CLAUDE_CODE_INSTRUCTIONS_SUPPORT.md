# Claude Code 指示書: サポートシステム強化

## 📋 概要

夢タイプ診断ガチャアプリのサポートシステムを強化する。
以下3つの課題を解決する実装を行ってください。

---

## 🎯 課題1: カード画像の永続化

### 現状の問題
- ユーザーがページを離れるとカード画像が見れなくなる
- FAL AI/Geminiの生成画像は一時URLなので期限切れになる
- `localStorage`にURLを保存しているが、URL自体が無効になる

### 実装要件
1. **生成時にBase64も保存**: 画像生成時にBase64形式でもlocalStorageに保存する
2. **Supabase Storage永続化**: 可能であればSupabase Storageにも保存
3. **復元ロジック強化**: ページ再アクセス時に以下の順序で復元を試みる
   - localStorage (Base64)
   - Supabase Storage
   - 再生成プロンプト

### 対象ファイル
- `src/app/result/page.tsx` - カード表示・保存ロジック
- `src/lib/cardGeneratorGemini.ts` - カード生成関数
- `src/app/api/generate-card-gemini/route.ts` - サーバーサイド生成

---

## 🎯 課題2: Webhook通知連携（サポートエスカレーション）

### 現状の問題
- RASくんは質問応答のみで、解決できない問題のエスカレーションができない
- サポート担当への通知手段がない

### 実装要件
1. **サポート報告ボタン追加**: RASチャットに「サポートに報告」ボタンを追加
2. **Webhook送信API作成**: 問い合わせ内容をWebhookで外部に送信
3. **報告フォーム**: ユーザー情報（名前・夢タイプ・問い合わせ内容）を含める
4. **報告完了UI**: 「報告しました」のフィードバック表示

### Webhook送信先（環境変数で設定可能に）
```
SUPPORT_WEBHOOK_URL=（後で設定）
```

### 送信データ形式
```json
{
  "type": "support_request",
  "timestamp": "2025-12-12T12:00:00Z",
  "user": {
    "name": "岡島武尊",
    "dreamType": "phoenix",
    "fingerprint": "xxx"
  },
  "conversation": [
    { "role": "user", "content": "カード保存ができません" },
    { "role": "assistant", "content": "申し訳ありません..." }
  ],
  "issue": "カード画像の保存エラー",
  "severity": "medium"
}
```

### 新規作成ファイル
- `src/app/api/support/webhook/route.ts` - Webhook送信API

### 変更ファイル
- `src/components/RASChatBot.tsx` - 報告ボタン追加

---

## 🎯 課題3: 問い合わせログ蓄積（PDCA改善用）

### 現状の問題
- 問い合わせ内容が蓄積されていない
- どんな問題が多いか把握できない

### 実装要件
1. **Supabaseテーブル作成**: `support_inquiries` テーブル
2. **問い合わせ保存**: Webhook送信と同時にDBにも保存
3. **管理画面表示**: 管理ダッシュボードに問い合わせ一覧を追加

### テーブル定義
```sql
CREATE TABLE support_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_name TEXT,
  dream_type TEXT,
  fingerprint TEXT,
  issue_summary TEXT,
  conversation JSONB,
  status TEXT DEFAULT 'open', -- open, in_progress, resolved
  resolved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);
```

### 変更ファイル
- `src/app/api/admin/stats/route.ts` - 問い合わせ統計追加
- `src/app/admin/page.tsx` - 問い合わせ一覧タブ追加

---

## 🔧 実装優先順位

1. **課題2（Webhook通知）** - 最優先、サポート対応の即応性向上
2. **課題3（ログ蓄積）** - Webhook実装と同時に進める
3. **課題1（画像永続化）** - 技術的に複雑なので後回し可

---

## 🚀 実装手順

### Step 1: Webhook送信API作成
```bash
# 新規ファイル作成
touch src/app/api/support/webhook/route.ts
```

### Step 2: RASチャットに報告ボタン追加
`src/components/RASChatBot.tsx` に以下を追加:
- 「サポートに報告する」ボタン（チャット下部）
- 報告確認モーダル
- 送信成功/失敗フィードバック

### Step 3: 問い合わせログテーブル作成
Supabase MCPまたはダッシュボードで `support_inquiries` テーブル作成

### Step 4: 管理画面に問い合わせタブ追加
`src/app/admin/page.tsx` に問い合わせ一覧表示を追加

---

## 📝 環境変数（.env.local に追加）

```
# サポートWebhook URL（Slack, Discord, UTAGE等）
SUPPORT_WEBHOOK_URL=https://example.com/webhook

# 通知設定（任意）
SUPPORT_NOTIFY_EMAIL=support@example.com
```

---

## ✅ 完了条件

1. RASチャットから「サポートに報告」ができる
2. 報告内容がWebhookで外部に送信される
3. 報告内容がSupabase DBに保存される
4. 管理画面で問い合わせ一覧が確認できる
5. （オプション）カード画像がページ離脱後も復元できる

---

## 🔍 テスト手順

1. RASチャットを開く
2. 何か質問する
3. 「サポートに報告する」ボタンをクリック
4. 報告内容を確認して送信
5. 管理画面 `/admin` で問い合わせが記録されていることを確認
6. Webhookが正常に送信されていることを確認

---

## 📌 備考

- Webhook URLは後で設定するので、環境変数がない場合はログ出力のみでエラーにしない
- モバイル対応を意識したUI設計
- エラーハンドリングを丁寧に（ユーザーにわかりやすいメッセージ）

