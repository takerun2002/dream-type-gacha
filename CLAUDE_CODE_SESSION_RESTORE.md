# 🔄 Claude Code セッション復元用指示書

## 📌 プロジェクト概要

**プロジェクト名**: 夢タイプ診断ガチャ（dream-type-gacha）  
**フレームワーク**: Next.js 16 (App Router)  
**デプロイ先**: Vercel  
**本番URL**: https://dream-type-gacha.vercel.app/

## 🎯 現在のタスク状況

### 進行中のタスク: RASChatBot表示修正 & デプロイ

**問題**: 本番環境（Vercel）でオペレーターRASくん（チャットボット）が表示されていない。

**原因**: Next.js 16ではServer Componentsで`ssr: false`が使えないため、Client Componentラッパーが必要。

## 📋 実施すべき作業

### ステップ1: 現在の状態確認

```bash
cd /Users/okajima/引き寄せノート講座ローンチプロジェクト/dream-type-gacha
```

以下のファイルの存在を確認：

1. **`src/components/RASChatBotWrapper.tsx`** - 存在するか？
2. **`src/components/RASChatBot.tsx`** - 存在するか？
3. **`src/app/api/chat/rag/route.ts`** - 存在するか？
4. **`src/app/api/chat/session/route.ts`** - 存在するか？
5. **`src/app/layout.tsx`** - RASChatBotWrapperがインポートされているか？

### ステップ2: RASChatBotWrapperの作成（未作成の場合）

**ファイル**: `src/components/RASChatBotWrapper.tsx`

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

### ステップ3: layout.tsxの更新

**ファイル**: `src/app/layout.tsx`

現在の`layout.tsx`に以下を追加：

```typescript
import RASChatBotWrapper from "@/components/RASChatBotWrapper";

// ... 既存のコード ...

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${notoSansJP.variable} ${zenMaruGothic.variable} antialiased bg-gradient-dream min-h-screen`}
      >
        {children}
        <RASChatBotWrapper />
      </body>
    </html>
  );
}
```

### ステップ4: RASChatBotコンポーネントの確認

**ファイル**: `src/components/RASChatBot.tsx`

このファイルが存在するか確認。存在しない場合は、以前の実装を復元する必要があります。

**期待される機能**:
- 右下にオレンジ色の丸いボタン（RASくんのアイコン）を表示
- クリックでチャットウィンドウを開く
- RAG検索で回答を返す
- アイコン画像: `public/images/ras/ras-greeting.png`

### ステップ5: APIエンドポイントの確認

以下のAPIエンドポイントが存在するか確認：

1. **`src/app/api/chat/rag/route.ts`** - RAG検索API
2. **`src/app/api/chat/session/route.ts`** - セッション管理API

### ステップ6: ビルド確認

```bash
npm run build
```

エラーがないことを確認。

### ステップ7: ローカルテスト

```bash
npm run dev -- -p 3001
```

ブラウザで http://localhost:3001 を開いて、右下にオペレーターRASくんのアイコンが表示されることを確認。

### ステップ8: Vercelにデプロイ

```bash
vercel --prod
```

### ステップ9: 本番確認

https://dream-type-gacha.vercel.app/ を開いて、右下にオペレーターRASくんが表示されることを確認。

## 🔍 確認すべき環境変数

以下の環境変数がVercelに設定されているか確認：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- その他必要な環境変数

## 📁 関連ファイル一覧

### コンポーネント
- `src/app/layout.tsx` - ルートレイアウト（RASChatBot統合箇所）
- `src/components/RASChatBotWrapper.tsx` - Client Componentラッパー
- `src/components/RASChatBot.tsx` - チャットボット本体

### API
- `src/app/api/chat/rag/route.ts` - RAG検索エンドポイント
- `src/app/api/chat/session/route.ts` - セッション管理エンドポイント

### アセット
- `public/images/ras/ras-greeting.png` - RASくんのアイコン画像

### スタイル
- `src/app/globals.css` - RASくん関連のCSS（`.ras-float`, `.ras-pulse-glow`など）

## 🎯 期待される結果

- ✅ 右下にオレンジ色の丸いボタン（RASくんのアイコン）が表示される
- ✅ クリックするとチャットウィンドウが開く
- ✅ チャットで質問すると、RAG検索で回答が返ってくる
- ✅ アニメーション効果（浮遊、パルスグロー）が動作する

## ⚠️ 注意事項

1. **Next.js 16の制約**: Server Componentsでは`ssr: false`が使えないため、必ずClient Componentラッパーが必要
2. **環境変数**: 本番環境で正しく設定されていることを確認
3. **Supabase**: テーブルが作成されていることを確認
4. **Gemini API**: APIキーが有効であることを確認

## 🔧 トラブルシューティング

### ビルドエラーが出る場合

1. TypeScriptの型エラーを確認
2. インポートパスの確認（`@/components/...`形式）
3. 依存関係の確認（`npm install`）

### ローカルで表示されない場合

1. ブラウザのコンソールでエラーを確認
2. ネットワークタブでAPIリクエストを確認
3. 環境変数が`.env.local`に設定されているか確認

### 本番で表示されない場合

1. Vercelのビルドログを確認
2. 環境変数がVercelに設定されているか確認
3. ブラウザのコンソールでエラーを確認

## 📝 その他のタスク

### 管理画面のカード画像表示問題

別途、`CLAUDE_CODE_INSTRUCTIONS.md`に記載されている管理画面のカード画像表示問題も対応が必要な場合があります。

---

**この指示書をClaude Codeに渡して、作業を再開してください。**
