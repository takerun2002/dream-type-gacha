---
paths:
  - "**/*.tsx"
  - "**/*.css"
---

# フロントエンド開発ルール

## スタイリング
- Tailwind CSS優先
- カスタムアニメーションはFramer Motionで実装
- グラデーション・グロー効果を多用（スピリチュアルテーマ）

## コンポーネント規約
- 機能コンポーネントは`/src/components/`に配置
- ページは`/src/app/*/page.tsx`
- クライアントコンポーネントは先頭に`"use client"`

## アニメーション・演出（重要）
- **削除禁止**: きんまん先生の動画演出（FortuneLoadingAnimation）
- **削除禁止**: パーティクル・キラキラエフェクト
- **削除禁止**: カードフリップアニメーション
- result/page.tsxの`FortuneLoadingAnimation`コンポーネントは必須

## 状態管理
- useState/useEffectを基本
- 複雑な状態はuseReducer
- グローバル状態はsessionStorage/localStorageで永続化
