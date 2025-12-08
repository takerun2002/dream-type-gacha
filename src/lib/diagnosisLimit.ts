/**
 * おひとり様1回制限
 * フィンガープリント + ローカルストレージで重複診断を防止
 */

import FingerprintJS from "@fingerprintjs/fingerprintjs";

const STORAGE_KEY = "dream_diagnosis_completed";
const FINGERPRINT_KEY = "dream_diagnosis_fp";

// フィンガープリントを取得
export async function getFingerprint(): Promise<string> {
  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId;
  } catch (error) {
    console.error("Fingerprint error:", error);
    // フォールバック: ランダムID
    return `fallback-${Math.random().toString(36).substring(7)}`;
  }
}

// 診断済みかチェック
export async function isDiagnosisCompleted(): Promise<{
  completed: boolean;
  dreamType?: string;
  userName?: string;
}> {
  if (typeof window === "undefined") {
    return { completed: false };
  }

  // ローカルストレージをチェック
  const storedData = localStorage.getItem(STORAGE_KEY);
  if (storedData) {
    try {
      const data = JSON.parse(storedData);
      // フィンガープリントも確認（より厳密に）
      const currentFp = await getFingerprint();
      const storedFp = localStorage.getItem(FINGERPRINT_KEY);
      
      if (storedFp === currentFp || data.completed) {
        return {
          completed: true,
          dreamType: data.dreamType,
          userName: data.userName,
        };
      }
    } catch {
      // パースエラーは無視
    }
  }

  return { completed: false };
}

// 診断完了を記録
export async function markDiagnosisCompleted(
  dreamType: string,
  userName: string
): Promise<void> {
  if (typeof window === "undefined") return;

  const fingerprint = await getFingerprint();
  
  // ローカルストレージに保存
  const data = {
    completed: true,
    dreamType,
    userName,
    timestamp: Date.now(),
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  localStorage.setItem(FINGERPRINT_KEY, fingerprint);
}

// 診断データを取得（結果表示用）
export function getDiagnosisData(): {
  dreamType?: string;
  userName?: string;
  diagnosisResult?: unknown;
} | null {
  if (typeof window === "undefined") return null;

  const storedData = localStorage.getItem(STORAGE_KEY);
  if (!storedData) return null;

  try {
    const data = JSON.parse(storedData);
    
    // sessionStorageからも取得
    const diagnosisResult = sessionStorage.getItem("diagnosisResult");
    
    return {
      dreamType: data.dreamType,
      userName: data.userName,
      diagnosisResult: diagnosisResult ? JSON.parse(diagnosisResult) : undefined,
    };
  } catch {
    return null;
  }
}

// デバッグ用: 制限をリセット（開発時のみ使用）
export function resetDiagnosisLimit(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(FINGERPRINT_KEY);
  sessionStorage.clear();
  console.log("診断制限をリセットしました");
}
















