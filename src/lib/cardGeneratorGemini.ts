/**
 * カード画像生成 - Gemini 3 Pro Image 版
 * NanoBanana Pro相当の高品質画像編集
 * 遊戯王スタイルの情報量豊富なカード
 */

// 占術データの型定義
export interface FortuneDataForCard {
  // 四柱推命
  bazi?: {
    yearPillar: string;
    monthPillar: string;
    dayPillar: string;
    elementBalance: {
      wood: number;
      fire: number;
      earth: number;
      metal: number;
      water: number;
    };
  };
  // 九星気学
  kyusei?: {
    name: string;
    character: string;
  };
  // 数秘術
  numerology?: {
    lifePathNumber: number;
    name: string;
    mission: string;
  };
}

export interface CardDataGemini {
  // 基本情報
  dreamType: string;
  typeName: string;
  displayName: string;
  icon: string;
  userName: string;
  
  // タイプ詳細
  element: string;           // 属性（火、水、木など）
  keywords: string[];        // キーワード
  personality: string;       // 性格特性
  strengths: string[];       // 強み
  
  // 診断結果
  personalizedMessage: string;
  
  // 占術データ（オプション）
  fortuneData?: FortuneDataForCard;
  
  // 相性情報（オプション）
  compatibility?: {
    goodTypes: string[];     // 相性の良いタイプ
    luckyColor: string;      // ラッキーカラー
    luckyNumber: string;     // ラッキーナンバー
  };
}

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

/**
 * サーバーAPIを呼び出してカード画像を生成
 * Base64形式で返すことで永続化可能に
 */
export async function generateCardWithGemini(
  data: CardDataGemini
): Promise<string> {
  const response = await fetch("/api/generate-card-gemini", {
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

  // PNGをBlobとして取得してBase64に変換（永続化可能）
  const blob = await response.blob();
  const base64 = await blobToBase64(blob);
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/5be1a6a7-7ee8-4fe8-9b00-19e37afd0e10',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'cardGeneratorGemini.ts:generateCard',message:'Base64変換完了',data:{base64Length:base64.length,base64Prefix:base64.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H-fix'})}).catch(()=>{});
  // #endregion
  
  return base64; // data:image/png;base64,... 形式
}

/**
 * カード画像を保存（スマホ対応）
 * - iOS/Android: Web Share APIで写真アプリに保存可能
 * - PC: 従来のダウンロード
 */
export async function downloadCardGemini(
  imageUrl: string,
  fileName: string = "kinman-card.png"
): Promise<{ method: "share" | "download"; success: boolean }> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  
  // Web Share API対応チェック（主にスマホ）
  if (navigator.share && navigator.canShare) {
    const file = new File([blob], fileName, { type: "image/png" });
    const shareData = { files: [file] };
    
    // ファイル共有がサポートされているか確認
    if (navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return { method: "share", success: true };
      } catch (error) {
        // ユーザーがキャンセルした場合など
        if ((error as Error).name === "AbortError") {
          return { method: "share", success: false };
        }
        // 共有失敗時はフォールバック
        console.log("Share failed, falling back to download");
      }
    }
  }
  
  // フォールバック: 従来のダウンロード
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
  
  return { method: "download", success: true };
}

/**
 * Web Share APIがサポートされているかチェック
 */
export function isShareSupported(): boolean {
  if (typeof navigator === "undefined") return false;
  return "share" in navigator && "canShare" in navigator;
}
