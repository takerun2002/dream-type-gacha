import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabaseクライアント
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 同時処理可能数
const MAX_CONCURRENT = 3;

// キューの有効期限（5分）
const QUEUE_EXPIRY_MS = 5 * 60 * 1000;

interface QueueEntry {
  id: string;
  session_id: string;
  status: "waiting" | "processing" | "completed";
  created_at: string;
  position?: number;
}

/**
 * キューに参加 (POST)
 */
export async function POST(request: Request) {
  try {
    const { sessionId, action } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    // Supabase未設定の場合はキューなしで即時処理可能
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        canProceed: true,
        position: 0,
        totalWaiting: 0,
        message: "キューシステムは無効です",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 古いエントリをクリーンアップ
    const expiryTime = new Date(Date.now() - QUEUE_EXPIRY_MS).toISOString();
    await supabase
      .from("generation_queue")
      .delete()
      .lt("created_at", expiryTime);

    if (action === "join") {
      // 既存のエントリをチェック
      const { data: existing } = await supabase
        .from("generation_queue")
        .select("*")
        .eq("session_id", sessionId)
        .single();

      if (existing) {
        // 既に参加済み - 現在の状態を返す
        return await getQueueStatus(supabase, sessionId);
      }

      // 新規エントリを追加
      const { error: insertError } = await supabase
        .from("generation_queue")
        .insert({
          session_id: sessionId,
          status: "waiting",
        });

      if (insertError) {
        console.error("Queue insert error:", insertError);
        // エラー時は即時処理可能として返す
        return NextResponse.json({
          canProceed: true,
          position: 0,
          totalWaiting: 0,
        });
      }
    }

    if (action === "complete") {
      // 処理完了 - エントリを削除
      await supabase
        .from("generation_queue")
        .delete()
        .eq("session_id", sessionId);

      return NextResponse.json({ success: true });
    }

    if (action === "cancel") {
      // キャンセル - エントリを削除
      await supabase
        .from("generation_queue")
        .delete()
        .eq("session_id", sessionId);

      return NextResponse.json({ success: true });
    }

    // デフォルト: 状態を取得
    return await getQueueStatus(supabase, sessionId);
  } catch (error) {
    console.error("Queue API error:", error);
    // エラー時は即時処理可能として返す（ユーザー体験を優先）
    return NextResponse.json({
      canProceed: true,
      position: 0,
      totalWaiting: 0,
      error: "キューシステムエラー",
    });
  }
}

/**
 * キュー状態を取得 (GET)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        canProceed: true,
        position: 0,
        totalWaiting: 0,
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    if (sessionId) {
      return await getQueueStatus(supabase, sessionId);
    }

    // 全体の待ち人数のみ返す
    const { count } = await supabase
      .from("generation_queue")
      .select("*", { count: "exact", head: true })
      .eq("status", "waiting");

    return NextResponse.json({
      totalWaiting: count || 0,
    });
  } catch (error) {
    console.error("Queue GET error:", error);
    return NextResponse.json({
      canProceed: true,
      position: 0,
      totalWaiting: 0,
    });
  }
}

// キュー状態を取得するヘルパー
async function getQueueStatus(supabase: ReturnType<typeof createClient>, sessionId: string) {
  // 現在処理中の数を取得
  const { count: processingCount } = await supabase
    .from("generation_queue")
    .select("*", { count: "exact", head: true })
    .eq("status", "processing");

  // 自分より前の待ち人数を取得
  const { data: myEntry } = await supabase
    .from("generation_queue")
    .select("*")
    .eq("session_id", sessionId)
    .single();

  if (!myEntry) {
    // エントリがない場合は即時処理可能
    return NextResponse.json({
      canProceed: true,
      position: 0,
      totalWaiting: 0,
    });
  }

  // 自分より前に待っている人数
  const { count: waitingBefore } = await supabase
    .from("generation_queue")
    .select("*", { count: "exact", head: true })
    .eq("status", "waiting")
    .lt("created_at", myEntry.created_at);

  const position = (waitingBefore || 0) + 1;
  const currentProcessing = processingCount || 0;

  // 処理中が上限未満、かつ自分が先頭なら処理可能
  const canProceed = currentProcessing < MAX_CONCURRENT && position === 1;

  if (canProceed && myEntry.status === "waiting") {
    // ステータスを「処理中」に更新
    await supabase
      .from("generation_queue")
      .update({ status: "processing" })
      .eq("session_id", sessionId);
  }

  // 全体の待ち人数
  const { count: totalWaiting } = await supabase
    .from("generation_queue")
    .select("*", { count: "exact", head: true })
    .eq("status", "waiting");

  // 推定待ち時間（1人あたり約30秒）
  const estimatedWaitSeconds = position * 30;

  return NextResponse.json({
    canProceed,
    position,
    totalWaiting: totalWaiting || 0,
    estimatedWaitSeconds,
    status: canProceed ? "processing" : "waiting",
  });
}

