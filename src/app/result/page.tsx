"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { dreamTypes } from "@/lib/dreamTypes";
import { generateCardWithGemini, downloadCardGemini, isShareSupported, type CardDataGemini } from "@/lib/cardGeneratorGemini";
import { getSavedDiagnosisData } from "@/lib/diagnosisRecord";
import Confetti from "@/components/Confetti";

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
  typeNameEn: string;
  personalizedMessage: string;
  color: string;
  frameColor: string;
  fortuneData?: FortuneData;
  [key: string]: unknown;
}

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
  // Web Share API対応チェック（クライアントサイドのみ）
  const [canShare, setCanShare] = useState(() => {
    if (typeof window === "undefined") return false;
    return isShareSupported();
  });

  // マウント時にWeb Share API対応を再チェック
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCanShare(isShareSupported());
    }
  }, []);

  useEffect(() => {
    let storedName = sessionStorage.getItem("userName");
    let storedType = sessionStorage.getItem("dreamType");
    let storedResult = sessionStorage.getItem("diagnosisResult");

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

  // カード画像を生成（遊戯王スタイル・Gemini 3 Pro Image方式）
  const generateCard = useCallback(async () => {
    if (!dreamType || !userName || !diagnosisResult) return;

    const typeData = dreamTypes[dreamType];
    if (!typeData) return;

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
        displayName: typeData.displayName, // 不死鳥、妖狐等
        icon: typeData.icon,
        userName,
        
        // タイプ詳細
        element: typeData.element,
        keywords: typeData.keywords,
        personality: typeData.personality,
        strengths: typeData.strengths,
        
        // 診断結果
        personalizedMessage: diagnosisResult.personalizedMessage || typeData.description,
        
        // 占術データ
        fortuneData,
      };
      
      const imageUrl = await generateCardWithGemini(cardData);
      setCardImageUrl(imageUrl);
      setCardGenerated(true);
    } catch (error) {
      console.error("カード生成エラー:", error);
      alert("カード生成に失敗しました。もう一度お試しください。");
    }
  }, [dreamType, userName, diagnosisResult]);

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

  if (!typeData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-dream">
        <div className="stars-bg" />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center glass-card p-8"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-5xl mb-4"
          >
            🔮
          </motion.div>
          <p className="text-purple-300">結果を読み込み中...</p>
        </motion.div>
      </div>
    );
  }

  const personalizedMessage = diagnosisResult?.personalizedMessage || typeData.description;

  return (
    <main className="min-h-screen py-8 px-4 relative overflow-hidden bg-gradient-dream">
      {/* 背景 */}
      <div className="stars-bg" />
      
      {/* 紙吹雪 */}
      {showConfetti && <Confetti />}

      {/* タイプカラーのグラデーション装飾 */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[150px] opacity-30"
          style={{ backgroundColor: typeData.color }}
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
            {cardImageUrl ? (
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
              />
            ) : (
              <div className="relative w-full max-w-md h-[600px] flex items-center justify-center bg-gray-800/50 rounded-2xl">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="text-4xl mb-4"
                >
                  ⏳
                </motion.div>
                <p className="text-purple-300">カード生成中...</p>
              </div>
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
          <p className="text-purple-300 text-sm mb-4">{typeData.nameEn}</p>

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
