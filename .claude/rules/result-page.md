---
paths:
  - "src/app/result/**"
---

# 結果ページ（/result）専用ルール

## 重要コンポーネント（削除禁止）

### FortuneLoadingAnimation
カード生成中に表示されるきんまん先生の占い演出動画。
- 動画: `/animations/kinman-fortune-light.mp4`
- グロー効果付き
- プログレスバー表示

### QueueWaitingAnimation
キュー待機中のキラキラ演出。

## カード生成フロー
1. `generateCard()`呼び出し
2. `isGenerating=true` → `FortuneLoadingAnimation`表示
3. `/api/generate-card-gemini`でカード生成
4. 生成完了 → カード画像表示
5. localStorageに保存（再訪問時復元用）

## カード画像復元（rid優先）
1. URL `?rid=xxx` → Supabaseから取得
2. localStorage → Base64/URL復元
3. Supabase fingerprint検索
4. なければ再生成
