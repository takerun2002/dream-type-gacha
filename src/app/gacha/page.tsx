"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { dreamTypes } from "@/lib/dreamTypes";
import Particles from "@/components/Particles";
import GachaEffects from "@/components/GachaEffects";

type Phase = "ready" | "reveal" | "complete";

// キラキラエフェクトコンポーネント
function Sparkles({ typeData }: { typeData: typeof dreamTypes[keyof typeof dreamTypes] }) {
  const sparklePositions = useMemo(() => {
    // 固定のシード値を使用してランダム性を確保
    const positions: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < 30; i++) {
      // シードベースの疑似乱数生成
      const seed = i * 0.618033988749895; // 黄金比
      const x = 50 + (Math.sin(seed * 1000) * 40);
      const y = 50 + (Math.cos(seed * 1000) * 40);
      positions.push({ x, y });
    }
    return positions;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5 }}
      className="fixed inset-0 pointer-events-none"
    >
      {sparklePositions.map((pos, i) => (
        <motion.div
          key={i}
          initial={{
            opacity: 0,
            scale: 0,
            x: "50%",
            y: "50%",
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            x: `${pos.x}%`,
            y: `${pos.y}%`,
          }}
          transition={{
            duration: 2,
            delay: 1.5 + i * 0.05,
          }}
          className="absolute w-3 h-3 rounded-full"
          style={{
            backgroundColor: i % 3 === 0 ? "#fbbf24" : i % 3 === 1 ? typeData.color : "#9333ea",
            boxShadow: `0 0 15px ${i % 3 === 0 ? "#fbbf24" : i % 3 === 1 ? typeData.color : "#9333ea"}`,
          }}
        />
      ))}
    </motion.div>
  );
}

export default function GachaPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("ready");
  const [userName, setUserName] = useState("");
  const [dreamType, setDreamType] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSparkles, setShowSparkles] = useState(false);

  useEffect(() => {
    const storedName = sessionStorage.getItem("userName");
    const storedType = sessionStorage.getItem("dreamType");

    if (!storedName || !storedType) {
      router.push("/");
      return;
    }

    // バッチ更新
    requestAnimationFrame(() => {
      setUserName(storedName);
      setDreamType(storedType);
    });
  }, [router]);

  const handleStart = useCallback(() => {
    if (phase !== "ready") return;
    
    setPhase("reveal");
    setShowSparkles(true);

    setTimeout(() => {
      setPhase("complete");
      
      setTimeout(() => {
        router.push("/result");
      }, 2500);
    }, 3500);
  }, [phase, router]);

  const handleSkip = () => {
    router.push("/result");
  };

  const typeData = dreamType ? dreamTypes[dreamType] : null;

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ 
        background: "radial-gradient(ellipse at center, #1a0a2e 0%, #0a0612 50%, #000000 100%)"
      }}
      onClick={phase === "ready" ? handleStart : undefined}
    >
      {/* 背景の星 */}
      <div className="stars-bg opacity-50" />

      {/* パーティクルエフェクト */}
      {showSparkles && <Particles />}
      
      {/* 強化版ガチャエフェクト */}
      <GachaEffects 
        isActive={phase === "reveal"} 
        color={typeData?.color || "#9333ea"} 
      />

      {/* スキップボタン */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={(e) => {
          e.stopPropagation();
          handleSkip();
        }}
        className="fixed top-4 right-4 z-50 px-4 py-2 bg-purple-600/80 hover:bg-purple-500 text-white rounded-full text-sm font-medium transition-colors backdrop-blur-sm border border-purple-400/30"
      >
        スキップ →
      </motion.button>

      {/* 音声コントロール */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setSoundEnabled(!soundEnabled);
        }}
        className="fixed top-4 left-4 z-50 w-10 h-10 flex items-center justify-center text-2xl bg-black/30 rounded-full backdrop-blur-sm"
      >
        {soundEnabled ? "🔊" : "🔇"}
      </button>

      <AnimatePresence mode="wait">
        {/* ========== 準備フェーズ ========== */}
        {phase === "ready" && (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            {/* きんまんキャラ */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <Image
                src="/images/kinman-sitting-transparent.png"
                alt="きんまん先生"
                width={100}
                height={100}
                className="mx-auto kinman-character opacity-80"
              />
            </motion.div>

            {/* カード（裏面） */}
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 30px rgba(147, 51, 234, 0.3), 0 0 60px rgba(251, 191, 36, 0.1)",
                  "0 0 60px rgba(147, 51, 234, 0.6), 0 0 100px rgba(251, 191, 36, 0.3)",
                  "0 0 30px rgba(147, 51, 234, 0.3), 0 0 60px rgba(251, 191, 36, 0.1)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="gacha-card mx-auto mb-8"
            >
              <div className="gacha-card-inner">
                <div className="gacha-card-front">
                  {/* カード裏面デザイン */}
                  <div className="relative w-full h-full flex flex-col items-center justify-center p-6">
                    {/* 装飾パターン */}
                    <div className="absolute inset-4 border-2 border-purple-500/30 rounded-xl" />
                    <div className="absolute inset-6 border border-gold-400/20 rounded-lg" />
                    
                    {/* メインコンテンツ */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="text-6xl mb-6"
                    >
                      ✨
                    </motion.div>
                    
                    <div className="text-gradient text-2xl font-bold tracking-wider mb-2">
                      KINMAN CARD
                    </div>
                    <div className="text-purple-400/60 text-sm">
                      Dream Type Gacha
                    </div>
                    
                    {/* 下部のブランド */}
                    <div className="absolute bottom-6 text-purple-500/40 text-xs">
                      Date with Dream Note
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* タップ指示 */}
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-center"
            >
              <p className="text-purple-300 text-lg mb-2">
                {userName}さんの夢タイプは...
              </p>
              <p className="text-accent-gold font-bold text-xl">
                ✨ タップして開封 ✨
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* ========== 開封フェーズ ========== */}
        {phase === "reveal" && typeData && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            {/* カードフリップ */}
            <div className="gacha-card mx-auto mb-8 perspective-1000">
              <motion.div
                initial={{ rotateY: 0 }}
                animate={{ rotateY: 180 }}
                transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
                className="gacha-card-inner"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* 裏面 */}
                <div className="gacha-card-front" style={{ backfaceVisibility: "hidden" }}>
                  <div className="flex flex-col items-center justify-center h-full p-8">
                    <div className="text-6xl mb-4">✨</div>
                    <div className="text-purple-300 text-lg font-bold">
                      KINMAN CARD
                    </div>
                  </div>
                </div>

                {/* 表面 - カード画像 */}
                <div
                  className="gacha-card-back absolute inset-0"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="w-full h-full relative overflow-hidden rounded-2xl"
                  >
                    <Image
                      src={typeData.cardImage}
                      alt={typeData.name}
                      fill
                      className="object-cover"
                      priority
                    />
                    {/* グロー効果 */}
                    <div 
                      className="absolute inset-0 opacity-30"
                      style={{
                        background: `radial-gradient(circle at center, ${typeData.color} 0%, transparent 70%)`
                      }}
                    />
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* 放射状キラキラ */}
            <Sparkles typeData={typeData} />

            {/* テキスト */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5 }}
              className="text-purple-300 text-lg"
            >
              あなたの守護獣が判明しました！
            </motion.p>
          </motion.div>
        )}

        {/* ========== 完了フェーズ ========== */}
        {phase === "complete" && typeData && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="text-center"
          >
            {/* カード画像表示 */}
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6 relative w-[260px] h-[370px] mx-auto"
            >
              <Image
                src={typeData.cardImage}
                alt={typeData.name}
                fill
                className="object-contain rounded-2xl"
                style={{
                  boxShadow: `0 0 40px ${typeData.color}60`,
                }}
              />
              {/* キラキラアニメーション */}
              <motion.div
                animate={{ 
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.05, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: `linear-gradient(45deg, transparent 40%, ${typeData.color}40 50%, transparent 60%)`,
                  backgroundSize: "200% 200%",
                }}
              />
            </motion.div>

            {/* タイプ名 */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold mb-2 text-glow"
              style={{ color: typeData.color }}
            >
              {typeData.icon} {typeData.name}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-purple-300 text-sm mb-4"
            >
              {typeData.nameEn}
            </motion.p>

            {/* ローディング */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-purple-300"
            >
              <p className="mb-4">詳細な診断結果を準備中...</p>
              <div className="flex justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -8, 0] }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      delay: i * 0.15
                    }}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: typeData.color }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
