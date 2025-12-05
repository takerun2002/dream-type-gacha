// カード画像にテキストを合成するユーティリティ
// Canvas API版（完全無料）- カスタムフォント対応
// 丸い部分にタイプ色＋名前、白枠に診断内容を配置

export interface CardTextConfig {
  userName: string;
  dreamTypeName: string;
  dreamTypeNameEn?: string;
  personalizedMessage?: string; // Gemini生成のパーソナライズメッセージ
  color?: string;
  frameColor?: string;
}

export interface TextBoxConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  padding: number;
}

// 丸いエンブレムの設定（左上）
export const CIRCULAR_EMBLEM_CONFIG = {
  x: 80, // 左上からのX座標 (微調整)
  y: 80, // 左上からのY座標 (微調整)
  radius: 55, // 半径 (微調整)
};

// デフォルトのテキストボックス設定（カードの下部テキスト領域）
export const DEFAULT_TEXT_BOX: TextBoxConfig = {
  x: 40,
  y: 750, // テキストエリアの開始位置を少し上に調整
  width: 664,
  height: 260, // 高さを広げてより多くのテキストを収容
  padding: 30, // パディングを増やして余白を確保
};

// フォント設定（後でカスタムフォントに差し替え可能）
export const FONT_CONFIG = {
  primary: {
    family: '"Zen Maru Gothic", "Hiragino Sans", "Meiryo", sans-serif', // 丸ゴシック系を優先
    loaded: false,
  },
  fallback: {
    family: '"Hiragino Sans", "Meiryo", "Yu Gothic", sans-serif',
  },
};

// フォントスタイル
export const FONT_STYLES = {
  // 丸いエンブレム用（小さめ）
  emblem: {
    weight: '700',
    size: 13, // 少し小さくして収まりを良くする
  },
  // ユーザー名用
  userName: {
    weight: '700',
    size: 18,
  },
  // タイプ名用（メイン）
  typeName: {
    weight: '900',
    size: 26, // 少し小さく
  },
  // 英語名用
  typeNameEn: {
    weight: '600',
    size: 12,
  },
  // 診断メッセージ用（白枠内）
  message: {
    weight: '500',
    size: 15, // 少し小さくして読みやすく
    lineHeight: 1.8, // 行間を広げる
  },
};

/**
 * カスタムフォントを読み込む
 */
export async function loadCustomFont(
  fontUrl: string,
  fontFamily: string = "CustomFont"
): Promise<boolean> {
  try {
    const font = new FontFace(fontFamily, `url(${fontUrl})`);
    const loadedFont = await font.load();
    document.fonts.add(loadedFont);
    FONT_CONFIG.primary.family = `"${fontFamily}", ${FONT_CONFIG.fallback.family}`;
    FONT_CONFIG.primary.loaded = true;
    console.log(`Font loaded: ${fontFamily}`);
    return true;
  } catch (error) {
    console.warn(`Font load failed: ${fontFamily}`, error);
    return false;
  }
}

/**
 * Canvas上にカード画像とテキストを合成
 */
export async function generateCardCanvas(
  canvas: HTMLCanvasElement,
  cardImageUrl: string,
  textConfig: CardTextConfig,
  textBoxConfig: TextBoxConfig = DEFAULT_TEXT_BOX
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context not available");
  }

  // 画像を読み込む
  const image = await loadImage(cardImageUrl);

  // Canvasサイズを画像に合わせる
  canvas.width = image.width;
  canvas.height = image.height;

  // 画像を描画
  ctx.drawImage(image, 0, 0);

  // 丸いエンブレムにタイプ色＋名前を描画
  drawCircularEmblem(ctx, textConfig, image.width, image.height);

  // 白枠に診断メッセージを描画
  drawTextInBox(ctx, textConfig, textBoxConfig, image.width, image.height);
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
 * 丸いエンブレムにタイプ色＋名前を描画
 */
function drawCircularEmblem(
  ctx: CanvasRenderingContext2D,
  textConfig: CardTextConfig,
  imageWidth: number,
  imageHeight: number
): void {
  const { userName, dreamTypeName, color = "#d4a574", frameColor = "#d4a574" } = textConfig;
  
  // スケール計算
  const scaleX = imageWidth / 744;
  const scaleY = imageHeight / 1052;
  const scale = Math.min(scaleX, scaleY);

  const centerX = CIRCULAR_EMBLEM_CONFIG.x * scaleX;
  const centerY = CIRCULAR_EMBLEM_CONFIG.y * scaleY;
  const radius = CIRCULAR_EMBLEM_CONFIG.radius * scale;

  ctx.save();

  // 丸い背景を描画（タイプの色）
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.7, frameColor);
  gradient.addColorStop(1, color + "CC");

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // 外側の枠線
  ctx.strokeStyle = "#ffffff"; // 白枠に変更して視認性アップ
  ctx.lineWidth = 3 * scale;
  ctx.stroke();

  // テキストを描画
  const fontFamily = FONT_CONFIG.primary.loaded 
    ? FONT_CONFIG.primary.family 
    : FONT_CONFIG.fallback.family;
  
  const fontSize = Math.floor(FONT_STYLES.emblem.size * scale);
  
  ctx.fillStyle = "#ffffff";
  ctx.font = `${FONT_STYLES.emblem.weight} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  
  // 影
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 2 * scale;
  ctx.shadowOffsetX = 1 * scale;
  ctx.shadowOffsetY = 1 * scale;

  // 「あなたは」を上に
  ctx.fillText("あなたは", centerX, centerY - fontSize * 1.2);
  
  // タイプ名を中央に（少し大きく）
  ctx.font = `900 ${Math.floor(fontSize * 1.4)}px ${fontFamily}`;
  ctx.fillText(dreamTypeName, centerX, centerY);
  
  // 「タイプです」を下に
  ctx.font = `${FONT_STYLES.emblem.weight} ${fontSize}px ${fontFamily}`;
  ctx.fillText("タイプです", centerX, centerY + fontSize * 1.2);

  ctx.restore();
}

/**
 * 白枠内に診断メッセージを描画
 */
function drawTextInBox(
  ctx: CanvasRenderingContext2D,
  textConfig: CardTextConfig,
  boxConfig: TextBoxConfig,
  imageWidth: number,
  imageHeight: number
): void {
  const { personalizedMessage, color = "#2d1f3d" } = textConfig;
  const { x, y, width, height, padding } = boxConfig;

  if (!personalizedMessage) return;

  // スケール計算
  const scaleX = imageWidth / 744;
  const scaleY = imageHeight / 1052;
  const scale = Math.min(scaleX, scaleY);

  const scaledX = x * scaleX;
  const scaledY = y * scaleY;
  const scaledWidth = width * scaleX;
  const scaledHeight = height * scaleY;
  const scaledPadding = padding * scale;

  // テキスト描画領域
  const textX = scaledX + scaledPadding;
  const textY = scaledY + scaledPadding;
  const textWidth = scaledWidth - scaledPadding * 2;
  const maxHeight = scaledHeight - scaledPadding * 2;

  const fontFamily = FONT_CONFIG.primary.loaded 
    ? FONT_CONFIG.primary.family 
    : FONT_CONFIG.fallback.family;
  
  const fontSize = Math.floor(FONT_STYLES.message.size * scale);
  const lineHeight = fontSize * FONT_STYLES.message.lineHeight;

  ctx.save();
  ctx.font = `${FONT_STYLES.message.weight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = "#333333"; // 濃いグレーに変更して読みやすく
  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  // テキストを行に分割して描画
  const lines = wrapText(ctx, personalizedMessage, textWidth, fontSize);
  let currentY = textY;

  // ヘッダー（ユーザー名への呼びかけ）を追加
  ctx.font = `bold ${Math.floor(fontSize * 1.1)}px ${fontFamily}`;
  ctx.fillText(`${textConfig.userName}さんへ`, textX, currentY);
  currentY += lineHeight * 1.5;

  // 本文
  ctx.font = `${FONT_STYLES.message.weight} ${fontSize}px ${fontFamily}`;
  
  for (const line of lines) {
    if (currentY + lineHeight > textY + maxHeight) break;
    
    ctx.fillText(line, textX, currentY);
    currentY += lineHeight;
  }

  ctx.restore();
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
  const fontFamily = FONT_CONFIG.primary.loaded 
    ? FONT_CONFIG.primary.family 
    : FONT_CONFIG.fallback.family;
  
  ctx.font = `${FONT_STYLES.message.weight} ${fontSize}px ${fontFamily}`;
  
  const paragraphs = text.split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    // 空行の場合
    if (paragraph.trim() === "") {
      lines.push("");
      continue;
    }

    const words = paragraph.split("");
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
    
    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * CanvasをBlobとして取得
 */
export function canvasToBlob(canvas: HTMLCanvasElement, type = "image/png"): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to convert canvas to blob"));
        }
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
export async function downloadCard(
  canvas: HTMLCanvasElement,
  fileName = "my-kinman-card.png"
): Promise<void> {
  const dataUrl = canvasToDataURL(canvas);
  const link = document.createElement("a");
  link.download = fileName;
  link.href = dataUrl;
  link.click();
}
