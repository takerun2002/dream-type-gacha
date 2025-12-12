"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { dreamTypes } from "@/lib/dreamTypes";
import { generateCardWithGemini, downloadCardGemini, isShareSupported, type CardDataGemini } from "@/lib/cardGeneratorGemini";
import { getSavedDiagnosisData } from "@/lib/diagnosisRecord";
import Confetti from "@/components/Confetti";

// Three.js背景を動的インポート（SSR無効）
const CosmicBackground = dynamic(() => import("@/components/CosmicBackground"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 -z-10 bg-gradient-dream" />,
});

interface FortuneData {
  kyusei: {
    info: {
      name: string;
      character: string;
      type: string;
    };
  };
  numerology: {
    lifePathNumber: {
      number: number;
      info: {
        name: string;
        mission: string;
      };
    };
  };
  bazi: {
    elementBalance: {
      wood: number;
      fire: number;
      earth: number;
      metal: number;
      water: number;
    };
    meishiki: {
      year: { pillar: string };
      month: { pillar: string };
      day: { pillar: string };
    };
  };
}

interface DiagnosisResult {
  dreamType: string;
  typeName: string;
  personalizedMessage: string;
  color: string;
  fortuneData?: FortuneData;
  [key: string]: unknown;
}

// カード生成のタイムアウト（秒）
const CARD_GENERATION_TIMEOUT = 60;

// きんまん先生の占いアニメーションコンポーネント（動画使用）
function FortuneLoadingAnimation({ progress }: { progress: number }) {
  return (
    <div className="relative w-full max-w-md min-h-[400px] flex flex-col items-center justify-center bg-gradient-to-b from-purple-900/80 to-indigo-900/80 rounded-2xl p-6 overflow-hidden">
      {/* きんまん先生動画アニメーション */}
      <motion.div
        className="relative"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* 背景のグロウエフェクト */}
        <motion.div
          className="absolute inset-0 rounded-full blur-2xl opacity-40"
          style={{
            background: "radial-gradient(circle, rgba(147,112,219,0.8) 0%, rgba(147,112,219,0) 70%)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* 動画プレイヤー */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="relative z-10 w-[280px] h-[280px] object-cover rounded-lg"
        >
          <source src="/animations/kinman-fortune-light.mp4" type="video/mp4" />
        </video>
      </motion.div>

      {/* テキストとプログレス */}
      <motion.div
        className="mt-4 text-center z-10"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <p className="text-lg font-bold text-gradient mb-1">
          🔮 あなたの運命を占っています...
        </p>
        <p className="text-purple-300 text-sm">
          きんまん先生がカードを召喚中
        </p>
      </motion.div>

      {/* プログレスバー */}
      <div className="w-full max-w-xs mt-3">
        <div className="bg-purple-900/50 rounded-full h-2 mb-1 overflow-hidden">
          <motion.div
            className="h-2 rounded-full"
            style={{
              background: "linear-gradient(90deg, #9370db, #ff6b9d, #ffd700)",
            }}
            initial={{ width: "0%" }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-purple-400 text-xs text-center">
          {Math.round(progress)}% 完了
        </p>
      </div>
    </div>
  );
}

// 待機中のキラキラ位置（固定値）
const SPARKLE_POSITIONS = [
  { left: 10, top: 15, duration: 2.5, delay: 0.1 },
  { left: 85, top: 20, duration: 3.0, delay: 0.3 },
  { left: 25, top: 80, duration: 2.8, delay: 0.5 },
  { left: 70, top: 75, duration: 3.2, delay: 0.7 },
  { left: 45, top: 10, duration: 2.3, delay: 0.9 },
  { left: 90, top: 50, duration: 2.9, delay: 1.1 },
  { left: 5, top: 60, duration: 3.1, delay: 1.3 },
  { left: 60, top: 30, duration: 2.6, delay: 1.5 },
  { left: 30, top: 45, duration: 2.7, delay: 1.7 },
  { left: 80, top: 85, duration: 3.3, delay: 1.9 },
];

// 待機中のUIコンポーネント
function QueueWaitingAnimation({ 
  position, 
  totalWaiting, 
  estimatedWait 
}: { 
  position: number; 
  totalWaiting: number; 
  estimatedWait: number;
}) {
  return (
    <div className="relative w-full max-w-md min-h-[400px] flex flex-col items-center justify-center bg-gradient-to-b from-indigo-900/80 to-purple-900/80 rounded-2xl p-6 overflow-hidden">
      {/* 背景のキラキラエフェクト */}
      <div className="absolute inset-0 overflow-hidden">
        {SPARKLE_POSITIONS.map((pos, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400/30 rounded-full"
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: pos.duration,
              repeat: Infinity,
              delay: pos.delay,
            }}
          />
        ))}
      </div>

      {/* きんまん先生 - 待機中バージョン */}
      <motion.div
        className="relative z-10"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="text-8xl">🔮</div>
      </motion.div>

      {/* 待機メッセージ */}
      <motion.div
        className="mt-6 text-center z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-xl font-bold text-gradient mb-2">
          ✨ 少々お待ちください ✨
        </h3>
        <p className="text-purple-200 text-sm mb-4">
          きんまん先生があなたの運命を占う準備をしています
        </p>
        
        {/* 待ち人数表示 */}
        <motion.div 
          className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="text-3xl font-bold text-yellow-400 mb-1">
            あなたは {position} 番目
          </div>
          <div className="text-purple-300 text-sm">
            現在 {totalWaiting} 人がお待ちです
          </div>
          {estimatedWait > 0 && (
            <div className="text-purple-400/80 text-xs mt-2">
              予想待ち時間: 約 {Math.ceil(estimatedWait / 60)} 分
            </div>
          )}
        </motion.div>

        {/* 励ましメッセージ */}
        <motion.p
          className="mt-4 text-purple-300/80 text-sm"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          🌟 順番が来たら自動で始まります 🌟
        </motion.p>
      </motion.div>

      {/* ローディングドット */}
      <div className="flex gap-2 mt-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 bg-purple-400 rounded-full"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// カード画像のローカルストレージキー
const CARD_IMAGE_STORAGE_KEY = "dream_card_image";

// セッションID生成
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
};

export default function ResultPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [dreamType, setDreamType] = useState<string | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [showConfetti, setShowConfetti] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [cardGenerated, setCardGenerated] = useState(false);
  const [cardImageUrl, setCardImageUrl] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  // エラー状態の管理
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardImageLoadError, setCardImageLoadError] = useState(false); // 画像読み込みエラー
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  // キュー状態の管理
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [totalWaiting, setTotalWaiting] = useState(0);
  const [isWaiting, setIsWaiting] = useState(false);
  const [estimatedWait, setEstimatedWait] = useState(0);
  const [sessionId] = useState(() => generateSessionId());
  // Web Share API対応チェック（クライアントサイドのみ）
  const [canShare, setCanShare] = useState(() => {
    if (typeof window === "undefined") return false;
    return isShareSupported();
  });

  // マウント時にWeb Share API対応を再チェック + 保存済みカード画像を復元
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCanShare(isShareSupported());
      
      console.log("🔍 [DEBUG v12] カード画像復元処理開始");
      
      // 保存済みカード画像を復元
      const savedCardImage = localStorage.getItem(CARD_IMAGE_STORAGE_KEY);
      console.log("🔍 [DEBUG v12] savedCardImage:", savedCardImage ? `${savedCardImage.substring(0, 50)}... (${savedCardImage.length}文字)` : "null");
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/5be1a6a7-7ee8-4fe8-9b00-19e37afd0e10',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'result/page.tsx:restore-check',message:'localStorage取得結果',data:{hasSavedImage:!!savedCardImage,savedImageLength:savedCardImage?.length||0,savedImagePrefix:savedCardImage?.substring(0,100)||'null'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2-storage'})}).catch(()=>{});
      // #endregion
      
      if (savedCardImage) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/5be1a6a7-7ee8-4fe8-9b00-19e37afd0e10',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'result/page.tsx:restore-check-type',message:'保存データタイプ確認',data:{isBase64:savedCardImage.startsWith('data:'),isBlob:savedCardImage.startsWith('blob:'),urlStart:savedCardImage.substring(0,80)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H9-blobcheck'})}).catch(()=>{});
        // #endregion
        
        // Base64形式（data:image/...）のみ有効、Blob URLは無効
        if (savedCardImage.startsWith('data:')) {
          setCardImageUrl(savedCardImage);
          setCardGenerated(true);
          console.log("📸 保存済みBase64カード画像を復元しました");
          
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/5be1a6a7-7ee8-4fe8-9b00-19e37afd0e10',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'result/page.tsx:restore-success',message:'Base64カード画像復元成功',data:{base64Length:savedCardImage.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H9-blobcheck'})}).catch(()=>{});
          // #endregion
        } else {
          // 古いBlob URLまたはその他の無効なURLは無視してクリア
          console.log("⚠️ 古いBlob URLを検出、クリアして再生成へ");
          localStorage.removeItem(CARD_IMAGE_STORAGE_KEY);
          setCardImageUrl(null);  // ★重要: URLをnullにしてImageコンポーネントを非表示に
          setCardGenerated(false); // ★重要: 再生成トリガー
          
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/5be1a6a7-7ee8-4fe8-9b00-19e37afd0e10',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'result/page.tsx:restore-blob-cleared',message:'古いBlob URLをクリア、状態リセット',data:{clearedUrl:savedCardImage.substring(0,80)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H11-statereset'})}).catch(()=>{});
          // #endregion
        }
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/5be1a6a7-7ee8-4fe8-9b00-19e37afd0e10',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'result/page.tsx:restore-empty',message:'保存済み画像なし',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2-storage'})}).catch(()=>{});
        // #endregion
      }
    }
  }, []);

  useEffect(() => {
    let storedName = sessionStorage.getItem("userName");
    let storedType = sessionStorage.getItem("dreamType");
    const storedResult = sessionStorage.getItem("diagnosisResult");

    // sessionStorageにない場合、localStorageから復元を試みる
    if (!storedName || !storedType) {
      const savedData = getSavedDiagnosisData();
      if (savedData?.userName && savedData?.dreamType) {
        storedName = savedData.userName;
        storedType = savedData.dreamType;
        // sessionStorageに復元
        sessionStorage.setItem("userName", storedName);
        sessionStorage.setItem("dreamType", storedType);
      }
    }

    if (!storedName || !storedType) {
      router.push("/");
      return;
    }

    // 状態を一度に設定
    const result = storedResult ? (() => {
      try {
        return JSON.parse(storedResult) as DiagnosisResult;
      } catch (error) {
        console.error("診断結果のパースエラー:", error);
        return null;
      }
    })() : null;

    // バッチ更新
    requestAnimationFrame(() => {
      if (result) {
        setDiagnosisResult(result);
      }
      setUserName(storedName!);
      setDreamType(storedType!);
    });

    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, [router]);

  // キューに参加して順番を待つ
  const joinQueue = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, action: "join" }),
      });
      const data = await response.json();
      
      setQueuePosition(data.position || 0);
      setTotalWaiting(data.totalWaiting || 0);
      setEstimatedWait(data.estimatedWaitSeconds || 0);
      
      return data.canProceed === true;
    } catch (error) {
      console.error("Queue join error:", error);
      return true; // エラー時は即時処理可能として続行
    }
  }, [sessionId]);

  // キュー状態をポーリング
  const pollQueueStatus = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`/api/queue?sessionId=${sessionId}`);
      const data = await response.json();
      
      setQueuePosition(data.position || 0);
      setTotalWaiting(data.totalWaiting || 0);
      setEstimatedWait(data.estimatedWaitSeconds || 0);
      
      return data.canProceed === true;
    } catch (error) {
      console.error("Queue poll error:", error);
      return true;
    }
  }, [sessionId]);

  // キューから離脱
  const leaveQueue = useCallback(async (action: "complete" | "cancel") => {
    try {
      await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, action }),
      });
    } catch (error) {
      console.error("Queue leave error:", error);
    }
  }, [sessionId]);

  // カード画像を生成（遊戯王スタイル・Gemini 3 Pro Image方式）
  const generateCard = useCallback(async () => {
    if (!dreamType || !userName || !diagnosisResult) return;
    if (isGenerating || isWaiting) return; // 二重実行防止

    const typeData = dreamTypes[dreamType];
    if (!typeData) return;

    setCardError(null);
    setGenerationProgress(0);

    // キューに参加
    setIsWaiting(true);
    let canProceed = await joinQueue();

    // 順番待ち
    while (!canProceed) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3秒ごとにチェック
      canProceed = await pollQueueStatus();
    }

    setIsWaiting(false);
    setIsGenerating(true);

    // プログレスアニメーション（疑似的な進捗表示）
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) return prev; // 90%で止める（完了時に100%にする）
        return prev + Math.random() * 10;
      });
    }, 1000);

    // タイムアウト設定
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`カード生成がタイムアウトしました（${CARD_GENERATION_TIMEOUT}秒）`));
      }, CARD_GENERATION_TIMEOUT * 1000);
    });

    try {
      // 占術データを整形
      const fortuneData = diagnosisResult.fortuneData ? {
        bazi: {
          yearPillar: diagnosisResult.fortuneData.bazi.meishiki.year.pillar,
          monthPillar: diagnosisResult.fortuneData.bazi.meishiki.month.pillar,
          dayPillar: diagnosisResult.fortuneData.bazi.meishiki.day.pillar,
          elementBalance: diagnosisResult.fortuneData.bazi.elementBalance,
        },
        kyusei: {
          name: diagnosisResult.fortuneData.kyusei.info.name,
          character: diagnosisResult.fortuneData.kyusei.info.character,
        },
        numerology: {
          lifePathNumber: diagnosisResult.fortuneData.numerology.lifePathNumber.number,
          name: diagnosisResult.fortuneData.numerology.lifePathNumber.info.name,
          mission: diagnosisResult.fortuneData.numerology.lifePathNumber.info.mission,
        },
      } : undefined;

      // 遊戯王スタイル - 全情報を送信
      const cardData: CardDataGemini = {
        // 基本情報
        dreamType: typeData.id,
        typeName: typeData.name,
        displayName: typeData.name, // 不死鳥、妖狐等
        icon: typeData.icon,
        userName,
        
        // タイプ詳細
        element: typeData.id, // elementは存在しないためidを使用
        keywords: typeData.keywords,
        personality: typeData.description, // personalityは存在しないためdescriptionを使用
        strengths: typeData.strengths,
        
        // 診断結果
        personalizedMessage: diagnosisResult.personalizedMessage || typeData.description,
        
        // 占術データ
        fortuneData,
      };
      
      // タイムアウト付きでカード生成
      const imageUrl = await Promise.race([
        generateCardWithGemini(cardData),
        timeoutPromise
      ]);
      
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setCardImageUrl(imageUrl);
      setCardGenerated(true);
      
      // カード画像をローカルストレージに保存（再アクセス時に復元用）
      try {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/5be1a6a7-7ee8-4fe8-9b00-19e37afd0e10',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'result/page.tsx:save',message:'カード画像保存開始',data:{imageUrlLength:imageUrl.length,imageUrlType:imageUrl.startsWith('data:')? 'base64':'url',imageUrlPrefix:imageUrl.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4-save'})}).catch(()=>{});
        // #endregion
        
        localStorage.setItem(CARD_IMAGE_STORAGE_KEY, imageUrl);
        console.log("💾 カード画像をローカルストレージに保存しました");
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/5be1a6a7-7ee8-4fe8-9b00-19e37afd0e10',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'result/page.tsx:save-success',message:'カード画像保存成功',data:{storageKey:CARD_IMAGE_STORAGE_KEY},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4-save'})}).catch(()=>{});
        // #endregion
      } catch (storageError) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/5be1a6a7-7ee8-4fe8-9b00-19e37afd0e10',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'result/page.tsx:save-error',message:'カード画像保存失敗',data:{error:String(storageError)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4-save'})}).catch(()=>{});
        // #endregion
        console.warn("カード画像の保存に失敗:", storageError);
      }
      
      // キューから離脱（完了）
      await leaveQueue("complete");
    } catch (error) {
      clearInterval(progressInterval);
      console.error("カード生成エラー:", error);
      const errorMessage = error instanceof Error ? error.message : "不明なエラーが発生しました";
      setCardError(errorMessage);
      
      // キューから離脱（キャンセル）
      await leaveQueue("cancel");
    } finally {
      setIsGenerating(false);
      setIsWaiting(false);
    }
  }, [dreamType, userName, diagnosisResult, isGenerating, isWaiting, joinQueue, leaveQueue, pollQueueStatus]);

  // カード生成
  useEffect(() => {
    if (dreamType && userName && diagnosisResult && !cardGenerated) {
      // 非同期処理を適切に処理
      const runGenerate = async () => {
        try {
          await generateCard();
        } catch (error) {
          console.error("カード生成エラー:", error);
        }
      };
      runGenerate();
    }
  }, [dreamType, userName, diagnosisResult, cardGenerated, generateCard]);

  const handleSaveCard = async () => {
    if (!cardImageUrl || !cardGenerated) {
      alert("カード画像を生成中です。少々お待ちください。");
      return;
    }

    setIsDownloading(true);
    setSaveSuccess(false);
    
    try {
      const result = await downloadCardGemini(cardImageUrl, `kinman-card-${dreamType}-${userName}.png`);
      
      if (result.success) {
        setSaveSuccess(true);
        // 成功メッセージを3秒後に消す
        setTimeout(() => setSaveSuccess(false), 5000);
      }
    } catch (error) {
      console.error("保存エラー:", error);
      alert("保存に失敗しました。もう一度お試しください。");
    }
    setIsDownloading(false);
  };

  const typeData = dreamType ? dreamTypes[dreamType] : null;

  // 初期ローディングのタイムアウト管理
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  useEffect(() => {
    if (!typeData) {
      const timeout = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000); // 10秒でタイムアウト
      return () => clearTimeout(timeout);
    }
  }, [typeData]);

  if (!typeData) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <CosmicBackground accentColor="#9370db" intensity={0.8} />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center glass-card p-8 max-w-md"
        >
          {loadingTimeout ? (
            // タイムアウト時の表示
            <>
              <div className="text-5xl mb-4">😅</div>
              <h3 className="text-xl font-bold text-yellow-300 mb-2">
                読み込みに時間がかかっています
              </h3>
              <p className="text-purple-300 text-sm mb-4">
                診断データが見つかりませんでした。<br/>
                最初から診断をやり直してください。
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  sessionStorage.clear();
                  router.push("/");
                }}
                className="btn-primary w-full"
              >
                🏠 最初からやり直す
              </motion.button>
            </>
          ) : (
            // 通常のローディング表示（きんまん先生アニメーション）
            <>
              <motion.div
                className="relative"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* 発光エフェクト */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "radial-gradient(circle, rgba(147,112,219,0.4) 0%, transparent 70%)",
                    filter: "blur(20px)",
                  }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <Image
                  src="/kinman-assets/kinman-crystal-ball.png"
                  alt="きんまん先生"
                  width={150}
                  height={150}
                  className="relative z-10"
                />
              </motion.div>
              <motion.p
                className="text-purple-300 mt-4"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                🔮 結果を読み込み中...
              </motion.p>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  const personalizedMessage = diagnosisResult?.personalizedMessage || typeData.description;

  return (
    <main className="min-h-screen py-8 px-4 relative overflow-hidden">
      {/* Three.js 宇宙背景 */}
      <CosmicBackground accentColor={typeData.color} intensity={1} />
      
      {/* 紙吹雪 */}
      {showConfetti && <Confetti />}

      {/* タイプカラーのグロウオーバーレイ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-[200px] opacity-20"
          style={{ backgroundColor: typeData.color }}
        />
        <div
          className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full blur-[180px] opacity-15"
          style={{ backgroundColor: "#ff6b9d" }}
        />
      </div>

      <div className="max-w-lg mx-auto relative z-10">
        {/* 結果発表ヘッダー */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          {/* きんまんキャラ */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="relative inline-block mb-4"
          >
            <div 
              className="absolute inset-0 rounded-full blur-2xl opacity-50"
              style={{ backgroundColor: typeData.color }}
            />
            <Image
              src="/images/kinman-standing-transparent.png"
              alt="きんまん先生"
              width={120}
              height={120}
              className="relative kinman-character"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-gradient text-glow mb-2">
              🎊 診断完了！🎊
            </h1>
            <p className="text-purple-200 text-lg">
              <span className="text-accent-gold font-bold">{userName}</span>さんの夢タイプは...
            </p>
          </motion.div>
        </motion.div>

        {/* カード画像表示 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ delay: 0.6, duration: 0.8, type: "spring" }}
          className="mb-6 flex justify-center"
        >
          <div className="relative">
            {cardImageUrl && !cardImageLoadError ? (
              <Image
                src={cardImageUrl}
                alt="生成されたカード"
                width={744}
                height={1052}
                className="rounded-2xl shadow-2xl max-w-full h-auto"
                style={{ 
                  maxHeight: "600px",
                  boxShadow: `0 0 60px ${typeData.color}40`,
                }}
                unoptimized
                onError={(e) => {
                  // #region agent log
                  fetch('http://127.0.0.1:7243/ingest/5be1a6a7-7ee8-4fe8-9b00-19e37afd0e10',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'result/page.tsx:image-error',message:'画像読み込みエラー',data:{cardImageUrlPrefix:cardImageUrl?.substring(0,100)||'null',cardImageUrlLength:cardImageUrl?.length||0},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5-image-load'})}).catch(()=>{});
                  // #endregion
                  console.error('画像読み込みエラー:', cardImageUrl?.substring(0, 100));
                  // 画像読み込みエラーを設定して再生成UIを表示
                  setCardImageLoadError(true);
                }}
                onLoad={() => {
                  // #region agent log
                  fetch('http://127.0.0.1:7243/ingest/5be1a6a7-7ee8-4fe8-9b00-19e37afd0e10',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'result/page.tsx:image-loaded',message:'画像読み込み成功',data:{cardImageUrlPrefix:cardImageUrl?.substring(0,100)||'null'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5-image-load'})}).catch(()=>{});
                  // #endregion
                  setCardImageLoadError(false);
                }}
              />
            ) : cardImageLoadError ? (
              // 画像読み込みエラー時（期限切れURL等）
              <div className="relative w-full max-w-md min-h-[400px] flex flex-col items-center justify-center bg-yellow-900/30 rounded-2xl p-6 border border-yellow-500/50">
                <div className="text-5xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold text-yellow-300 mb-2">カード画像の再生成が必要です</h3>
                <p className="text-yellow-200 text-sm text-center mb-4">
                  保存されていた画像データが古くなりました。<br/>
                  「再生成」ボタンを押してカードを作り直してください。
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    // 古いデータをクリアして再生成
                    localStorage.removeItem(CARD_IMAGE_STORAGE_KEY);
                    setCardImageUrl(null);
                    setCardGenerated(false);
                    setCardImageLoadError(false);
                    generateCard();
                  }}
                  className="btn-primary w-full max-w-xs"
                >
                  🔄 カードを再生成する
                </motion.button>
                <p className="text-purple-400 text-xs mt-4 text-center">
                  ※ 今回から画像は永続的に保存されます
                </p>
              </div>
            ) : cardError ? (
              // エラー表示
              <div className="relative w-full max-w-md min-h-[400px] flex flex-col items-center justify-center bg-red-900/30 rounded-2xl p-6 border border-red-500/50">
                <div className="text-5xl mb-4">😢</div>
                <h3 className="text-xl font-bold text-red-300 mb-2">カード生成エラー</h3>
                <p className="text-red-200 text-sm text-center mb-4">
                  {cardError}
                </p>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setCardError(null);
                      setCardGenerated(false);
                      generateCard();
                    }}
                    className="btn-primary w-full"
                  >
                    🔄 もう一度試す
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      // セッションをクリアしてホームに戻る
                      sessionStorage.clear();
                      router.push("/");
                    }}
                    className="btn-secondary w-full"
                  >
                    🏠 最初からやり直す
                  </motion.button>
                </div>
                <p className="text-purple-400 text-xs mt-4 text-center">
                  ※ エラーが続く場合は、しばらく時間をおいてからお試しください
                </p>
              </div>
            ) : isWaiting ? (
              // 待機中の表示
              <QueueWaitingAnimation 
                position={queuePosition || 1} 
                totalWaiting={totalWaiting} 
                estimatedWait={estimatedWait}
              />
            ) : (
              // ローディング表示（きんまん先生の占いアニメーション - AI生成フレーム使用）
              <FortuneLoadingAnimation progress={generationProgress} />
            )}
          </div>
        </motion.div>

        {/* パーソナライズメッセージ */}
        {personalizedMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="glass-card p-6 mb-6"
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <span className="text-gradient">あなたへのメッセージ</span>
            </h3>
            <p className="text-purple-100 leading-relaxed whitespace-pre-line">
              {personalizedMessage}
            </p>
          </motion.div>
        )}

        {/* タイプ情報カード */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="glass-card-gold p-6 mb-6 text-center relative overflow-hidden"
        >
          {/* 背景シマー */}
          <div className="shimmer absolute inset-0 pointer-events-none" />

          {/* タイプアイコン */}
          <motion.div
            animate={{ 
              scale: [1, 1.15, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="text-6xl mb-3"
          >
            {typeData.icon}
          </motion.div>

          {/* タイプ名 */}
          <h2 
            className="text-3xl font-bold mb-2 text-glow"
            style={{ color: typeData.color }}
          >
            {typeData.name}
          </h2>

          {/* キーワードタグ */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {typeData.keywords.map((keyword, index) => (
              <motion.span
                key={keyword}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 + index * 0.1 }}
                className="type-badge"
                style={{ 
                  borderColor: `${typeData.color}66`,
                  backgroundColor: `${typeData.color}22`
                }}
              >
                {keyword}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* あなたの強み */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2 }}
          className="glass-card p-6 mb-6"
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <span className="text-gradient">あなたの強み</span>
          </h3>
          <div className="space-y-2">
            {typeData.strengths.map((strength, index) => (
              <motion.div
                key={strength}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.3 + index * 0.1 }}
                className="strength-item"
              >
                {strength}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* アドバイス */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.4 }}
          className="glass-card p-6 mb-6 relative"
        >
          {/* きんまんミニアイコン */}
          <div className="absolute -top-6 -right-2">
            <Image
              src="/images/kinman-sitting-transparent.png"
              alt=""
              width={60}
              height={60}
              className="opacity-90"
            />
          </div>

          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">📝</span>
            <span className="text-gradient">引き寄せノートのアドバイス</span>
          </h3>
          <p className="text-purple-200 leading-relaxed">
            {typeData.advice}
          </p>
        </motion.div>

        {/* 占術データ表示 */}
        {diagnosisResult?.fortuneData && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="glass-card p-6 mb-8"
          >
            <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
              <span className="text-2xl">🔮</span>
              <span className="text-gradient">あなたの占術データ</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 九星気学 */}
              <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">⭐</span>
                  <h4 className="font-bold text-purple-200">九星気学</h4>
                </div>
                <p className="text-lg font-bold text-accent-gold mb-1">
                  {diagnosisResult.fortuneData.kyusei.info.name}
                </p>
                <p className="text-sm text-purple-300">
                  {diagnosisResult.fortuneData.kyusei.info.character}
                </p>
                <p className="text-xs text-purple-400 mt-1">
                  系統: {diagnosisResult.fortuneData.kyusei.info.type}
                </p>
              </div>

              {/* 数秘術 */}
              <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🔢</span>
                  <h4 className="font-bold text-purple-200">数秘術</h4>
                </div>
                <p className="text-lg font-bold text-accent-gold mb-1">
                  ライフパス {diagnosisResult.fortuneData.numerology.lifePathNumber.number}
                </p>
                <p className="text-sm text-purple-300">
                  {diagnosisResult.fortuneData.numerology.lifePathNumber.info.name}
                </p>
                <p className="text-xs text-purple-400 mt-1">
                  使命: {diagnosisResult.fortuneData.numerology.lifePathNumber.info.mission}
                </p>
              </div>

              {/* 四柱推命 */}
              <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-500/20 md:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🐉</span>
                  <h4 className="font-bold text-purple-200">四柱推命（命式）</h4>
                </div>
                
                <div className="flex flex-wrap gap-3 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-purple-400 mb-1">年柱</p>
                    <p className="text-lg font-bold text-white bg-purple-800/50 px-3 py-1 rounded">
                      {diagnosisResult.fortuneData.bazi.meishiki.year.pillar}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-purple-400 mb-1">月柱</p>
                    <p className="text-lg font-bold text-white bg-purple-800/50 px-3 py-1 rounded">
                      {diagnosisResult.fortuneData.bazi.meishiki.month.pillar}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-purple-400 mb-1">日柱</p>
                    <p className="text-lg font-bold text-white bg-purple-800/50 px-3 py-1 rounded">
                      {diagnosisResult.fortuneData.bazi.meishiki.day.pillar}
                    </p>
                  </div>
                </div>

                {/* 五行バランス */}
                <div>
                  <p className="text-xs text-purple-400 mb-2">五行バランス</p>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { key: "wood", name: "木", color: "#22c55e" },
                      { key: "fire", name: "火", color: "#ef4444" },
                      { key: "earth", name: "土", color: "#eab308" },
                      { key: "metal", name: "金", color: "#94a3b8" },
                      { key: "water", name: "水", color: "#3b82f6" },
                    ].map(({ key, name, color }) => (
                      <div
                        key={key}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-black/30"
                      >
                        <span 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs text-purple-200">{name}</span>
                        <span className="text-sm font-bold" style={{ color }}>
                          {diagnosisResult.fortuneData?.bazi.elementBalance[key as keyof typeof diagnosisResult.fortuneData.bazi.elementBalance]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-purple-400/60 mt-4 text-center">
              ※ 四柱推命・九星気学・数秘術を統合して診断しています
            </p>
          </motion.div>
        )}

        {/* カード保存セクション - シンプル＆スマホフレンドリー */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          className="glass-card-gold p-6 mb-8 relative overflow-hidden"
        >
          {/* キラキラ背景 */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-purple-500/10 pointer-events-none" />
          
          <h3 className="text-xl font-bold text-center mb-3 text-gradient relative">
            🎴 カードを写真に保存
          </h3>
          
          {/* 待ち受け訴求バナー */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.8 }}
            className="relative mb-6 p-4 rounded-xl text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,100,150,0.2) 100%)',
              border: '2px solid rgba(255,215,0,0.5)',
            }}
          >
            <motion.p
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-lg font-black mb-2"
              style={{
                background: 'linear-gradient(90deg, #FFD700, #FF6B9D, #FFD700)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              📱 待ち受けにして引き寄せ力UP！✨
            </motion.p>
            <p className="text-sm text-purple-200">
              毎日カードを見ることで潜在意識に働きかけ、<br/>
              <span className="text-yellow-400 font-bold">夢の実現を加速</span>させましょう！
            </p>
          </motion.div>

          {/* 保存成功メッセージ */}
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-center"
            >
              <p className="text-green-300 font-bold">✅ 保存完了！</p>
              <p className="text-green-200 text-sm">写真アプリで待ち受けに設定してね！</p>
            </motion.div>
          )}

          {/* カード保存ボタン */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSaveCard}
            disabled={isDownloading || !cardGenerated}
            className="btn-gold w-full mb-4 disabled:opacity-50 relative text-lg py-4"
          >
            {isDownloading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  ⏳
                </motion.span>
                保存中...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                {canShare ? "📲 写真に保存する" : "📥 カードを保存する"}
              </span>
            )}
          </motion.button>
          
          {/* 待ち受け設定ガイド */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="text-center p-3 bg-black/20 rounded-lg"
          >
            <p className="text-xs text-purple-300 mb-1">📲 保存後の待ち受け設定</p>
            <p className="text-xs text-purple-400">
              {canShare ? (
                <>「写真に保存」を選択 → 写真アプリで壁紙に設定</>
              ) : (
                <>
                  iPhone: 写真アプリ → 共有 → 壁紙に設定<br/>
                  Android: ギャラリー → メニュー → 壁紙に設定
                </>
              )}
            </p>
          </motion.div>
        </motion.div>

        {/* フッター */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="text-center pb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image
              src="/images/kinman-standing-transparent.png"
              alt=""
              width={40}
              height={40}
            />
            <p className="text-purple-200 text-lg">
              講座でお会いしましょう！ ✨
            </p>
          </div>
          <p className="text-purple-500/50 text-sm">
            Date with Dream Note © 2025
          </p>
        </motion.div>
      </div>
    </main>
  );
}
