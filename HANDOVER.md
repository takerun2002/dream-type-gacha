# 引き継ぎドキュメント - 夢タイプ診断ガチャ

## 📋 プロジェクト概要
- **プロジェクト名**: 夢タイプ診断ガチャ（きんまん先生）
- **技術スタック**: Next.js 14, TypeScript, Supabase, Gemini API, FAL AI
- **デプロイ先**: Vercel
- **リポジトリ**: https://github.com/takerun2002/dream-type-gacha

## 🚨 現在の緊急対応状況（2025-12-08）

### 問題
- 顧客から「生成されたカード画像が管理画面で見れない」というクレーム
- `card_image_url` が全て null で保存されていない

### 実装済みの対応
1. **Base64画像保存機能を追加**
   - `generation_logs` と `diagnosis_records` に `card_image_base64` カラムを追加済み
   - カード生成時に Base64 データも保存するように修正
   - Storage アップロードが失敗しても Base64 で表示可能

2. **管理画面の画像取得を強化**
   - `card_image_url` がない場合、`generation_logs` から Base64 を取得して補完
   - Base64 データ（`data:image/png;base64,...`）もそのまま表示可能

### 確認が必要な環境変数
- `SUPABASE_SERVICE_ROLE_KEY`: Vercel の Environment Variables に設定されているか確認
- 設定されていない場合、Storage アップロードが失敗する可能性あり

## 📁 主要ファイル構成

### API Routes
- `src/app/api/generate-card-gemini/route.ts`: カード画像生成API
  - Gemini API 優先、FAL AI フォールバック
  - Storage アップロード + Base64 保存の両方を実装
- `src/app/api/admin/stats/route.ts`: 管理画面用統計API
  - 診断記録取得時に `generation_logs` から画像データを補完
- `src/app/api/admin/clear-records/route.ts`: 診断記録削除API
- `src/app/api/queue/route.ts`: カード生成キュー管理

### フロントエンド
- `src/app/page.tsx`: メインページ（診断フロー）
- `src/app/result/page.tsx`: 結果表示ページ
- `src/app/admin/page.tsx`: 管理画面（パスワード: `kinmanadmin2025`）

### データベース（Supabase）
- `diagnosis_records`: 診断記録
  - `card_image_url` (text): Storage URL
  - `card_image_base64` (text): Base64 データ（新規追加）
- `generation_logs`: カード生成ログ
  - `card_image_url` (text): Storage URL
  - `card_image_base64` (text): Base64 データ（新規追加）
- `generation_queue`: 生成キュー管理

### Storage
- `cards` バケット: カード画像保存用（public）

## 🔧 トラブルシューティング

### 画像が表示されない場合
1. **Vercel の Functions ログを確認**
   - Deployments → 最新デプロイ → Functions → Logs
   - `📦` `📤` `❌` などのキーワードで検索
   - `Storage upload error` や `SUPABASE_SERVICE_ROLE_KEY` 関連のエラーを確認

2. **Supabase のデータ確認**
   ```sql
   -- 最新の生成ログを確認
   SELECT user_name, card_image_url, card_image_base64 IS NOT NULL as has_base64, created_at 
   FROM generation_logs 
   ORDER BY created_at DESC LIMIT 10;
   
   -- 診断記録の画像URL確認
   SELECT user_name, card_image_url, card_image_base64 IS NOT NULL as has_base64, created_at 
   FROM diagnosis_records 
   ORDER BY created_at DESC LIMIT 10;
   ```

3. **環境変数の確認**
   - Vercel Dashboard → Settings → Environment Variables
   - `SUPABASE_SERVICE_ROLE_KEY` が設定されているか確認
   - 設定されていない場合は、Supabase Dashboard → Settings → API → service_role key をコピーして設定

### Storage アップロードが失敗する場合
- Base64 データは保存されているため、管理画面では表示可能
- ただし、URL での直接アクセスはできない
- 根本解決には `SUPABASE_SERVICE_ROLE_KEY` の設定が必要

## 🚀 デプロイ手順

```bash
cd /Users/okajima/引き寄せノート講座ローンチプロジェクト/dream-type-gacha
git add -A
git commit -m "変更内容の説明"
git push origin main
```

Vercel が自動でデプロイを開始します（通常1-2分）

## 📝 今後の改善点

1. **Storage ポリシーの設定**
   - anon ユーザーでも `cards` バケットにアップロードできるようにポリシーを設定
   - 現在は service_role のみでアップロード可能

2. **画像最適化**
   - Base64 データは DB サイズが大きくなるため、長期的には Storage URL のみに統一したい
   - ただし、現時点では Base64 保存が確実に動作するため優先

3. **エラーハンドリングの強化**
   - アップロード失敗時のリトライ機能
   - より詳細なエラーログ

## 🔐 認証情報

- **管理画面パスワード**: `kinmanadmin2025` (環境変数 `NEXT_PUBLIC_ADMIN_PASSWORD` で変更可能)
- **メインページパスワード**: `kinman2025` (環境変数で設定)

## 📞 サポート

問題が発生した場合:
1. Vercel の Functions ログを確認
2. Supabase のデータを確認
3. 環境変数の設定を確認
4. 必要に応じて GitHub Issues に報告

---

**最終更新**: 2025-12-08
**対応者**: AI Assistant (Claude)










