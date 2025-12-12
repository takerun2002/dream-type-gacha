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
    const { password, inquiryId, status } = body;

    // パスワード認証
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: "認証エラー" },
        { status: 401 }
      );
    }

    // 入力バリデーション
    if (!inquiryId || !status) {
      return NextResponse.json(
        { success: false, error: "必須項目が不足しています" },
        { status: 400 }
      );
    }

    // ステータスバリデーション
    const validStatuses = ["open", "in_progress", "resolved"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "無効なステータスです" },
        { status: 400 }
      );
    }

    // Supabase未設定の場合
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, error: "Supabase未設定" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // ステータス更新データ
    const updateData: { status: string; resolved_at?: string | null } = { status };

    // 解決済みの場合はresolved_atを設定
    if (status === "resolved") {
      updateData.resolved_at = new Date().toISOString();
    } else {
      updateData.resolved_at = null;
    }

    const { error } = await supabase
      .from("support_inquiries")
      .update(updateData)
      .eq("id", inquiryId);

    if (error) {
      console.error("ステータス更新エラー:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "ステータスを更新しました",
    });
  } catch (error) {
    console.error("Support status API error:", error);
    return NextResponse.json(
      { success: false, error: "サーバーエラー" },
      { status: 500 }
    );
  }
}
