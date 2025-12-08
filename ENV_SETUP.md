# 🔐 環境変数セットアップガイド

## 必要な環境変数

### 必須
| 変数名 | 説明 | 取得先 |
|--------|------|--------|
| `GEMINI_API_KEY` | Google Gemini API キー | [Google AI Studio](https://aistudio.google.com/apikey) |

### オプション
| 変数名 | 説明 | 取得先 |
|--------|------|--------|
| `FAL_KEY` | FAL AI APIキー（フォールバック用） | [FAL AI](https://fal.ai/) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | [Supabase](https://supabase.com/) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | [Supabase](https://supabase.com/) |

## ローカル開発

1. `.env.local` ファイルを作成:
```bash
touch .env.local
```

2. 環境変数を設定:
```
GEMINI_API_KEY=your_key_here
```

## Vercelデプロイ

1. Vercelダッシュボード → Settings → Environment Variables
2. 上記の変数を追加
3. Redeploy

## ⚠️ セキュリティ注意事項

- **絶対にAPIキーをコードにハードコードしない**
- `.env.local` は `.gitignore` に含まれている
- `NEXT_PUBLIC_` プレフィックスはフロントエンドに露出するため、機密情報には使用しない
- Google Cloud ConsoleでAPIキーに制限を設定することを推奨














