/**
 * 診断記録サービス
 * Supabase DB + ローカルストレージのハイブリッド
 */

import { supabase, isSupabaseConfigured } from "./supabase";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

const LOCAL_STORAGE_KEY = "dream_diagnosis_completed";
const FINGERPRINT_KEY = "dream_diagnosis_fp";

// フィンガープリント取得
async function getFingerprint(): Promise<string> {
  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId;
  } catch (error) {
    console.error("Fingerprint error:", error);
    return `fallback-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}

// クライアントIPを取得するAPI
async function getClientIP(): Promise<string> {
  try {
    const response = await fetch("/api/get-ip");
    const data = await response.json();
    return data.ip || "unknown";
  } catch {
    return "unknown";
  }
}

interface DiagnosisCheckResult {
  canDiagnose: boolean;
  reason?: "already_diagnosed" | "rate_limited";
  existingData?: {
    dreamType: string;
    userName: string;
  };
}

interface RecordDiagnosisParams {
  fingerprint: string;
  ipAddress: string;
  dreamType: string;
  userName: string;
  userAgent: string;
}

/**
 * 診断可能かチェック
 * ⚠️ 重要: フィンガープリントのみで判定（IPアドレスは同一WiFiで共有されるため除外）
 */
export async function checkCanDiagnose(): Promise<DiagnosisCheckResult> {
  const fingerprint = await getFingerprint();
  const ipAddress = await getClientIP();

  // 1. Supabaseでチェック（設定されている場合）
  if (isSupabaseConfigured() && supabase) {
    try {
      // ⚠️ フィンガープリントのみで既存記録をチェック
      // IPアドレスでの判定は削除（同一WiFiで別人のデータが返されるバグ対策）
      const { data, error } = await supabase
        .from("diagnosis_records")
        .select("dream_type, user_name, fingerprint, created_at")
        .eq("fingerprint", fingerprint)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Supabase check error:", error);
        // DBエラー時はローカルストレージにフォールバック
      } else if (data && data.length > 0) {
        // フィンガープリントが完全一致した場合のみ「診断済み」
        return {
          canDiagnose: false,
          reason: "already_diagnosed",
          existingData: {
            dreamType: data[0].dream_type,
            userName: data[0].user_name,
          },
        };
      }

      // レート制限チェック（過去5分以内に同一IPから10回以上）
      // ※ 同一イベント会場での利用を考慮して緩和
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recentRecords, error: rateError } = await supabase
        .from("diagnosis_records")
        .select("id")
        .eq("ip_address", ipAddress)
        .gte("created_at", fiveMinutesAgo);

      if (!rateError && recentRecords && recentRecords.length >= 10) {
        return {
          canDiagnose: false,
          reason: "rate_limited",
        };
      }
    } catch (error) {
      console.error("Supabase error:", error);
    }
  }

  // 2. ローカルストレージでチェック（フォールバック）
  if (typeof window !== "undefined") {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    const storedFp = localStorage.getItem(FINGERPRINT_KEY);

    if (storedData && storedFp === fingerprint) {
      try {
        const data = JSON.parse(storedData);
        return {
          canDiagnose: false,
          reason: "already_diagnosed",
          existingData: {
            dreamType: data.dreamType,
            userName: data.userName,
          },
        };
      } catch {
        // パースエラーは無視
      }
    }
  }

  return { canDiagnose: true };
}

/**
 * 診断記録を保存
 */
export async function recordDiagnosis(
  dreamType: string,
  userName: string
): Promise<{ success: boolean; recordId?: string }> {
  const fingerprint = await getFingerprint();
  const ipAddress = await getClientIP();
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
  let recordId: string | undefined;

  // 1. Supabaseに保存（設定されている場合）
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("diagnosis_records")
        .insert({
          fingerprint,
          ip_address: ipAddress,
          dream_type: dreamType,
          user_name: userName,
          user_agent: userAgent,
        })
        .select("id")
        .single();

      if (error) {
        console.error("Supabase insert error:", error);
      } else if (data?.id) {
        recordId = data.id as string;
      }
    } catch (error) {
      console.error("Supabase error:", error);
    }
  }

  // 2. ローカルストレージにも保存（二重防御）
  if (typeof window !== "undefined") {
    const data = {
      completed: true,
      dreamType,
      userName,
      timestamp: Date.now(),
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(FINGERPRINT_KEY, fingerprint);
  }

  return { success: true, recordId };
}

/**
 * Supabaseから診断レコードIDでカード画像URLを取得
 * - フィンガープリントやlocalStorageに依存しない復元用（/result?rid=...）
 */
export async function getCardImageUrlByRecordId(recordId: string): Promise<string | null> {
  if (!recordId) return null;
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from("diagnosis_records")
      .select("card_image_url")
      .eq("id", recordId)
      .single();
    if (error) {
      console.error("Supabase recordId検索エラー:", error);
      return null;
    }
    const url = (data as any)?.card_image_url as string | null | undefined;
    return url || null;
  } catch (e) {
    console.error("getCardImageUrlByRecordId error:", e);
    return null;
  }
}

/**
 * 保存済みの診断データを取得
 */
export function getSavedDiagnosisData(): {
  dreamType?: string;
  userName?: string;
} | null {
  if (typeof window === "undefined") return null;

  const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!storedData) return null;

  try {
    const data = JSON.parse(storedData);
    return {
      dreamType: data.dreamType,
      userName: data.userName,
    };
  } catch {
    return null;
  }
}

/**
 * デバッグ用: 制限リセット（開発時のみ）
 */
export function resetDiagnosisRecord(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  localStorage.removeItem(FINGERPRINT_KEY);
  sessionStorage.clear();
  console.log("診断記録をリセットしました（ローカルのみ）");
}

/**
 * Supabaseから保存済みのカード画像URLを取得
 * localStorageの復元が失敗した場合のフォールバック用
 *
 * 検索順序:
 * 1. フィンガープリントで検索（同一デバイス・ブラウザの場合）
 * 2. ユーザー名＋夢タイプで検索（フォールバック）
 */
export async function getSavedCardImageUrl(): Promise<string | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    // Step 1: フィンガープリントで検索
    const fingerprint = await getFingerprint();

    const { data: fpData, error: fpError } = await supabase
      .from("diagnosis_records")
      .select("card_image_url")
      .eq("fingerprint", fingerprint)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!fpError && fpData && fpData.length > 0 && fpData[0].card_image_url) {
      return fpData[0].card_image_url;
    }

    // Step 2: localStorageからユーザー名＋夢タイプを取得してフォールバック検索
    const savedData = getSavedDiagnosisData();
    if (savedData?.userName && savedData?.dreamType) {
      const { data: nameData, error: nameError } = await supabase
        .from("diagnosis_records")
        .select("card_image_url")
        .eq("user_name", savedData.userName)
        .eq("dream_type", savedData.dreamType)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!nameError && nameData && nameData.length > 0 && nameData[0].card_image_url) {
        return nameData[0].card_image_url;
      }
    }

    return null;
  } catch {
    return null;
  }
}



