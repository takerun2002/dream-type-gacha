/**
 * カード画像生成 - Satori + Sharp 版
 * サーバーサイドでピクセルパーフェクトな画像を生成
 * コスト: 無料
 */

export interface CardDataSatori {
  dreamType: string;
  typeName: string;
  displayName: string;
  icon: string;
  userName: string;
  personalizedMessage: string;
}

/**
 * サーバーAPIを呼び出してカード画像を生成
 */
export async function generateCardWithSatori(
  data: CardDataSatori
): Promise<string> {
  const response = await fetch("/api/generate-card-satori", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "カード生成に失敗しました");
  }

  // PNGをBlobとして取得してObject URLに変換
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

/**
 * カード画像をダウンロード
 */
export async function downloadCard(
  imageUrl: string,
  fileName: string = "kinman-card.png"
): Promise<void> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  
  window.URL.revokeObjectURL(url);
}

/**
 * Object URLを解放
 */
export function revokeCardUrl(url: string): void {
  if (url.startsWith("blob:")) {
    window.URL.revokeObjectURL(url);
  }
}
























