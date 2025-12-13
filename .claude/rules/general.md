# 夢タイプ診断ガチャ - 共通ルール

## プロジェクト概要
きんまん先生の「引き寄せノート講座」特典として提供する夢タイプ診断ガチャアプリ。
四柱推命・九星気学・数秘術を組み合わせたAI診断でユーザー専用カードを生成。

## 技術スタック
- Next.js 16 (App Router + Turbopack)
- TypeScript
- Tailwind CSS + Framer Motion
- Supabase (PostgreSQL + Storage)
- Gemini API (診断 + カード生成)
- Vercel (デプロイ)

## 開発ルール
1. 日本語でコメント・応答
2. 変更は最小限に（指示されたことのみ）
3. 既存の演出・アニメーションを削除しない
4. console.logは本番コードに残さない
5. 環境変数はハードコードしない

## 重要ファイル
- `/src/app/page.tsx` - 診断フロー（パスワード→名前→生年月日→質問）
- `/src/app/gacha/page.tsx` - ガチャ演出
- `/src/app/result/page.tsx` - 結果表示 + カード生成
- `/src/lib/diagnosisRecord.ts` - 診断記録管理
