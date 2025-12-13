/**
 * クライアントIP取得API
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Vercelの場合はx-forwarded-forヘッダーからIP取得
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded 
    ? forwarded.split(",")[0].trim() 
    : request.headers.get("x-real-ip") || "unknown";

  return NextResponse.json({ ip });
}

























