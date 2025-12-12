import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "kinmanadmin2025";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, userName } = body;

    // パスワード認証
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: "認証エラー" },
        { status: 401 }
      );
    }

    if (!userName) {
      return NextResponse.json(
        { success: false, error: "ユーザー名が必要です" },
        { status: 400 }
      );
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, error: "Supabase未設定" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // generation_logsからカード画像を取得
    const { data: cardData, error } = await supabase
      .from("generation_logs")
      .select("card_image_url, card_image_base64")
      .eq("user_name", userName)
      .eq("success", true)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!cardData || cardData.length === 0) {
      return NextResponse.json(
        { success: false, error: "カード画像が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      cardImageUrl: cardData[0].card_image_url || null,
      cardImageBase64: cardData[0].card_image_base64 || null,
    });
  } catch (error) {
    console.error("Card image API error:", error);
    return NextResponse.json(
      { success: false, error: "サーバーエラー" },
      { status: 500 }
    );
  }
}
