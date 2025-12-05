/**
 * 夢タイプ診断システム - 占いロジック実装
 * 四柱推命・九星気学・数秘術を統合した診断エンジン
 * Manus AI調査レポートに基づく実装
 */

// ==================== データ定義 ====================

// 十干十二支データ
const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const SIXTY_GANZHI = [
  '甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己巳', '庚午', '辛未', '壬申', '癸酉',
  '甲戌', '乙亥', '丙子', '丁丑', '戊寅', '己卯', '庚辰', '辛巳', '壬午', '癸未',
  '甲申', '乙酉', '丙戌', '丁亥', '戊子', '己丑', '庚寅', '辛卯', '壬辰', '癸巳',
  '甲午', '乙未', '丙申', '丁酉', '戊戌', '己亥', '庚子', '辛丑', '壬寅', '癸卯',
  '甲辰', '乙巳', '丙午', '丁未', '戊申', '己酉', '庚戌', '辛亥', '壬子', '癸丑',
  '甲寅', '乙卯', '丙辰', '丁巳', '戊午', '己未', '庚申', '辛酉', '壬戌', '癸亥'
];

// 五行対応
type FiveElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

const STEM_ELEMENTS: Record<string, FiveElement> = {
  '甲': 'wood', '乙': 'wood',
  '丙': 'fire', '丁': 'fire',
  '戊': 'earth', '己': 'earth',
  '庚': 'metal', '辛': 'metal',
  '壬': 'water', '癸': 'water'
};

const BRANCH_ELEMENTS: Record<string, FiveElement> = {
  '子': 'water', '丑': 'earth',
  '寅': 'wood', '卯': 'wood',
  '辰': 'earth', '巳': 'fire',
  '午': 'fire', '未': 'earth',
  '申': 'metal', '酉': 'metal',
  '戌': 'earth', '亥': 'water'
};

export const ELEMENT_INFO = {
  'wood': { name: '木', character: '成長・発展', color: '#2ecc71' },
  'fire': { name: '火', character: '情熱・活動', color: '#e74c3c' },
  'earth': { name: '土', character: '安定・信頼', color: '#f39c12' },
  'metal': { name: '金', character: '強さ・決断', color: '#95a5a6' },
  'water': { name: '水', character: '柔軟・知性', color: '#3498db' }
};

// 九星気学データ
type KyuseiType = '火系' | '土系' | '水系';

interface KyuseiInfo {
  name: string;
  character: string;
  type: KyuseiType;
}

const KYUSEI_STARS: Record<number, KyuseiInfo> = {
  1: { name: '一白水星', character: '柔軟・知性的', type: '水系' },
  2: { name: '二黒土星', character: '安定・母性的', type: '土系' },
  3: { name: '三碧木星', character: '活動・成長', type: '火系' },
  4: { name: '四緑木星', character: '穏やか・調和', type: '水系' },
  5: { name: '五黄土星', character: 'リーダー・統率', type: '土系' },
  6: { name: '六白金星', character: '誠実・責任感', type: '水系' },
  7: { name: '七赤金星', character: '社交・楽観的', type: '火系' },
  8: { name: '八白土星', character: '誠実・着実', type: '土系' },
  9: { name: '九紫火星', character: '知性・情熱', type: '火系' }
};

// ライフパスナンバーデータ
interface LifePathInfo {
  name: string;
  character: string;
  mission: string;
}

const LIFE_PATH_INFO: Record<number, LifePathInfo> = {
  1: { name: 'リーダータイプ', character: '自主独立', mission: '先駆者・開拓者' },
  2: { name: 'サポートタイプ', character: '繊細・協調', mission: '調和・平和' },
  3: { name: '表現タイプ', character: '自由・楽しさ', mission: '創造性・喜び' },
  4: { name: '実現タイプ', character: '安定・現実的', mission: '基礎構築' },
  5: { name: '体験タイプ', character: '変化・柔軟', mission: '成長・多様性' },
  6: { name: '愛と共感タイプ', character: '包容力・責任', mission: '奉仕・教導' },
  7: { name: '分析タイプ', character: '洞察・専門性', mission: '真理探究' },
  8: { name: '成功タイプ', character: '力強さ・現実感', mission: '達成・成功' },
  9: { name: '包括タイプ', character: '器の広さ・理解', mission: '完成・貢献' },
  11: { name: 'マスターナンバー11', character: '直感・精神性', mission: '啓蒙・直感知識' },
  22: { name: 'マスターナンバー22', character: '建設・実現力', mission: '大規模実現' },
  33: { name: 'マスターナンバー33', character: '教師・愛', mission: '人類への愛' }
};

// 9つの夢タイプ定義（既存のdreamTypes.tsと統合可能）
export const FORTUNE_DREAM_TYPES = {
  'phoenix': {
    name: '鳳凰（Phoenix）',
    character: '情熱・再生・挑戦',
    description: '情熱的で何度も立ち上がる力を持つ。新しい挑戦を恐れず、困難から学ぶ',
    color: '#e74c3c'
  },
  'kitsune': {
    name: '狐（Kitsune）',
    character: '直感・知恵・変化',
    description: '直感が鋭く、知恵と柔軟性を活かして状況を読む。変化を味方にする',
    color: '#f39c12'
  },
  'pegasus': {
    name: 'ペガサス（Pegasus）',
    character: '自由・理想・飛躍',
    description: '自由を求め、理想を高く掲げ、大きく飛躍する。制限を超える力',
    color: '#9b59b6'
  },
  'elephant': {
    name: '象（Elephant）',
    character: '安定・繁栄・信頼',
    description: '安定した基盤を築き、着実に繁栄させる。信頼と安心感を与える',
    color: '#34495e'
  },
  'deer': {
    name: '鹿（Deer）',
    character: '優美・調和・成長',
    description: '優雅さと調和を大切にしながら、着実に成長する。柔軟な強さ',
    color: '#16a085'
  },
  'dragon': {
    name: '龍（Dragon）',
    character: '権威・成功・リーダーシップ',
    description: '強い意志と統率力で目標を達成。周囲を導き、成功をもたらす',
    color: '#c0392b'
  },
  'turtle': {
    name: '亀（Turtle）',
    character: '忍耐・長寿・着実',
    description: '長期的視点で着実に進む。忍耐強く、安定した成長を実現',
    color: '#27ae60'
  },
  'shark': {
    name: '鯱（Shark）',
    character: '集中・突破・目標達成',
    description: '目標に集中し、一気に突破する。強い決断力と実行力',
    color: '#2980b9'
  },
  'wolf': {
    name: '狼（Wolf）',
    character: '仲間・絆・直感',
    description: '仲間との絆を大切にし、集団の力を活かす。直感と信頼',
    color: '#8e44ad'
  }
};

// ==================== 型定義 ====================

interface ElementInfo {
  stem: { character: string; element: FiveElement };
  branch: { character: string; element: FiveElement };
  primary: FiveElement;
}

interface PillarInfo {
  pillar: string;
  element: ElementInfo | null;
}

interface Meishiki {
  year: PillarInfo;
  month: PillarInfo;
  day: PillarInfo;
  hour: PillarInfo;
}

interface ElementBalance {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

interface KyuseiData {
  number: number;
  info: KyuseiInfo;
}

interface LifePathData {
  number: number;
  info: LifePathInfo;
}

interface NumerologyData {
  lifePathNumber: LifePathData;
  birthdayNumber: number;
}

export interface DreamTypeResult {
  primary: {
    type: string;
    info: typeof FORTUNE_DREAM_TYPES[keyof typeof FORTUNE_DREAM_TYPES];
    score: number;
  };
  secondary: {
    type: string;
    info: typeof FORTUNE_DREAM_TYPES[keyof typeof FORTUNE_DREAM_TYPES];
    score: number;
  };
  allScores: Record<string, number>;
  ranking: Array<{
    type: string;
    info: typeof FORTUNE_DREAM_TYPES[keyof typeof FORTUNE_DREAM_TYPES];
    score: number;
  }>;
}

export interface FortuneDiagnosisResult {
  birthDate: { year: number; month: number; day: number; hour: number };
  bazi: {
    meishiki: Meishiki;
    elementBalance: ElementBalance;
  };
  kyusei: KyuseiData;
  numerology: NumerologyData;
  dreamType: DreamTypeResult;
  summary: {
    primaryDreamType: string;
    primaryCharacter: string;
    primaryDescription: string;
    secondaryDreamType: string;
    kyuseiName: string;
    kyuseiCharacter: string;
    lifePathNumber: number;
    lifePathName: string;
    lifePathMission: string;
  };
}

// ==================== 四柱推命計算 ====================

export class BaziCalculator {
  static calculateYearPillar(year: number, month: number, day: number): string {
    if (month < 2 || (month === 2 && day < 4)) {
      year = year - 1;
    }
    const adjustedYear = year - 3;
    const index = adjustedYear % 60;
    return SIXTY_GANZHI[index === 0 ? 59 : index - 1];
  }

  static calculateMonthPillar(year: number, month: number, day: number): string {
    if (day < 4) {
      month = month - 1;
    }
    const lastDigit = year % 10;
    const magicNumbers: Record<number, number> = {
      1: 25, 6: 25, 2: 37, 7: 37, 3: 49, 8: 49, 4: 1, 9: 1, 5: 13, 0: 13
    };
    const magicNumber = magicNumbers[lastDigit];
    const monthIndex = (magicNumber + month - 1) % 60;
    return SIXTY_GANZHI[monthIndex === 0 ? 59 : monthIndex - 1];
  }

  static calculateDayPillar(year: number, month: number, day: number): string {
    const a = Math.floor((14 - month) / 12);
    const y = year - a;
    const m = month + 12 * a - 2;
    const dayOfWeek = (day + y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + Math.floor(31 * m / 12)) % 7;
    const dayIndex = (day - 1 + dayOfWeek * 5) % 60;
    return SIXTY_GANZHI[dayIndex === 0 ? 59 : dayIndex - 1];
  }

  static calculateHourPillar(hour: number): string {
    const hourBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const branchIndex = Math.floor((hour + 1) / 2) % 12;
    return hourBranches[branchIndex];
  }

  static getElement(ganzhi: string): ElementInfo | null {
    if (ganzhi.length < 2) return null;
    const stem = ganzhi[0];
    const branch = ganzhi[1];
    const stemElement = STEM_ELEMENTS[stem];
    const branchElement = BRANCH_ELEMENTS[branch];
    return {
      stem: { character: stem, element: stemElement },
      branch: { character: branch, element: branchElement },
      primary: stemElement
    };
  }

  static calculateMeishiki(year: number, month: number, day: number, hour = 12): Meishiki {
    const yearPillar = this.calculateYearPillar(year, month, day);
    const monthPillar = this.calculateMonthPillar(year, month, day);
    const dayPillar = this.calculateDayPillar(year, month, day);
    const hourPillar = this.calculateHourPillar(hour);
    return {
      year: { pillar: yearPillar, element: this.getElement(yearPillar) },
      month: { pillar: monthPillar, element: this.getElement(monthPillar) },
      day: { pillar: dayPillar, element: this.getElement(dayPillar) },
      hour: { pillar: hourPillar, element: this.getElement(hourPillar) }
    };
  }

  static calculateElementBalance(meishiki: Meishiki): ElementBalance {
    const balance: ElementBalance = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
    const pillars = [meishiki.year, meishiki.month, meishiki.day, meishiki.hour];
    pillars.forEach(pillar => {
      if (pillar.element) {
        if (pillar.element.stem?.element) {
          balance[pillar.element.stem.element]++;
        }
        if (pillar.element.branch?.element) {
          balance[pillar.element.branch.element]++;
        }
      }
    });
    return balance;
  }
}

// ==================== 九星気学計算 ====================

export class KyuseiCalculator {
  static calculateHonmeisei(year: number, month: number, day: number): KyuseiData {
    if (month < 2 || (month === 2 && day < 4)) {
      year = year - 1;
    }
    const yearStr = year.toString();
    let sum = 0;
    for (const digit of yearStr) {
      sum += parseInt(digit);
    }
    while (sum >= 10) {
      let tempSum = 0;
      for (const digit of sum.toString()) {
        tempSum += parseInt(digit);
      }
      sum = tempSum;
    }
    let honmeisei = 11 - sum;
    if (honmeisei <= 0) honmeisei += 9;
    if (honmeisei > 9) honmeisei = honmeisei - 9;
    return {
      number: honmeisei,
      info: KYUSEI_STARS[honmeisei]
    };
  }
}

// ==================== 数秘術計算 ====================

export class NumerologyCalculator {
  static calculateLifePathNumber(year: number, month: number, day: number): LifePathData {
    const dateStr = year.toString() + month.toString().padStart(2, '0') + day.toString().padStart(2, '0');
    let sum = 0;
    for (const digit of dateStr) {
      sum += parseInt(digit);
    }
    if (sum === 11 || sum === 22 || sum === 33) {
      return { number: sum, info: LIFE_PATH_INFO[sum] };
    }
    while (sum >= 10) {
      let tempSum = 0;
      for (const digit of sum.toString()) {
        tempSum += parseInt(digit);
      }
      sum = tempSum;
    }
    return { number: sum, info: LIFE_PATH_INFO[sum] };
  }

  static analyzeNumerology(year: number, month: number, day: number): NumerologyData {
    const lpn = this.calculateLifePathNumber(year, month, day);
    const birthdaySum = month + day;
    let birthdayNumber = birthdaySum;
    if (birthdaySum >= 10 && birthdaySum !== 11 && birthdaySum !== 22 && birthdaySum !== 33) {
      birthdayNumber = (birthdaySum % 10) + Math.floor(birthdaySum / 10);
    }
    return { lifePathNumber: lpn, birthdayNumber };
  }
}

// ==================== 夢タイプマッピング ====================

export class DreamTypeMapper {
  static mapToDreamType(baziData: Meishiki, kyuseiData: KyuseiData, numerologyData: NumerologyData): DreamTypeResult {
    const scores: Record<string, number> = {
      phoenix: 0, kitsune: 0, pegasus: 0, elephant: 0,
      deer: 0, dragon: 0, turtle: 0, shark: 0, wolf: 0
    };

    // 四柱推命からのスコア計算
    const elementBalance = BaziCalculator.calculateElementBalance(baziData);
    scores.phoenix += elementBalance.fire * 2;
    scores.kitsune += elementBalance.metal * 1.5;
    scores.pegasus += elementBalance.wood * 2;
    scores.elephant += elementBalance.earth * 2;
    scores.deer += elementBalance.wood * 1.5;
    scores.dragon += elementBalance.fire * 1.5;
    scores.turtle += elementBalance.water * 2;
    scores.shark += elementBalance.metal * 2;
    scores.wolf += elementBalance.water * 1.5;

    // 九星気学からのスコア計算
    const kyuseiType = kyuseiData.info.type;
    if (kyuseiType === '火系') {
      scores.phoenix += 3;
      scores.pegasus += 2;
      scores.dragon += 2;
    } else if (kyuseiType === '土系') {
      scores.elephant += 3;
      scores.turtle += 2;
      scores.deer += 1;
    } else if (kyuseiType === '水系') {
      scores.kitsune += 3;
      scores.wolf += 2;
      scores.turtle += 1;
    }

    // 数秘術からのスコア計算
    const lpn = numerologyData.lifePathNumber.number;
    const lpnMapping: Record<number, Record<string, number>> = {
      1: { dragon: 3, shark: 2, phoenix: 1 },
      2: { wolf: 3, deer: 2, turtle: 1 },
      3: { pegasus: 3, phoenix: 2, kitsune: 1 },
      4: { elephant: 3, turtle: 2, shark: 1 },
      5: { pegasus: 2, kitsune: 2, phoenix: 1 },
      6: { deer: 3, wolf: 2, elephant: 1 },
      7: { kitsune: 3, turtle: 2, wolf: 1 },
      8: { dragon: 3, shark: 2, elephant: 1 },
      9: { wolf: 3, pegasus: 1, kitsune: 1 },
      11: { pegasus: 3, kitsune: 2, wolf: 1 },
      22: { dragon: 3, elephant: 2, shark: 1 },
      33: { deer: 3, wolf: 2, pegasus: 1 }
    };

    if (lpnMapping[lpn]) {
      Object.entries(lpnMapping[lpn]).forEach(([type, score]) => {
        scores[type] += score;
      });
    }

    // ランキング作成
    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const primaryType = sortedScores[0][0] as keyof typeof FORTUNE_DREAM_TYPES;
    const secondaryType = sortedScores[1][0] as keyof typeof FORTUNE_DREAM_TYPES;

    return {
      primary: {
        type: primaryType,
        info: FORTUNE_DREAM_TYPES[primaryType],
        score: sortedScores[0][1]
      },
      secondary: {
        type: secondaryType,
        info: FORTUNE_DREAM_TYPES[secondaryType],
        score: sortedScores[1][1]
      },
      allScores: scores,
      ranking: sortedScores.map(([type, score]) => ({
        type,
        info: FORTUNE_DREAM_TYPES[type as keyof typeof FORTUNE_DREAM_TYPES],
        score
      }))
    };
  }
}

// ==================== 統合診断エンジン ====================

export class DreamTypeDiagnosisEngine {
  static diagnose(year: number, month: number, day: number, hour = 12): FortuneDiagnosisResult {
    const baziData = BaziCalculator.calculateMeishiki(year, month, day, hour);
    const kyuseiData = KyuseiCalculator.calculateHonmeisei(year, month, day);
    const numerologyData = NumerologyCalculator.analyzeNumerology(year, month, day);
    const dreamTypeResult = DreamTypeMapper.mapToDreamType(baziData, kyuseiData, numerologyData);

    return {
      birthDate: { year, month, day, hour },
      bazi: {
        meishiki: baziData,
        elementBalance: BaziCalculator.calculateElementBalance(baziData)
      },
      kyusei: kyuseiData,
      numerology: numerologyData,
      dreamType: dreamTypeResult,
      summary: {
        primaryDreamType: dreamTypeResult.primary.info.name,
        primaryCharacter: dreamTypeResult.primary.info.character,
        primaryDescription: dreamTypeResult.primary.info.description,
        secondaryDreamType: dreamTypeResult.secondary.info.name,
        kyuseiName: kyuseiData.info.name,
        kyuseiCharacter: kyuseiData.info.character,
        lifePathNumber: numerologyData.lifePathNumber.number,
        lifePathName: numerologyData.lifePathNumber.info.name,
        lifePathMission: numerologyData.lifePathNumber.info.mission
      }
    };
  }
}
