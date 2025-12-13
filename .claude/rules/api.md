---
paths:
  - "src/app/api/**/*.ts"
---

# API開発ルール

## 構成
- `/api/diagnose` - AI診断（Gemini）
- `/api/generate-card-gemini` - カード画像生成
- `/api/admin/*` - 管理者API（要認証）
- `/api/support/*` - サポート機能
- `/api/chat/*` - RAGチャット

## セキュリティ
- 管理者APIは必ず`ADMIN_PASSWORD`で認証
- 環境変数からのみAPIキーを取得（フォールバック値は空文字）
- レート制限を実装（同一IP/fingerprint）

## エラーハンドリング
- try-catchで囲む
- NextResponse.json()でエラーレスポンス
- console.errorはサーバーログ用にOK

## Supabase
- Service Role Keyはサーバーサイドのみ
- Anon Keyはクライアントからも使用可
