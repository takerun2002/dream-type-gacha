import { NextResponse } from "next/server";

export async function POST() {
  try {
    // シンプルなセッションID生成
    const sessionId = `ras_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    return NextResponse.json({ sessionId });
  } catch (error) {
    console.error("Session creation error:", error);
    return NextResponse.json(
      { error: "セッションの作成に失敗しました" },
      { status: 500 }
    );
  }
}
