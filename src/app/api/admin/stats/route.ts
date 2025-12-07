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
    const { password, action, page = 1, limit = 50, searchQuery } = body;

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

    // アクション別処理
    if (action === "getAllRecords") {
      // 全診断記録（ページネーション）
      const offset = (page - 1) * limit;
      
      let query = supabase
        .from("diagnosis_records")
        .select("id, user_name, dream_type, created_at, fingerprint, ip_address, card_image_url", { count: "exact" });
      
      // 検索クエリがある場合
      if (searchQuery && searchQuery.trim()) {
        query = query.ilike("user_name", `%${searchQuery.trim()}%`);
      }
      
      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) {
        return NextResponse.json({
          success: false,
          error: "データ取得に失敗: " + error.message,
        });
      }
      
      return NextResponse.json({
        success: true,
        records: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      });
    }

    // 単一ユーザーの詳細取得
    if (action === "getUserDetail") {
      const { recordId } = body;
      
      const { data, error } = await supabase
        .from("diagnosis_records")
        .select("*")
        .eq("id", recordId)
        .single();
      
      if (error) {
        return NextResponse.json({
          success: false,
          error: "詳細取得に失敗: " + error.message,
        });
      }
      
      // 該当ユーザーの生成ログも取得
      const { data: logData } = await supabase
        .from("generation_logs")
        .select("*")
        .eq("user_name", data.user_name)
        .order("created_at", { ascending: false })
        .limit(5);
      
      return NextResponse.json({
        success: true,
        record: data,
        generationLogs: logData || [],
      });
    }

    if (action === "getErrorLogs") {
      // エラーログ取得
      const offset = (page - 1) * limit;
      
      const { data, count, error } = await supabase
        .from("generation_logs")
        .select("*", { count: "exact" })
        .eq("success", false)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) {
        return NextResponse.json({
          success: false,
          error: "エラーログ取得に失敗: " + error.message,
        });
      }
      
      return NextResponse.json({
        success: true,
        logs: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      });
    }

    if (action === "getAllLogs") {
      // 全カード生成ログ取得
      const offset = (page - 1) * limit;
      
      const { data, count, error } = await supabase
        .from("generation_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) {
        return NextResponse.json({
          success: false,
          error: "ログ取得に失敗: " + error.message,
        });
      }
      
      return NextResponse.json({
        success: true,
        logs: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      });
    }

    // 統計データを取得（デフォルト）
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

    // 時間帯別分布（過去7日）- PVとUPV
    const { data: hourlyData } = await supabase
      .from("diagnosis_records")
      .select("created_at, fingerprint")
      .gte("created_at", weekAgo);

    const hourlyDistribution: number[] = new Array(24).fill(0);
    const hourlyUniqueDistribution: number[] = new Array(24).fill(0);
    const hourlyUniqueUsers: Set<string>[] = Array.from({ length: 24 }, () => new Set());
    
    if (hourlyData) {
      hourlyData.forEach((record) => {
        const hour = new Date(record.created_at).getHours();
        hourlyDistribution[hour]++;
        if (record.fingerprint) {
          hourlyUniqueUsers[hour].add(record.fingerprint);
        }
      });
      // ユニークユーザー数を設定
      for (let i = 0; i < 24; i++) {
        hourlyUniqueDistribution[i] = hourlyUniqueUsers[i].size;
      }
    }
    
    // 日別分布（過去7日）
    const dailyDistribution: { date: string; pv: number; upv: number }[] = [];
    const dailyUsers: Map<string, Set<string>> = new Map();
    const dailyPV: Map<string, number> = new Map();
    
    if (hourlyData) {
      hourlyData.forEach((record) => {
        const date = new Date(record.created_at).toISOString().split('T')[0];
        dailyPV.set(date, (dailyPV.get(date) || 0) + 1);
        if (!dailyUsers.has(date)) {
          dailyUsers.set(date, new Set());
        }
        if (record.fingerprint) {
          dailyUsers.get(date)!.add(record.fingerprint);
        }
      });
      
      // 過去7日間のデータを生成
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        dailyDistribution.push({
          date: dateStr,
          pv: dailyPV.get(dateStr) || 0,
          upv: dailyUsers.get(dateStr)?.size || 0,
        });
      }
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

    // カード生成ログ（成功/失敗）
    const { data: generationLogs } = await supabase
      .from("generation_logs")
      .select("success, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);

    const totalGenerations = generationLogs?.length || 0;
    const successfulGenerations = generationLogs?.filter(log => log.success).length || 0;
    const successRate = totalGenerations > 0
      ? (successfulGenerations / totalGenerations) * 100
      : 0;

    // 最近1時間の生成数
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentGenerations = generationLogs?.filter(
      log => new Date(log.created_at) > oneHourAgo
    ).length || 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalDiagnoses: totalDiagnoses || 0,
        todayDiagnoses: todayDiagnoses || 0,
        typeDistribution,
        hourlyDistribution,
        hourlyUniqueDistribution,
        dailyDistribution,
        recentDiagnoses: recentDiagnoses || [],
        queueStatus: {
          waiting: waitingCount || 0,
          processing: processingCount || 0,
        },
        generationStats: {
          total: totalGenerations,
          successful: successfulGenerations,
          failed: totalGenerations - successfulGenerations,
          successRate: Math.round(successRate * 10) / 10,
          recentHour: recentGenerations,
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

