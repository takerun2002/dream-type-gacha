# Claude Code 指示書: カード画像永続化問題の最終確認と修正

## 📋 問題概要

ユーザーがページを離れて戻ってくると、生成されたカード画像が表示されなくなる。
「生成されたカード」というaltテキストだけが表示され、画像は表示されない。

## 🔍 調査済みの内容

### Supabaseのデータ確認済み
```json
{
  "user_name": "岡島武尊",
  "dream_type": "phoenix",
  "card_image_url": "https://lfpvgjnlxtkjygbexiph.supabase.co/storage/v1/object/public/card-images/1765523348624-phoenix.png",
  "fingerprint": "cf1a9226fb6f0670cdd3faa5d3560353"
}
```
- 画像URLは有効（HTTP 200、841KB PNG）

### 実装済みの修正

1. **`src/lib/cardGeneratorGemini.ts`**
   - BlobをBase64に変換して返すように修正済み

2. **`src/lib/diagnosisRecord.ts`**
   - `getSavedCardImageUrl()` 関数を追加
   - Supabaseから保存済みカード画像URLを取得するフォールバック機能

3. **`src/app/result/page.tsx`**
   - 復元ロジックを修正：
     1. localStorageからBase64形式を復元
     2. localStorageからSupabase URLを復元
     3. 古いBlob URLはクリア
     4. Supabaseから画像URLを取得（フォールバック）

## ⚠️ 確認が必要なこと

1. **デプロイが反映されているか確認**
   - ブラウザのコンソール（F12 → Console）で `🔍 [DEBUG v13]` が表示されるか
   - 表示されない場合は古いバージョンがキャッシュされている

2. **Supabaseフォールバックが動作しているか確認**
   - コンソールに `✅ Supabaseからカード画像URLを復元:` が表示されるか

3. **フィンガープリントが一致しているか確認**
   - Supabaseのレコードは `fingerprint: cf1a9226fb6f0670cdd3faa5d3560353`
   - ブラウザで生成されるフィンガープリントがこれと一致しないと復元できない

## 🔧 追加で必要かもしれない修正

### 案1: フィンガープリントに依存しない復元

現在の実装はフィンガープリントで一致するレコードを検索している。
シークレットウィンドウや別のブラウザでは異なるフィンガープリントが生成されるため、復元できない。

**修正案**: sessionStorageに保存された診断IDを使ってSupabaseからレコードを取得する

```typescript
// result/page.tsxで
const diagnosisId = sessionStorage.getItem("diagnosisId");
if (diagnosisId) {
  const { data } = await supabase
    .from("diagnosis_records")
    .select("card_image_url")
    .eq("id", diagnosisId)
    .single();
  
  if (data?.card_image_url) {
    setCardImageUrl(data.card_image_url);
    setCardGenerated(true);
  }
}
```

### 案2: ユーザー名とdreamTypeで検索

```typescript
const savedData = getSavedDiagnosisData();
if (savedData?.userName && savedData?.dreamType) {
  const { data } = await supabase
    .from("diagnosis_records")
    .select("card_image_url")
    .eq("user_name", savedData.userName)
    .eq("dream_type", savedData.dreamType)
    .order("created_at", { ascending: false })
    .limit(1);
}
```

## 🧪 テスト手順

1. ブラウザでF12を開いてConsoleタブを確認
2. https://dream-type-gacha.vercel.app/result にアクセス
3. Cmd+Shift+R でキャッシュ無視リロード
4. コンソールに以下が表示されるか確認：
   - `🔍 [DEBUG v13] カード画像復元処理開始`
   - `✅ Supabaseからカード画像URLを復元:` または `✅ localStorageから...`
5. カード画像が表示されるか確認

## ✅ 完了条件

- ページを離れて戻っても、カード画像が正しく表示される
- シークレットウィンドウでも同様に動作する
- コンソールにエラーが表示されない

## 📝 環境情報

- プロジェクト: `/Users/okajima/引き寄せノート講座ローンチプロジェクト/dream-type-gacha`
- Supabase URL: `https://lfpvgjnlxtkjygbexiph.supabase.co`
- Vercel URL: `https://dream-type-gacha.vercel.app`
