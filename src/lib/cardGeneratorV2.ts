/**
 * カード画像生成 V2 - HTML/CSS + html2canvas 方式
 * 完全無料で高品質なテキスト合成を実現
 * 
 * ワークフロー:
 * 1. ベースカード画像を読み込み
 * 2. HTML/CSSでテキストオーバーレイを構築（Webフォント対応）
 * 3. html2canvasで透明PNGに変換
 * 4. Canvas APIで最終合成
 */

import html2canvas from "html2canvas";

export interface CardDataV2 {
  userName: string;
  dreamType: string; // 内部ID: phoenix, kitsune等
  dreamTypeName: string; // 日本語名: 鳳凰、狐等
  dreamTypeDisplayName: string; // 表示用: 不死鳥、妖狐等
  personalizedMessage: string;
  color: string;
  frameColor: string;
  cardImageUrl: string;
}

// タイプ別表示名マッピング（「不死鳥タイプ」のような表示用）
export const DREAM_TYPE_DISPLAY_NAMES: Record<string, string> = {
  phoenix: "不死鳥",
  kitsune: "妖狐",
  pegasus: "天馬",
  elephant: "聖象",
  deer: "神鹿",
  dragon: "龍神",
  turtle: "霊亀",
  shark: "鯱王",
  wolf: "月狼",
};

// Google Fontsからロードするフォント
const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;500;600;700;900&display=swap');
`;

/**
 * テキストオーバーレイ用のHTML要素を生成
 */
function createTextOverlayElement(data: CardDataV2, width: number, height: number): HTMLDivElement {
  const container = document.createElement("div");
  container.style.cssText = `
    position: absolute;
    width: ${width}px;
    height: ${height}px;
    pointer-events: none;
    font-family: 'Zen Maru Gothic', 'Noto Serif JP', sans-serif;
  `;

  // スタイルを追加
  const style = document.createElement("style");
  style.textContent = FONT_CSS;
  container.appendChild(style);

  // エンブレム（丸いバッジ）- 左上
  const emblem = document.createElement("div");
  const emblemSize = Math.min(width, height) * 0.15;
  const emblemX = width * 0.08;
  const emblemY = height * 0.06;
  
  emblem.style.cssText = `
    position: absolute;
    left: ${emblemX}px;
    top: ${emblemY}px;
    width: ${emblemSize}px;
    height: ${emblemSize}px;
    border-radius: 50%;
    background: linear-gradient(145deg, ${data.color}, ${data.frameColor});
    border: 3px solid white;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3), inset 0 2px 10px rgba(255,255,255,0.3);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  `;

  // エンブレム内のテキスト
  emblem.innerHTML = `
    <div style="
      color: white;
      font-size: ${emblemSize * 0.14}px;
      font-weight: 500;
      line-height: 1.2;
      text-shadow: 0 1px 3px rgba(0,0,0,0.5);
    ">あなたは</div>
    <div style="
      color: white;
      font-size: ${emblemSize * 0.22}px;
      font-weight: 900;
      line-height: 1.1;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
      font-family: 'Noto Serif JP', serif;
    ">${data.dreamTypeDisplayName}</div>
    <div style="
      color: white;
      font-size: ${emblemSize * 0.14}px;
      font-weight: 500;
      line-height: 1.2;
      text-shadow: 0 1px 3px rgba(0,0,0,0.5);
    ">タイプです</div>
  `;
  container.appendChild(emblem);

  // 下部のテキストエリア（白枠内のメッセージ）
  const messageBox = document.createElement("div");
  const messageWidth = width * 0.88;
  const messageHeight = height * 0.25;
  const messageX = (width - messageWidth) / 2;
  const messageY = height * 0.72;
  
  messageBox.style.cssText = `
    position: absolute;
    left: ${messageX}px;
    top: ${messageY}px;
    width: ${messageWidth}px;
    height: ${messageHeight}px;
    padding: ${messageHeight * 0.1}px;
    box-sizing: border-box;
    overflow: hidden;
  `;

  // ヘッダー「〇〇さんへ」
  const header = document.createElement("div");
  header.style.cssText = `
    color: #2d1f3d;
    font-size: ${messageHeight * 0.12}px;
    font-weight: 700;
    margin-bottom: ${messageHeight * 0.05}px;
    font-family: 'Zen Maru Gothic', sans-serif;
  `;
  header.textContent = `${data.userName}さんへ`;
  messageBox.appendChild(header);

  // メッセージ本文
  const messageText = document.createElement("div");
  messageText.style.cssText = `
    color: #333333;
    font-size: ${messageHeight * 0.09}px;
    font-weight: 500;
    line-height: 1.7;
    font-family: 'Zen Maru Gothic', sans-serif;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 6;
    -webkit-box-orient: vertical;
  `;
  messageText.textContent = data.personalizedMessage;
  messageBox.appendChild(messageText);

  container.appendChild(messageBox);

  return container;
}

/**
 * カード画像を生成（V2 - 高精度版）
 */
export async function generateCardV2(
  canvas: HTMLCanvasElement,
  data: CardDataV2
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not available");

  // ベースカード画像を読み込み
  const baseImage = await loadImage(data.cardImageUrl);
  
  // Canvasサイズを設定
  canvas.width = baseImage.width;
  canvas.height = baseImage.height;

  // ベースカードを描画
  ctx.drawImage(baseImage, 0, 0);

  // テキストオーバーレイ用の一時コンテナを作成
  const overlayContainer = document.createElement("div");
  overlayContainer.style.cssText = `
    position: fixed;
    left: -9999px;
    top: -9999px;
    width: ${baseImage.width}px;
    height: ${baseImage.height}px;
  `;

  const textOverlay = createTextOverlayElement(data, baseImage.width, baseImage.height);
  overlayContainer.appendChild(textOverlay);
  document.body.appendChild(overlayContainer);

  // フォントの読み込みを待つ
  await document.fonts.ready;
  await new Promise(resolve => setTimeout(resolve, 100)); // 追加の待機

  try {
    // html2canvasでテキストオーバーレイを画像化
    const overlayCanvas = await html2canvas(textOverlay, {
      backgroundColor: null, // 透明背景
      scale: 1,
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    // オーバーレイをメインCanvasに合成
    ctx.drawImage(overlayCanvas, 0, 0);
  } finally {
    // クリーンアップ
    document.body.removeChild(overlayContainer);
  }
}

/**
 * 画像を読み込む
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * CanvasをBlobとして取得
 */
export function canvasToBlob(canvas: HTMLCanvasElement, type = "image/png"): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to convert canvas to blob"));
      },
      type,
      0.95
    );
  });
}

/**
 * CanvasをDataURLとして取得
 */
export function canvasToDataURL(canvas: HTMLCanvasElement, type = "image/png"): string {
  return canvas.toDataURL(type, 0.95);
}

/**
 * 画像をダウンロード
 */
export async function downloadCardV2(
  canvas: HTMLCanvasElement,
  fileName = "my-kinman-card.png"
): Promise<void> {
  const dataUrl = canvasToDataURL(canvas);
  const link = document.createElement("a");
  link.download = fileName;
  link.href = dataUrl;
  link.click();
}









