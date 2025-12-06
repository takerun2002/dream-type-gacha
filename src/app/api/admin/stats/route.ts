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
    const { password } = body;

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
        stats: {
          totalDiagnoses: 0,
          todayDiagnoses: 0,
          typeDistribution: {},
          hourlyDistribution: [],
          recentDiagnoses: [],
          queueStatus: { waiting: 0, processing: 0 },
        },
        message: "Supabase未設定",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 統計データを取得
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // 総診断数
    const { count: totalDiagnoses } = await supabase
      .from("diagnosis_records")
      .select("*", { count: "exact", head: true });

    // 今日の診断数
    const { count: todayDiagnoses } = await supabase
      .from("diagnosis_records")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart);

    // タイプ別分布
    const { data: typeData } = await supabase
      .from("diagnosis_records")
      .select("dream_type");

    const typeDistribution: Record<string, number> = {};
    if (typeData) {
      typeData.forEach((record) => {
        const type = record.dream_type || "unknown";
        typeDistribution[type] = (typeDistribution[type] || 0) + 1;
      });
    }

    // 時間帯別分布（過去7日）
    const { data: hourlyData } = await supabase
      .from("diagnosis_records")
      .select("created_at")
      .gte("created_at", weekAgo);

    const hourlyDistribution: number[] = new Array(24).fill(0);
    if (hourlyData) {
      hourlyData.forEach((record) => {
        const hour = new Date(record.created_at).getHours();
        hourlyDistribution[hour]++;
      });
    }

    // 最近の診断（最新10件）
    const { data: recentDiagnoses } = await supabase
      .from("diagnosis_records")
      .select("user_name, dream_type, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    // キュー状態
    const { count: waitingCount } = await supabase
      .from("generation_queue")
      .select("*", { count: "exact", head: true })
      .eq("status", "waiting");

    const { count: processingCount } = await supabase
      .from("generation_queue")
      .select("*", { count: "exact", head: true })
      .eq("status", "processing");

    return NextResponse.json({
      success: true,
      stats: {
        totalDiagnoses: totalDiagnoses || 0,
        todayDiagnoses: todayDiagnoses || 0,
        typeDistribution,
        hourlyDistribution,
        recentDiagnoses: recentDiagnoses || [],
        queueStatus: {
          waiting: waitingCount || 0,
          processing: processingCount || 0,
        },
      },
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      { success: false, error: "サーバーエラー" },
      { status: 500 }
    );
  }
}

