/**
 * カード画像生成API - Satori + Sharp 版
 * ピクセルパーフェクトな配置を実現
 * コスト: 無料
 */

import { NextRequest, NextResponse } from "next/server";
import satori from "satori";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import React from "react";

// ==================== 型定義 ====================

interface CardTemplate {
  id: string;
  cardImage: string;
  // 左上の丸いエリア（アイコン用）
  iconArea: { x: number; y: number; size: number };
  // 横長のタイプ名エリア
  typeNameArea: { x: number; y: number; width: number; height: number };
  // 下部のメッセージエリア
  messageArea: { x: number; y: number; width: number; height: number };
  // カラー
  primaryColor: string;
  textColor: string;
}

interface GenerateCardRequest {
  dreamType: string;
  typeName: string;         // 「情熱の不死鳥タイプ」
  displayName: string;      // 「不死鳥」
  icon: string;             // 🔥
  userName: string;
  personalizedMessage: string;
}

// ==================== テンプレート設定 ====================
// 画像サイズ: 1024 x 1365 px

const CARD_TEMPLATES: Record<string, CardTemplate> = {
  phoenix: {
    id: "phoenix",
    cardImage: "/cards/kinman-phoenix.png",
    iconArea: { x: 28, y: 28, size: 100 },
    typeNameArea: { x: 140, y: 28, width: 200, height: 50 },
    messageArea: { x: 50, y: 1090, width: 924, height: 230 },
    primaryColor: "#f97316",
    textColor: "#333333",
  },
  kitsune: {
    id: "kitsune",
    cardImage: "/cards/kinman-kitsune.png",
    iconArea: { x: 28, y: 28, size: 100 },
    typeNameArea: { x: 140, y: 28, width: 200, height: 50 },
    messageArea: { x: 50, y: 1090, width: 924, height: 230 },
    primaryColor: "#eab308",
    textColor: "#333333",
  },
  pegasus: {
    id: "pegasus",
    cardImage: "/cards/kinman-pegasus.png",
    iconArea: { x: 28, y: 28, size: 100 },
    typeNameArea: { x: 140, y: 28, width: 200, height: 50 },
    messageArea: { x: 50, y: 1090, width: 924, height: 230 },
    primaryColor: "#a855f7",
    textColor: "#333333",
  },
  elephant: {
    id: "elephant",
    cardImage: "/cards/kinman-elephant.png",
    iconArea: { x: 28, y: 28, size: 100 },
    typeNameArea: { x: 140, y: 28, width: 200, height: 50 },
    messageArea: { x: 50, y: 1090, width: 924, height: 230 },
    primaryColor: "#6b7280",
    textColor: "#333333",
  },
  deer: {
    id: "deer",
    cardImage: "/cards/kinman-deer.png",
    iconArea: { x: 28, y: 28, size: 100 },
    typeNameArea: { x: 140, y: 28, width: 200, height: 50 },
    messageArea: { x: 50, y: 1090, width: 924, height: 230 },
    primaryColor: "#22c55e",
    textColor: "#333333",
  },
  dragon: {
    id: "dragon",
    cardImage: "/cards/kinman-dragon.png",
    iconArea: { x: 28, y: 28, size: 100 },
    typeNameArea: { x: 140, y: 28, width: 200, height: 50 },
    messageArea: { x: 50, y: 1090, width: 924, height: 230 },
    primaryColor: "#ef4444",
    textColor: "#333333",
  },
  turtle: {
    id: "turtle",
    cardImage: "/cards/kinman-turtle.png",
    iconArea: { x: 28, y: 28, size: 100 },
    typeNameArea: { x: 140, y: 28, width: 200, height: 50 },
    messageArea: { x: 50, y: 1090, width: 924, height: 230 },
    primaryColor: "#14b8a6",
    textColor: "#333333",
  },
  shark: {
    id: "shark",
    cardImage: "/cards/kinman-shark.png",
    iconArea: { x: 28, y: 28, size: 100 },
    typeNameArea: { x: 140, y: 28, width: 200, height: 50 },
    messageArea: { x: 50, y: 1090, width: 924, height: 230 },
    primaryColor: "#3b82f6",
    textColor: "#333333",
  },
  wolf: {
    id: "wolf",
    cardImage: "/cards/kinman-wolf.png",
    iconArea: { x: 28, y: 28, size: 100 },
    typeNameArea: { x: 140, y: 28, width: 200, height: 50 },
    messageArea: { x: 50, y: 1090, width: 924, height: 230 },
    primaryColor: "#8b5cf6",
    textColor: "#333333",
  },
};

// 画像サイズ
const CARD_WIDTH = 1024;
const CARD_HEIGHT = 1365;

// ==================== フォント読み込み ====================

async function loadFont(): Promise<ArrayBuffer> {
  // 新ゴProを使用（なければNoto Sans JPにフォールバック）
  const fontPaths = [
    path.join(process.cwd(), "public", "fonts", "A-OTF-ShinGoPro-Regular.otf"),
    path.join(process.cwd(), "public", "fonts", "NotoSansJP-Regular.ttf"),
  ];

  for (const fontPath of fontPaths) {
    try {
      const fontBuffer = fs.readFileSync(fontPath);
      return fontBuffer.buffer.slice(
        fontBuffer.byteOffset,
        fontBuffer.byteOffset + fontBuffer.byteLength
      );
    } catch {
      continue;
    }
  }

  throw new Error("No Japanese font available");
}

// ==================== テキストオーバーレイSVG生成 ====================

async function generateTextOverlaySVG(
  data: GenerateCardRequest,
  template: CardTemplate,
  fontData: ArrayBuffer
): Promise<string> {
  // メッセージを適切な長さに分割
  const maxCharsPerLine = 35;
  const messageLines = wrapText(data.personalizedMessage, maxCharsPerLine);

  const element = React.createElement(
    "div",
    {
      style: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        display: "flex",
        position: "relative",
        fontFamily: "NotoSansJP",
      },
    },
    [
      // 左上の丸いエリア - アイコンとタイプ名
      React.createElement(
        "div",
        {
          key: "header",
          style: {
            position: "absolute",
            left: template.iconArea.x,
            top: template.iconArea.y,
            display: "flex",
            alignItems: "center",
            gap: 8,
          },
        },
        [
          // アイコン
          React.createElement(
            "div",
            {
              key: "icon",
              style: {
                width: template.iconArea.size,
                height: template.iconArea.size,
                borderRadius: "50%",
                backgroundColor: template.primaryColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 48,
                color: "white",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              },
            },
            data.icon
          ),
          // タイプ名バッジ
          React.createElement(
            "div",
            {
              key: "typeName",
              style: {
                backgroundColor: template.primaryColor,
                color: "white",
                padding: "8px 16px",
                borderRadius: 25,
                fontSize: 20,
                fontWeight: "bold",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                whiteSpace: "nowrap",
              },
            },
            `${data.displayName}タイプ`
          ),
        ]
      ),
      // 下部メッセージエリア
      React.createElement(
        "div",
        {
          key: "message",
          style: {
            position: "absolute",
            left: template.messageArea.x,
            top: template.messageArea.y,
            width: template.messageArea.width,
            height: template.messageArea.height,
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
          },
        },
        [
          // ユーザー名
          React.createElement(
            "div",
            {
              key: "userName",
              style: {
                fontSize: 22,
                fontWeight: "bold",
                color: template.primaryColor,
                marginBottom: 8,
              },
            },
            `${data.userName}さんへ`
          ),
          // メッセージ本文
          React.createElement(
            "div",
            {
              key: "messageText",
              style: {
                fontSize: 16,
                lineHeight: 1.7,
                color: template.textColor,
                whiteSpace: "pre-wrap",
              },
            },
            messageLines.join("\n")
          ),
        ]
      ),
    ]
  );

  const svg = await satori(element, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts: [
      {
        name: "NotoSansJP",
        data: fontData,
        weight: 400,
        style: "normal",
      },
    ],
  });

  return svg;
}

// ==================== テキスト折り返し ====================

function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let currentLine = "";

  // 改行を保持
  const paragraphs = text.split("\n");

  for (const paragraph of paragraphs) {
    for (const char of paragraph) {
      currentLine += char;
      if (currentLine.length >= maxChars) {
        lines.push(currentLine);
        currentLine = "";
      }
    }
    if (currentLine) {
      lines.push(currentLine);
      currentLine = "";
    }
  }

  return lines;
}

// ==================== 画像合成 ====================

async function compositeCard(
  baseCardPath: string,
  textOverlaySvg: string
): Promise<Buffer> {
  const cardImagePath = path.join(process.cwd(), "public", baseCardPath);

  // ベースカード画像を読み込み
  const baseCard = sharp(cardImagePath);

  // SVGをPNGに変換
  const textOverlayPng = await sharp(Buffer.from(textOverlaySvg))
    .png()
    .toBuffer();

  // 合成
  const result = await baseCard
    .composite([
      {
        input: textOverlayPng,
        top: 0,
        left: 0,
      },
    ])
    .png({ quality: 90 })
    .toBuffer();

  return result;
}

// ==================== API ハンドラー ====================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const {
      dreamType,
      typeName,
      displayName,
      icon,
      userName,
      personalizedMessage,
    } = body as GenerateCardRequest;

    // 入力検証
    if (!dreamType || !userName || !personalizedMessage) {
      return NextResponse.json(
        { error: "必須パラメータが不足しています" },
        { status: 400 }
      );
    }

    // テンプレート取得
    const template = CARD_TEMPLATES[dreamType];
    if (!template) {
      return NextResponse.json(
        { error: `不明なタイプ: ${dreamType}` },
        { status: 400 }
      );
    }

    console.log(`カード生成開始: ${dreamType} for ${userName}`);

    // フォント読み込み
    const fontData = await loadFont();

    // テキストオーバーレイSVG生成
    const textOverlaySvg = await generateTextOverlaySVG(
      {
        dreamType,
        typeName: typeName || `${displayName}タイプ`,
        displayName: displayName || dreamType,
        icon: icon || "✨",
        userName,
        personalizedMessage,
      },
      template,
      fontData
    );

    // 画像合成
    const pngBuffer = await compositeCard(template.cardImage, textOverlaySvg);

    console.log(`カード生成完了: ${pngBuffer.length} bytes`);

    // PNG画像を返す
    return new NextResponse(new Uint8Array(pngBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": pngBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("カード生成エラー:", error);
    return NextResponse.json(
      {
        error: "カード生成に失敗しました",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "ok",
    message: "Card generation API (Satori + Sharp)",
    supportedTypes: Object.keys(CARD_TEMPLATES),
  });
}



