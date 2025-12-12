import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 管理者パスワード
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

// Supabaseクライアント（サーバーサイド）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, fingerprint, clearAll, userName, searchQuery } = body;

    // パスワード認証
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: "認証エラー" },
        { status: 401 }
      );
    }

    // Supabase設定チェック
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: true,
        message: "Supabase未設定のため、ローカルデータのみクリアしてください",
        supabaseCleared: false,
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    if (clearAll) {
      // 全レコード削除（開発/テスト用）
      const { error } = await supabase
        .from("diagnosis_records")
        .delete()
        .neq("id", 0); // 全件削除

      if (error) {
        console.error("Supabase delete error:", error);
        return NextResponse.json({
          success: false,
          error: "データベースクリアに失敗: " + error.message,
        });
      }

      return NextResponse.json({
        success: true,
        message: "全ての診断記録をクリアしました",
        supabaseCleared: true,
      });
    }

    if (fingerprint) {
      // 特定のフィンガープリントの記録を削除
      const { error } = await supabase
        .from("diagnosis_records")
        .delete()
        .eq("fingerprint", fingerprint);

      if (error) {
        return NextResponse.json({
          success: false,
          error: "削除に失敗: " + error.message,
        });
      }

      return NextResponse.json({
        success: true,
        message: `フィンガープリント ${fingerprint} の記録を削除しました`,
        supabaseCleared: true,
      });
    }

    // ユーザー名で検索
    if (searchQuery) {
      const { data, error } = await supabase
        .from("diagnosis_records")
        .select("id, user_name, dream_type, created_at, fingerprint")
        .ilike("user_name", `%${searchQuery}%`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        return NextResponse.json({
          success: false,
          error: "検索に失敗: " + error.message,
        });
      }

      return NextResponse.json({
        success: true,
        records: data || [],
        count: data?.length || 0,
      });
    }

    // ユーザー名で削除
    if (userName) {
      // まず該当レコードを検索
      const { data: toDelete } = await supabase
        .from("diagnosis_records")
        .select("id, user_name")
        .eq("user_name", userName);

      if (!toDelete || toDelete.length === 0) {
        return NextResponse.json({
          success: false,
          error: `「${userName}」さんのレコードが見つかりません`,
        });
      }

      // 削除実行
      const { error } = await supabase
        .from("diagnosis_records")
        .delete()
        .eq("user_name", userName);

      if (error) {
        return NextResponse.json({
          success: false,
          error: "削除に失敗: " + error.message,
        });
      }

      return NextResponse.json({
        success: true,
        message: `「${userName}」さんの記録を削除しました（${toDelete.length}件）`,
        deletedCount: toDelete.length,
        supabaseCleared: true,
      });
    }

    return NextResponse.json({
      success: false,
      error: "fingerprint, userName, searchQuery, または clearAll を指定してください",
    });
  } catch (error) {
    console.error("Admin API error:", error);
    return NextResponse.json(
      { success: false, error: "サーバーエラー" },
      { status: 500 }
    );
  }
}

