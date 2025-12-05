/**
 * カード画像生成 - NanoBanana通常版使用
 * 
 * ワークフロー:
 * 1. テキスト情報をCanvas APIでフォント画像化（無料）
 * 2. フォント画像 + ベースカード → NanoBanana Editで合成（$0.039/回）
 * 
 * コスト: $0.039/回（約6円）
 */

import { DEFAULT_FONTS, loadCardFonts, getFontPath } from "./fontConfig";

// FAL AIはサーバー側で使用

export interface CardDataNanoBanana {
  userName: string;
  dreamType: string;
  dreamTypeName: string;
  dreamTypeDisplayName: string; // 不死鳥、妖狐等
  personalizedMessage: string;
  color: string;
  frameColor: string;
  cardImageUrl: string;
}

/**
 * エンブレム用テキスト画像を生成
 */
async function createEmblemTextImage(
  displayName: string,
  color: string,
  size: number = 200
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not available");

  // 円形背景
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, color + "CC");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 5, 0, Math.PI * 2);
  ctx.fill();

  // 白枠
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.stroke();

  // カスタムフォントを読み込み
  await loadCardFonts();
  await document.fonts.ready;
  // 追加の待機時間（フォント読み込み確実化）
  await new Promise(resolve => setTimeout(resolve, 200));

  // テキスト描画
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const emblemFont = DEFAULT_FONTS.emblem.primary;
  const userNameFont = DEFAULT_FONTS.userName.primary;

  // 「あなたは」
  ctx.font = `bold ${size * 0.12}px '${userNameFont.name}', ${DEFAULT_FONTS.userName.fallback}`;
  ctx.fillText("あなたは", size / 2, size / 2 - size * 0.15);

  // タイプ名（大きく）- 見出しフォント使用
  ctx.font = `900 ${size * 0.2}px '${emblemFont.name}', ${DEFAULT_FONTS.emblem.fallback}`;
  ctx.fillText(displayName, size / 2, size / 2);

  // 「タイプです」
  ctx.font = `bold ${size * 0.12}px '${userNameFont.name}', ${DEFAULT_FONTS.userName.fallback}`;
  ctx.fillText("タイプです", size / 2, size / 2 + size * 0.15);

  return canvas.toDataURL("image/png");
}

/**
 * メッセージ用テキスト画像を生成
 */
async function createMessageTextImage(
  userName: string,
  message: string,
  width: number = 600,
  height: number = 300
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not available");

  // 透明背景
  ctx.clearRect(0, 0, width, height);

  // カスタムフォントを読み込み
  await loadCardFonts();
  await document.fonts.ready;
  await new Promise(resolve => setTimeout(resolve, 200));

  ctx.fillStyle = "#333333";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const padding = 30;
  let y = padding;

  const userNameFont = DEFAULT_FONTS.userName.primary;
  const messageFont = DEFAULT_FONTS.message.primary;

  // ヘッダー「〇〇さんへ」
  ctx.font = `bold 24px '${userNameFont.name}', ${DEFAULT_FONTS.userName.fallback}`;
  ctx.fillText(`${userName}さんへ`, padding, y);
  y += 40;

  // メッセージ本文
  ctx.font = `500 18px '${messageFont.name}', ${DEFAULT_FONTS.message.fallback}`;
  const lineHeight = 30;
  const maxWidth = width - padding * 2;

  // 改行処理
  const lines = wrapText(ctx, message, maxWidth, 18);
  for (const line of lines) {
    if (y + lineHeight > height - padding) break;
    ctx.fillText(line, padding, y);
    y += lineHeight;
  }

  return canvas.toDataURL("image/png");
}

/**
 * テキストを自動改行
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number
): string[] {
  const messageFont = DEFAULT_FONTS.message.primary;
  ctx.font = `500 ${fontSize}px '${messageFont.name}', ${DEFAULT_FONTS.message.fallback}`;
  const words = text.split("");
  const lines: string[] = [];
  let currentLine = "";

  for (const char of words) {
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine !== "") {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * NanoBanana Editでカードを生成（サーバー経由）
 */
export async function generateCardWithNanoBanana(
  data: CardDataNanoBanana
): Promise<string> {
  // 1. エンブレムテキスト画像を生成
  const emblemBase64 = await createEmblemTextImage(
    data.dreamTypeDisplayName,
    data.color,
    200
  );

  // 2. メッセージテキスト画像を生成
  const messageBase64 = await createMessageTextImage(
    data.userName,
    data.personalizedMessage,
    600,
    300
  );

  // 3. ベースカード画像を読み込み
  const baseCardResponse = await fetch(data.cardImageUrl);
  const baseCardBlob = await baseCardResponse.blob();
  const baseCardBase64 = await blobToBase64(baseCardBlob);

  // 4. サーバーAPI経由でNanoBanana Editを実行
  const prompt = `Place the circular emblem badge in the top-left corner of the card (around 8% from left, 6% from top), and place the message text in the white frame area at the bottom (around 72% from top). Keep the original card design and artwork intact.`;

  const response = await fetch("/api/generate-card", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      baseCardBase64,
      emblemBase64,
      messageBase64,
      prompt,
    }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "カード生成に失敗しました");
  }

  return result.imageUrl;
}

/**
 * BlobをBase64に変換
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert blob to base64"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * 画像URLをダウンロード
 */
export async function downloadCardFromUrl(
  imageUrl: string,
  fileName: string = "kinman-card.png"
): Promise<void> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
}

