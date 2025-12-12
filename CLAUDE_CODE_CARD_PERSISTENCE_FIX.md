# Claude Code 指示書: カード画像永続化問題の修正

## 📋 問題概要

ユーザーがページを離れて戻ってくると、生成されたカード画像が表示されなくなる。
「生成されたカード」というaltテキストだけが表示され、画像は表示されない。

## 🔍 根本原因

1. `generateCardWithGemini` 関数が `URL.createObjectURL(blob)` でBlob URLを返していた
2. Blob URL (`blob:https://...`) はブラウザのメモリに一時的に存在する
3. ページをリロードするとBlob URLは無効になる
4. localStorageにはURL文字列だけが保存され、実際のBlobデータは保存されない

## ✅ 必要な修正

### 1. `src/lib/cardGeneratorGemini.ts` の修正

```typescript
/**
 * BlobをBase64文字列に変換
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function generateCardWithGemini(
  data: CardDataGemini
): Promise<string> {
  const response = await fetch("/api/generate-card-gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "カード生成に失敗しました");
  }

  // ★重要: BlobをBase64に変換して返す（永続化可能）
  const blob = await response.blob();
  const base64 = await blobToBase64(blob);
  
  console.log("✅ カード画像をBase64形式で生成:", base64.substring(0, 50) + "...");
  
  return base64; // data:image/png;base64,... 形式
}
```

### 2. `src/app/result/page.tsx` の修正

```typescript
// マウント時の画像復元ロジック
useEffect(() => {
  if (typeof window !== "undefined") {
    const savedCardImage = localStorage.getItem(CARD_IMAGE_STORAGE_KEY);
    
    console.log("🔍 保存済み画像チェック:", savedCardImage ? savedCardImage.substring(0, 50) : "なし");
    
    if (savedCardImage) {
      // Base64形式（data:image/...）のみ有効
      if (savedCardImage.startsWith('data:')) {
        setCardImageUrl(savedCardImage);
        setCardGenerated(true);
        console.log("✅ Base64画像を復元");
      } else {
        // 古いBlob URLは無効なのでクリア
        console.log("⚠️ 古いBlob URLを検出、クリアします");
        localStorage.removeItem(CARD_IMAGE_STORAGE_KEY);
        setCardImageUrl(null);
        setCardGenerated(false);
        // 自動で再生成が開始される
      }
    }
  }
}, []);
```

## 🧪 テスト手順

1. シークレットウィンドウで https://dream-type-gacha.vercel.app にアクセス
2. 診断を最初から実行してカードを生成
3. ブラウザのコンソールで `✅ カード画像をBase64形式で生成` を確認
4. ブラウザタブを閉じる
5. 新しいタブで https://dream-type-gacha.vercel.app/result にアクセス
6. カード画像が正しく表示されることを確認

## ✅ 完了条件

- カード生成時にBase64形式で保存される
- ページを離れて戻っても画像が表示される
- 古いBlob URLは自動的にクリアされて再生成される

## 📝 備考

- Base64形式は `data:image/png;base64,...` で始まる
- Blob URL形式は `blob:https://...` で始まる
- localStorageにはBase64形式のみ保存する

