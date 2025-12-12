/**
 * レート制限 Middleware
 * 同一IPからの連続アクセスを制限
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// インメモリキャッシュ（本番ではRedisを推奨）
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

// 設定
const RATE_LIMIT_WINDOW = 60 * 1000; // 1分
const MAX_REQUESTS = 10; // 1分あたりの最大リクエスト数（診断API用）
const DIAGNOSE_MAX_REQUESTS = 3; // 診断APIは厳しめ

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 診断APIのみレート制限を適用
  if (pathname === "/api/diagnose") {
    const ip = getClientIP(request);
    const key = `diagnose:${ip}`;
    
    const result = checkRateLimit(key, DIAGNOSE_MAX_REQUESTS);
    
    if (!result.allowed) {
      return NextResponse.json(
        { 
          error: "リクエストが多すぎます。しばらく待ってから再度お試しください。",
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((result.resetTime - Date.now()) / 1000)),
            "X-RateLimit-Limit": String(DIAGNOSE_MAX_REQUESTS),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(result.resetTime),
          }
        }
      );
    }
    
    // レート制限ヘッダーを追加
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", String(DIAGNOSE_MAX_REQUESTS));
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
    response.headers.set("X-RateLimit-Reset", String(result.resetTime));
    
    return response;
  }
  
  // その他のAPIにも緩いレート制限
  if (pathname.startsWith("/api/")) {
    const ip = getClientIP(request);
    const key = `api:${ip}`;
    
    const result = checkRateLimit(key, MAX_REQUESTS);
    
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }
  }
  
  return NextResponse.next();
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded 
    ? forwarded.split(",")[0].trim() 
    : request.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(key: string, maxRequests: number): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const cached = rateLimitCache.get(key);
  
  if (!cached || now > cached.resetTime) {
    // 新しいウィンドウを開始
    rateLimitCache.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    };
  }
  
  if (cached.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: cached.resetTime,
    };
  }
  
  // カウントをインクリメント
  cached.count++;
  rateLimitCache.set(key, cached);
  
  return {
    allowed: true,
    remaining: maxRequests - cached.count,
    resetTime: cached.resetTime,
  };
}

// 定期的にキャッシュをクリーンアップ
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitCache.entries()) {
    if (now > value.resetTime) {
      rateLimitCache.delete(key);
    }
  }
}, 60 * 1000); // 1分ごと

export const config = {
  matcher: ["/api/:path*"],
};
























