# オペレーターラスくん ポーズ生成ガイド

## 📋 概要
オペレーターラスくんの5つのポーズ（thinking, happy, confused, explaining, apologize）を一括生成するスクリプトです。

## 🚀 Claude Codeでの実行方法

### ⚠️ 重要：ヘッドホン修正版を使用してください

**推奨スクリプト**: `generate-ras-poses-fixed.py` （ヘッドホンの位置を修正）

### 実行コマンド

```bash
cd "/Users/okajima/引き寄せノート講座ローンチプロジェクト/dream-type-gacha"
python3 scripts/generate-ras-poses-fixed.py
```

### 修正内容

- ✅ ヘッドホンが耳を完全に覆わないように修正
- ✅ 両耳が完全に見えるように指定
- ✅ ネガティブプロンプトで不適切な配置を回避
- ✅ 一貫性を保つための詳細な仕様追加

## 📁 出力先

生成された画像は以下のディレクトリに保存されます：

```
dream-type-gacha/public/images/ras/
├── ras-thinking.png
├── ras-happy.png
├── ras-confused.png
├── ras-explaining.png
└── ras-apologize.png
```

## ⚙️ 必要なもの

- Python 3.x
- インターネット接続
- Gemini APIキー（スクリプト内に設定済み）

## 🔧 トラブルシューティング

### SSL証明書エラーが出る場合
スクリプト内でSSL検証を無効化していますが、それでもエラーが出る場合は：

```bash
# macOSの場合
/Applications/Python\ 3.x/Install\ Certificates.command
```

### APIレート制限エラー
5秒間隔で生成していますが、エラーが出る場合は `time.sleep(5)` の値を増やしてください。

### 個別に生成したい場合
スクリプトを編集して、`poses` リストから必要なポーズだけを残してください。

## 📝 生成されるポーズ

1. **thinking** - 考え中（顎に手、上を見る）
2. **happy** - 喜び（ジャンプ、キラキラ目）
3. **confused** - 困惑（首をかしげる、汗マーク）
4. **explaining** - 説明中（指を立てる、ウインク）
5. **apologize** - お詫び（お辞儀、目を閉じる）

