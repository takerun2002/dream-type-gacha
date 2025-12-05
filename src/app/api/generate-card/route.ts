import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

// FAL AI初期化
fal.config({
  credentials: process.env.FAL_KEY || "",
});

// 型定義
interface FalImageFile {
  url: string;
  content_type?: string;
  file_name?: string;
  file_size?: number;
  width?: number;
  height?: number;
}

interface FalNanoBananaResult {
  data: {
    images: FalImageFile[];
    description?: string;
  };
  requestId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      baseCardBase64,
      emblemBase64,
      messageBase64,
      prompt,
    } = body;

    if (!baseCardBase64 || !emblemBase64 || !messageBase64) {
      return NextResponse.json(
        { success: false, error: "画像データが必要です" },
        { status: 400 }
      );
    }

    // NanoBanana Editで合成
    const defaultPrompt = prompt || 
      "Overlay the second image (circular emblem) in the top-left corner and the third image (message text) in the white frame at the bottom of the first image (card). Keep the original card design intact.";

    console.log("NanoBanana Edit リクエスト開始...");

    try {
      // fal.subscribe を使用（長時間のリクエストに対応）
      const result = await fal.subscribe("fal-ai/nano-banana/edit", {
        input: {
          prompt: defaultPrompt,
          image_urls: [
            baseCardBase64,
            emblemBase64,
            messageBase64,
          ],
          num_images: 1,
          output_format: "png",
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS" && update.logs) {
            update.logs.map((log) => log.message).forEach((msg) => console.log("FAL:", msg));
          }
        },
      }) as FalNanoBananaResult;

      console.log("NanoBanana Edit 結果:", JSON.stringify(result, null, 2));

      // 結果は result.data.images にある
      if (result.data && result.data.images && result.data.images.length > 0) {
        return NextResponse.json({
          success: true,
          imageUrl: result.data.images[0].url,
        });
      }

      throw new Error("NanoBanana Edit returned no images");
    } catch (error: any) {
      console.error("NanoBanana Edit エラー:", error);
      console.error("エラー詳細:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        { 
          success: false, 
          error: error.message || "カード生成に失敗しました" 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("API エラー:", error);
    return NextResponse.json(
      { success: false, error: error.message || "サーバーエラー" },
      { status: 500 }
    );
  }
}
