import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: "認証エラー" },
        { status: 401 }
      );
    }

    // chat_sessionsテーブルからセッション一覧を取得
    const { data: sessions, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      // テーブルが存在しない場合は空配列を返す
      if (error.code === "42P01") {
        return NextResponse.json({
          success: true,
          sessions: [],
          message: "チャットセッションテーブルはまだ作成されていません",
        });
      }
      console.error("Chat sessions fetch error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessions: sessions || [],
    });
  } catch (error) {
    console.error("Chat sessions API error:", error);
    return NextResponse.json(
      { success: false, error: "サーバーエラー" },
      { status: 500 }
    );
  }
}
