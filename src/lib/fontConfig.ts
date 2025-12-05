/**
 * フォント管理設定
 * プロジェクトのトンマナに合わせたフォント設定
 */

export interface FontConfig {
  name: string;
  path: string;
  weights: {
    light?: string;
    regular?: string;
    medium?: string;
    bold?: string;
    heavy?: string;
    ultra?: string;
  };
  category: "gothic" | "mincho" | "display" | "handwriting";
  description: string;
}

// フォント設定一覧
export const FONT_CONFIGS: Record<string, FontConfig> = {
  // ゴシック系（読みやすさ重視）
  shinGoPro: {
    name: "A-OTF-ShinGoPro",
    path: "/fonts/A-OTF-ShinGoPro",
    weights: {
      light: "Light.otf",
      regular: "Regular.otf",
      medium: "Medium.otf",
      bold: "Bold.otf",
      heavy: "Heavy.otf",
      ultra: "Ultra.otf",
    },
    category: "gothic",
    description: "新ゴPro - 読みやすくモダンなゴシック体",
  },
  gothicMB101: {
    name: "A-OTF-GothicMB101Pro",
    path: "/fonts/A-OTF-GothicMB101Pro",
    weights: {
      bold: "Bold.otf",
      heavy: "Heavy.otf",
    },
    category: "gothic",
    description: "ゴシックMB101Pro - 力強いゴシック体",
  },
  futoGo: {
    name: "A-OTF-FutoGoB101Pro",
    path: "/fonts/A-OTF-FutoGoB101Pro",
    weights: {
      bold: "Bold.otf",
    },
    category: "gothic",
    description: "太ゴB101Pro - 太めのゴシック体",
  },

  // 明朝系（上品さ重視）
  ryuminPro: {
    name: "A-OTF-RyuminPro",
    path: "/fonts/A-OTF-RyuminPro",
    weights: {
      light: "Light.otf",
      regular: "Regular.otf",
      medium: "Medium.otf",
      heavy: "Heavy.otf",
      ultra: "Ultra.otf",
    },
    category: "mincho",
    description: "リュウミンPro - 上品な明朝体",
  },
  futoMin: {
    name: "FutoMinA101Pro",
    path: "/fonts/A-OTF-FutoMinA101Pro",
    weights: {
      bold: "Bold.otf",
    },
    category: "mincho",
    description: "太明朝A101Pro - 太めの明朝体",
  },

  // 見出し用（インパクト重視）
  midashiGo: {
    name: "A-OTF-MidashiGoPro-MB31",
    path: "/fonts/A-OTF-MidashiGoPro-MB31.otf",
    weights: {},
    category: "display",
    description: "見出しゴPro - インパクトのある見出し用",
  },
  midashiMin: {
    name: "A-OTF-MidashiMinPro-MA31",
    path: "/fonts/A-OTF-MidashiMinPro-MA31.otf",
    weights: {},
    category: "display",
    description: "見出し明朝Pro - 上品な見出し用",
  },

  // 柔らかい系
  junPro: {
    name: "JunPro",
    path: "/fonts/A-OTF-Jun",
    weights: {
      light: "101Pro-Light.otf",
      regular: "201Pro-Regular.otf",
      medium: "34Pro-Medium.otf",
      bold: "501Pro-Bold.otf",
    },
    category: "gothic",
    description: "じゅんPro - 柔らかく親しみやすい",
  },
  kyokaICA: {
    name: "KyokaICAPro",
    path: "/fonts/A-OTF-KyokaICAPro",
    weights: {
      light: "Light.otf",
      regular: "Regular.otf",
      medium: "Medium.otf",
    },
    category: "gothic",
    description: "京華ICAPro - 柔らかく優しい",
  },
};

// デフォルトフォント設定（カード生成用）
export const DEFAULT_FONTS = {
  // エンブレム用（丸いバッジ）- 見出しフォントでインパクト重視
  emblem: {
    primary: FONT_CONFIGS.midashiGo,
    weight: "regular",
    fallback: "'A-OTF-MidashiGoPro-MB31', 'Noto Serif JP', serif",
  },
  // メッセージ本文用 - 読みやすいゴシック
  message: {
    primary: FONT_CONFIGS.shinGoPro,
    weight: "regular",
    fallback: "'A-OTF-ShinGoPro-Regular', 'Zen Maru Gothic', sans-serif",
  },
  // ユーザー名用 - 太めのゴシック
  userName: {
    primary: FONT_CONFIGS.shinGoPro,
    weight: "bold",
    fallback: "'A-OTF-ShinGoPro-Bold', 'Zen Maru Gothic', sans-serif",
  },
};

/**
 * フォントファイルのパスを取得
 */
export function getFontPath(config: FontConfig, weight: string): string {
  // 特殊ケース: 見出しフォントはファイル名にすでに.otfが含まれている
  if (config.path.endsWith(".otf")) {
    return config.path;
  }

  const weightFile = config.weights[weight as keyof typeof config.weights];
  if (!weightFile) {
    // フォールバック: regularがあればそれを使用
    const fallback = config.weights.regular || Object.values(config.weights)[0];
    if (!fallback) return config.path; // パスをそのまま返す
    return `${config.path}-${fallback}`;
  }
  return `${config.path}-${weightFile}`;
}

/**
 * フォントを読み込む（ブラウザ用）
 */
export async function loadFont(
  fontFamily: string,
  fontPath: string
): Promise<boolean> {
  try {
    const font = new FontFace(fontFamily, `url(${fontPath})`);
    const loadedFont = await font.load();
    document.fonts.add(loadedFont);
    return true;
  } catch (error) {
    console.warn(`フォント読み込み失敗: ${fontFamily}`, error);
    return false;
  }
}

/**
 * 複数フォントを一括読み込み
 */
export async function loadFonts(fontConfigs: Array<{ family: string; path: string }>): Promise<void> {
  const loadPromises = fontConfigs.map(({ family, path }) => loadFont(family, path));
  await Promise.all(loadPromises);
}

/**
 * カード生成用のフォントを読み込む
 */
export async function loadCardFonts(): Promise<void> {
  const fontsToLoad = [
    {
      family: DEFAULT_FONTS.emblem.primary.name,
      path: getFontPath(DEFAULT_FONTS.emblem.primary, DEFAULT_FONTS.emblem.weight),
    },
    {
      family: DEFAULT_FONTS.message.primary.name,
      path: getFontPath(DEFAULT_FONTS.message.primary, DEFAULT_FONTS.message.weight),
    },
    {
      family: DEFAULT_FONTS.userName.primary.name,
      path: getFontPath(DEFAULT_FONTS.userName.primary, DEFAULT_FONTS.userName.weight),
    },
  ];

  // フォントを読み込み
  const loadPromises = fontsToLoad.map(({ family, path }) => {
    if (!path) return Promise.resolve(false);
    return loadFont(family, path);
  });
  
  await Promise.all(loadPromises);
  
  // フォント読み込み完了を待つ
  await document.fonts.ready;
}

