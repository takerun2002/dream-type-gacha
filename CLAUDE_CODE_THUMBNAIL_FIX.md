# 🔧 Claude Code への指示: サムネイル画像の遅延ロード実装

## 🚨 問題の原因（確定済み）

| ユーザー | card_image_url | card_image_base64 | サムネイル表示 |
|---------|----------------|-------------------|----------------|
| 369 | ✅ あり | ✅ あり | ✅ 表示される |
| 松坂 尚 | ❌ なし | ✅ あり | ❌ 🎴のみ |
| 月の黒猫 | ❌ なし | ✅ あり | ❌ 🎴のみ |

**現状の問題：**
- `card_image_url`がある: **4件のみ（1.6%）** → サムネイル表示OK
- `card_image_url`がない: **253件（98.4%）** → 🎴アイコンのみ表示

`card_image_base64`は存在するが、サムネイル表示時には取得されないため、ほとんどのユーザーのサムネイルが🎴アイコンになっている。

## 🎯 解決策

**Intersection Observerを使って、サムネイルが画面に表示された時に自動的に画像を取得する**

これにより：
- 初期ロード時にすべての画像を取得しない（パフォーマンス維持）
- 画面に表示されたタイミングで画像を取得
- 一度取得した画像はキャッシュに保存

## 📋 修正すべきファイル

### `src/app/admin/page.tsx`

#### 1. useRefをインポート

```typescript
import { useState, useEffect, useCallback, useRef } from "react";
```

#### 2. サムネイルコンポーネントを分離して作成

各サムネイルにIntersection Observerを適用するため、コンポーネントを分離します。

```typescript
// サムネイルコンポーネント（Intersection Observer対応）
function CardThumbnail({
  diagnosis,
  cardImageCache,
  onLoadImage,
  onOpenModal,
}: {
  diagnosis: RecentDiagnosis;
  cardImageCache: Record<string, string>;
  onLoadImage: (userName: string) => Promise<string | null>;
  onOpenModal: (diagnosis: RecentDiagnosis) => void;
}) {
  const thumbnailRef = useRef<HTMLButtonElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasTriedLoad, setHasTriedLoad] = useState(false);

  // 画像URLがある場合はそれを使用
  const imageUrl = diagnosis.card_image_url ||
    (diagnosis.card_image_base64 ? `data:image/png;base64,${diagnosis.card_image_base64}` : null) ||
    cardImageCache[diagnosis.user_name];

  useEffect(() => {
    // すでに画像がある、または読み込み試行済みの場合はスキップ
    if (imageUrl || hasTriedLoad || !diagnosis.has_card_image) {
      return;
    }

    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !hasTriedLoad) {
          setHasTriedLoad(true);
          setIsLoading(true);
          await onLoadImage(diagnosis.user_name);
          setIsLoading(false);
        }
      },
      {
        rootMargin: '100px', // 100px手前で読み込み開始
        threshold: 0.1,
      }
    );

    if (thumbnailRef.current) {
      observer.observe(thumbnailRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [diagnosis.user_name, diagnosis.has_card_image, imageUrl, hasTriedLoad, onLoadImage]);

  // 画像がない場合
  if (!diagnosis.card_image_url && !diagnosis.card_image_base64 && !diagnosis.has_card_image && !cardImageCache[diagnosis.user_name]) {
    return (
      <div className="w-20 h-28 bg-purple-900/30 rounded-lg flex items-center justify-center border border-purple-500/20">
        <span className="text-purple-400/50 text-xs text-center">No<br />Image</span>
      </div>
    );
  }

  return (
    <button
      ref={thumbnailRef}
      onClick={() => onOpenModal(diagnosis)}
      className="block w-20 h-28 overflow-hidden rounded-lg border-2 border-purple-500/30 hover:border-purple-400 transition-colors cursor-pointer"
    >
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center bg-purple-900/50">
          <span className="text-purple-300 text-lg animate-spin">🔄</span>
        </div>
      ) : imageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imageUrl}
          alt={`${diagnosis.user_name}のカード`}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-purple-900/50">
          <span className="text-purple-300 text-2xl">🎴</span>
        </div>
      )}
    </button>
  );
}
```

#### 3. メインコンポーネントでサムネイルコンポーネントを使用

既存のサムネイル表示部分を置き換え：

```typescript
{/* カード画像サムネイル */}
<div className="flex-shrink-0">
  <CardThumbnail
    diagnosis={diagnosis}
    cardImageCache={cardImageCache}
    onLoadImage={fetchCardImage}
    onOpenModal={openCardModal}
  />
</div>
```

#### 4. fetchCardImageをuseCallbackでラップ

Intersection Observerの依存関係として使用するため、useCallbackでラップします：

```typescript
// 個別のカード画像を取得
const fetchCardImage = useCallback(async (userName: string): Promise<string | null> => {
  // キャッシュがあればそれを返す
  if (cardImageCache[userName]) {
    return cardImageCache[userName];
  }

  try {
    const response = await fetch("/api/admin/card-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: ADMIN_PASSWORD, userName }),
    });
    const data = await response.json();

    if (data.success) {
      const imageData = data.cardImageUrl ||
        (data.cardImageBase64 ? `data:image/png;base64,${data.cardImageBase64}` : null);

      if (imageData) {
        setCardImageCache(prev => ({ ...prev, [userName]: imageData }));
        return imageData;
      }
    }
    return null;
  } catch (error) {
    console.error("Card image fetch error:", error);
    return null;
  }
}, [cardImageCache]);
```

## 📝 完全な修正後のコード例

以下は、修正後の主要な部分です。

### インポートの修正

```typescript
import { useState, useEffect, useCallback, useRef } from "react";
```

### CardThumbnailコンポーネント（ファイルの末尾、StatCardの前に追加）

```typescript
// サムネイルコンポーネント（Intersection Observer対応）
function CardThumbnail({
  diagnosis,
  cardImageCache,
  onLoadImage,
  onOpenModal,
}: {
  diagnosis: RecentDiagnosis;
  cardImageCache: Record<string, string>;
  onLoadImage: (userName: string) => Promise<string | null>;
  onOpenModal: (diagnosis: RecentDiagnosis) => void;
}) {
  const thumbnailRef = useRef<HTMLButtonElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasTriedLoad, setHasTriedLoad] = useState(false);

  const imageUrl = diagnosis.card_image_url ||
    (diagnosis.card_image_base64 ? `data:image/png;base64,${diagnosis.card_image_base64}` : null) ||
    cardImageCache[diagnosis.user_name];

  useEffect(() => {
    if (imageUrl || hasTriedLoad || !diagnosis.has_card_image) {
      return;
    }

    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !hasTriedLoad) {
          setHasTriedLoad(true);
          setIsLoading(true);
          await onLoadImage(diagnosis.user_name);
          setIsLoading(false);
        }
      },
      { rootMargin: '100px', threshold: 0.1 }
    );

    if (thumbnailRef.current) {
      observer.observe(thumbnailRef.current);
    }

    return () => observer.disconnect();
  }, [diagnosis.user_name, diagnosis.has_card_image, imageUrl, hasTriedLoad, onLoadImage]);

  if (!diagnosis.card_image_url && !diagnosis.card_image_base64 && !diagnosis.has_card_image && !cardImageCache[diagnosis.user_name]) {
    return (
      <div className="w-20 h-28 bg-purple-900/30 rounded-lg flex items-center justify-center border border-purple-500/20">
        <span className="text-purple-400/50 text-xs text-center">No<br />Image</span>
      </div>
    );
  }

  return (
    <button
      ref={thumbnailRef}
      onClick={() => onOpenModal(diagnosis)}
      className="block w-20 h-28 overflow-hidden rounded-lg border-2 border-purple-500/30 hover:border-purple-400 transition-colors cursor-pointer"
    >
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center bg-purple-900/50">
          <span className="text-purple-300 text-lg animate-spin">🔄</span>
        </div>
      ) : imageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imageUrl}
          alt={`${diagnosis.user_name}のカード`}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-purple-900/50">
          <span className="text-purple-300 text-2xl">🎴</span>
        </div>
      )}
    </button>
  );
}
```

### リスト表示部分の修正

既存のサムネイル表示ブロックを以下に置き換え：

```typescript
{/* カード画像サムネイル */}
<div className="flex-shrink-0">
  <CardThumbnail
    diagnosis={diagnosis}
    cardImageCache={cardImageCache}
    onLoadImage={fetchCardImage}
    onOpenModal={openCardModal}
  />
</div>
```

## 🔍 確認方法

1. **ビルド確認**
```bash
cd /Users/okajima/引き寄せノート講座ローンチプロジェクト/dream-type-gacha
npm run build
```

2. **ローカルテスト**
```bash
npm run dev -- -p 3001
```

3. **管理画面で確認**
- `/admin`にアクセス
- 「全診断一覧」タブを開く
- スクロールしていくと、画面に入ったサムネイルが自動的に読み込まれることを確認
- 🔄アイコンが表示された後、画像に置き換わることを確認

4. **Vercelにデプロイ**
```bash
vercel --prod
```

## 🎯 期待される結果

- ✅ 画面に表示されたサムネイルが自動的に読み込まれる
- ✅ 読み込み中は🔄アイコンが表示される
- ✅ 読み込み完了後、カード画像が表示される
- ✅ 一度読み込んだ画像はキャッシュされ、再読み込み不要
- ✅ 初期ロードは軽量（全画像を一度に読み込まない）

## ⚠️ 注意事項

1. **パフォーマンス**: `rootMargin: '100px'`で100px手前から読み込みを開始するので、スクロール時のちらつきを軽減
2. **並列リクエスト**: 多くのサムネイルが同時に表示されると、並列リクエストが発生する。必要に応じてリクエストをキューイングすることを検討
3. **エラーハンドリング**: 画像取得に失敗した場合は🎴アイコンのまま表示される

---

**この指示書をClaude Codeに渡して、サムネイル画像の遅延ロードを実装してください。**
