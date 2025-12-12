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

    // 全ユーザーの診断記録を取得（新しい順）
    const { data: allDiagnosesRaw } = await supabase
      .from("diagnosis_records")
      .select("id, user_name, dream_type, created_at, ip_address, fingerprint, user_agent")
      .order("created_at", { ascending: false });

    // 各診断に対応するカード画像のフラグを取得（Base64は返さない）
    interface DiagnosisWithCard {
      id: string;
      user_name: string;
      dream_type: string;
      created_at: string;
      ip_address?: string;
      fingerprint?: string;
      user_agent?: string;
      card_image_url?: string;
      has_card_image?: boolean;
    }

    const recentDiagnoses: DiagnosisWithCard[] = [];

    if (allDiagnosesRaw) {
      // カード画像URLを持つユーザー名を一括取得
      const { data: cardDataAll } = await supabase
        .from("generation_logs")
        .select("user_name, card_image_url, card_image_base64")
        .eq("success", true);

      // ユーザー名→画像データのマップを作成
      const cardImageMap = new Map<string, { url?: string; hasBase64: boolean }>();
      if (cardDataAll) {
        for (const card of cardDataAll) {
          // 同じユーザーの最新のカード情報を保持
          if (!cardImageMap.has(card.user_name)) {
            cardImageMap.set(card.user_name, {
              url: card.card_image_url || undefined,
              hasBase64: !!card.card_image_base64,
            });
          }
        }
      }

      for (const diagnosis of allDiagnosesRaw) {
        const diagnosisWithCard: DiagnosisWithCard = { ...diagnosis };
        const cardInfo = cardImageMap.get(diagnosis.user_name);

        if (cardInfo) {
          diagnosisWithCard.card_image_url = cardInfo.url;
          diagnosisWithCard.has_card_image = !!(cardInfo.url || cardInfo.hasBase64);
        }

        recentDiagnoses.push(diagnosisWithCard);
      }
    }

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

    // 問い合わせ統計
    interface SupportInquiry {
      id: string;
      created_at: string;
      user_name: string | null;
      dream_type: string | null;
      fingerprint: string | null;
      issue_summary: string;
      conversation: unknown;
      status: string;
      resolved_at: string | null;
      notes: string | null;
    }

    let supportInquiries: SupportInquiry[] = [];
    let supportStats = {
      total: 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
    };

    try {
      const { data: inquiriesData, count: totalInquiries } = await supabase
        .from("support_inquiries")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(100);

      if (inquiriesData) {
        supportInquiries = inquiriesData as SupportInquiry[];
      }

      // ステータス別カウント
      const { count: openCount } = await supabase
        .from("support_inquiries")
        .select("*", { count: "exact", head: true })
        .eq("status", "open");

      const { count: inProgressCount } = await supabase
        .from("support_inquiries")
        .select("*", { count: "exact", head: true })
        .eq("status", "in_progress");

      const { count: resolvedCount } = await supabase
        .from("support_inquiries")
        .select("*", { count: "exact", head: true })
        .eq("status", "resolved");

      supportStats = {
        total: totalInquiries || 0,
        open: openCount || 0,
        inProgress: inProgressCount || 0,
        resolved: resolvedCount || 0,
      };
    } catch (supportError) {
      console.log("support_inquiries テーブル未作成の可能性:", supportError);
    }

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
        generationStats: {
          total: totalGenerations,
          successful: successfulGenerations,
          failed: totalGenerations - successfulGenerations,
          successRate: Math.round(successRate * 10) / 10,
          recentHour: recentGenerations,
        },
        supportInquiries,
        supportStats,
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

