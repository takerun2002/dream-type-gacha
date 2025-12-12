# 🚀 Claude Codeへのタスク: RASChatBot表示修正 & デプロイ

## 📋 問題の概要

本番環境（Vercel）でオペレーターRASくん（チャットボット）が表示されていない。

## 🔧 実施済みの修正

Next.js 16ではServer Componentsで`ssr: false`が使えないため、Client Componentラッパーを作成しました。

### 1. `src/components/RASChatBotWrapper.tsx` を新規作成

```typescript
"use client";

import dynamic from "next/dynamic";

const RASChatBot = dynamic(() => import("./RASChatBot"), {
  ssr: false,
  loading: () => null,
});

export default function RASChatBotWrapper() {
  return <RASChatBot />;
}
```

### 2. `src/app/layout.tsx` を更新

```typescript
import RASChatBotWrapper from "@/components/RASChatBotWrapper";

// ...

<RASChatBotWrapper />
```

### ✅ ビルド確認済み（成功）

## 📝 Claude Codeへのタスク

### 1. ビルド確認
```bash
cd /Users/okajima/引き寄せノート講座ローンチプロジェクト/dream-type-gacha
npm run build
```

### 2. ローカルテスト
```bash
npm run dev -- -p 3001
```

ブラウザで http://localhost:3001 を開いて、右下にオペレーターRASくんのアイコンが表示されることを確認。

### 3. Vercelにデプロイ
```bash
vercel --prod
```

### 4. 本番確認
https://dream-type-gacha.vercel.app/ を開いて、右下にオペレーターRASくんが表示されることを確認。

## 🎯 期待される結果

- 右下にオレンジ色の丸いボタン（RASくんのアイコン）が表示される
- クリックするとチャットウィンドウが開く
- チャットで質問すると、RAG検索で回答が返ってくる

## ⚠️ 注意事項

- 環境変数が正しく設定されていることを確認
- Supabaseのテーブルが作成されていることを確認
- Gemini APIキーが有効であることを確認

## 📁 関連ファイル

- `src/app/layout.tsx` - RASChatBotの統合（修正済み）
- `src/components/RASChatBot.tsx` - チャットボットコンポーネント
- `src/app/api/chat/rag/route.ts` - RAG APIエンドポイント
- `src/app/api/chat/session/route.ts` - セッション管理API
- `public/images/ras/ras-greeting.png` - RASくんのアイコン画像

---

**このタスクをClaude Codeに渡して、デプロイを完了させてください。**

