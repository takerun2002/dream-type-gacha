import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 管理者パスワード
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "kinmanadmin2025";

// Supabaseクライアント
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, limit = 50 } = body;

    // パスワード認証
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: "認証エラー" },
        { status: 401 }
      );
    }

    // Supabase未設定の場合
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: true,
        logs: [],
        message: "Supabase未設定",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 診断記録を取得（最新順）
    const { data: diagnosisLogs, error: diagnosisError } = await supabase
      .from("diagnosis_records")
      .select("user_name, dream_type, created_at, ip_address")
      .order("created_at", { ascending: false })
      .limit(limit);

    // キュー記録を取得（エラー検出用）
    const { data: queueLogs } = await supabase
      .from("generation_queue")
      .select("session_id, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    // 統計計算
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentDiagnoses = diagnosisLogs?.filter(
      (log) => new Date(log.created_at) > last24Hours
    ) || [];

    const recentHourDiagnoses = diagnosisLogs?.filter(
      (log) => new Date(log.created_at) > lastHour
    ) || [];

    // キューから処理中のものを検出（長時間処理中はエラーの可能性）
    const stuckProcessing = queueLogs?.filter(
      (log) => {
        if (log.status !== "processing") return false;
        const processingTime = now.getTime() - new Date(log.created_at).getTime();
        return processingTime > 5 * 60 * 1000; // 5分以上処理中
      }
    ) || [];

    return NextResponse.json({
      success: true,
      logs: diagnosisLogs || [],
      stats: {
        total: diagnosisLogs?.length || 0,
        last24Hours: recentDiagnoses.length,
        lastHour: recentHourDiagnoses.length,
        stuckProcessing: stuckProcessing.length,
      },
    });
  } catch (error) {
    console.error("Logs API error:", error);
    return NextResponse.json(
      { success: false, error: "サーバーエラー" },
      { status: 500 }
    );
  }
}













