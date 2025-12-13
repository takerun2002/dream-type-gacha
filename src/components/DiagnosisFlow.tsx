/**
 * 夢タイプ診断ガチャ - 演出フローコンポーネント
 *
 * 2段階演出:
 * 1. きんまん先生の占い演出（動画 + プログレスバー）- カード生成完了まで継続
 * 2. カード登場（3D回転 + パーティクルエフェクト）
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { generateCardWithGemini, type CardDataGemini } from '@/lib/cardGeneratorGemini';
import { dreamTypes } from '@/lib/dreamTypes';

// ==================== 型定義 ====================

interface DiagnosisResult {
  dreamType: string;
  typeName: string;
  displayName: string;
  message: string;
  icon: string;
  userName: string;
  element: string;
  keywords: string[];
  personality: string;
  strengths: string[];
  fortuneData?: {
    bazi?: {
      yearPillar: string;
      monthPillar: string;
      dayPillar: string;
      elementBalance: {
        wood: number;
        fire: number;
        earth: number;
        metal: number;
        water: number;
      };
    };
    kyusei?: {
      name: string;
      character: string;
    };
    numerology?: {
      lifePathNumber: number;
      name: string;
      mission: string;
    };
  };
}

interface DiagnosisFlowProps {
  result: DiagnosisResult;
  onComplete: (cardImage: string) => void;
}

// ==================== きんまん先生の占い演出（動画 + プログレスバー） ====================

function FortuneLoadingStage({ progress, typeName }: { progress: number; typeName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black z-50"
    >
      <div className="relative w-full max-w-md min-h-[400px] flex flex-col items-center justify-center bg-gradient-to-b from-purple-900/80 to-indigo-900/80 rounded-2xl p-6 mx-4 overflow-hidden">
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
            きんまん先生が{typeName}カードを召喚中
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

        {/* 四柱推命データ計算中... の表示 */}
        <motion.p
          className="text-xs text-purple-400/80 mt-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {progress < 30 && "四柱推命データを計算中..."}
          {progress >= 30 && progress < 60 && "九星気学を分析中..."}
          {progress >= 60 && progress < 90 && "カードを生成中..."}
          {progress >= 90 && "まもなく完了..."}
        </motion.p>
      </div>
    </motion.div>
  );
}

// ==================== カード登場演出 ====================

function CardRevealStage({
  cardImage,
  typeColor,
  typeName,
  typeIcon,
  onAnimationComplete
}: {
  cardImage: string;
  typeColor: string;
  typeName: string;
  typeIcon: string;
  onAnimationComplete?: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center bg-black z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* ゴールドオーラ背景 */}
      <motion.div
        className="absolute w-96 h-96 rounded-full blur-3xl"
        style={{ backgroundColor: typeColor }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1.5, opacity: 0.4 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />

      {/* 外側のリング */}
      <motion.div
        className="absolute w-80 h-80 rounded-full border-2"
        style={{ borderColor: `${typeColor}80` }}
        initial={{ scale: 0, opacity: 0, rotate: 0 }}
        animate={{ scale: 1.2, opacity: 0.6, rotate: 360 }}
        transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
      />

      {/* カード本体 */}
      <motion.div
        className="relative z-10 w-72 md:w-80 rounded-2xl shadow-2xl overflow-hidden"
        initial={{ rotateY: 180, scale: 0.3, opacity: 0 }}
        animate={{ rotateY: 0, scale: 1, opacity: 1 }}
        transition={{
          duration: 0.9,
          ease: 'easeOut',
          type: 'spring',
          stiffness: 100,
          damping: 15,
        }}
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d',
          boxShadow: `0 0 40px ${typeColor}60`,
        }}
        onAnimationComplete={onAnimationComplete}
      >
        <Image
          src={cardImage}
          alt="Dream Type Card"
          width={400}
          height={600}
          className="w-full h-auto"
          unoptimized
        />

        {/* カードの光沢エフェクト */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-transparent"
          animate={{ opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>

      {/* タイプ名表示 */}
      <motion.div
        className="mt-6 text-center z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-3xl font-bold" style={{ color: typeColor, textShadow: `0 0 20px ${typeColor}` }}>
          {typeIcon} {typeName}
        </p>
        <p className="text-purple-300 text-sm mt-2">
          あなたの守護獣が判明しました！
        </p>
      </motion.div>

      {/* パーティクルエフェクト */}
      <ParticleEffect color={typeColor} />

      {/* キラキラエフェクト */}
      <SparkleEffect />
    </motion.div>
  );
}

// ==================== パーティクルエフェクト ====================

function ParticleEffect({ color }: { color: string }) {
  const particles = Array.from({ length: 30 }, (_, i) => i);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((i) => {
        const angle = (i / particles.length) * Math.PI * 2;
        const distance = 150 + Math.random() * 100;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        return (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full"
            style={{
              background: `linear-gradient(to right, ${color}, white)`,
              left: '50%',
              top: '50%',
              marginLeft: '-6px',
              marginTop: '-6px',
              filter: `drop-shadow(0 0 6px ${color})`,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x, y, opacity: 0, scale: 0 }}
            transition={{
              duration: 1.2 + Math.random() * 0.4,
              delay: Math.random() * 0.2,
              ease: 'easeOut',
            }}
          />
        );
      })}
    </div>
  );
}

// ==================== キラキラエフェクト ====================

function SparkleEffect() {
  const sparkles = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {sparkles.map((i) => {
        const angle = (i / sparkles.length) * Math.PI * 2;
        const radius = 160;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full"
            style={{
              left: '50%',
              top: '50%',
              marginLeft: '-4px',
              marginTop: '-4px',
              filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 1))',
            }}
            animate={{
              x: [x * 0.5, x, x * 0.5],
              y: [y * 0.5, y, y * 0.5],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              delay: i * 0.1,
              ease: 'easeInOut',
              repeat: Infinity,
            }}
          />
        );
      })}
    </div>
  );
}

// ==================== 統合フロー ====================

export function DiagnosisFlow({ result, onComplete }: DiagnosisFlowProps) {
  const [stage, setStage] = useState<'loading' | 'card'>('loading');
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const typeData = dreamTypes[result.dreamType];
  const typeColor = typeData?.color || '#a855f7';
  const typeName = typeData?.name || result.typeName;
  const typeIcon = typeData?.icon || '✨';

  // カード生成関数
  const generateCard = useCallback(async () => {
    if (isGenerating || cardImage) return;

    setIsGenerating(true);

    try {
      const cardData: CardDataGemini = {
        dreamType: result.dreamType,
        typeName: result.typeName,
        displayName: result.displayName,
        icon: result.icon,
        userName: result.userName,
        element: result.element,
        keywords: result.keywords,
        personality: result.personality,
        strengths: result.strengths,
        personalizedMessage: result.message,
        fortuneData: result.fortuneData,
      };

      const imageUrl = await generateCardWithGemini(cardData);
      setCardImage(imageUrl);
      setProgress(100);
    } catch (error) {
      console.error('Failed to generate card:', error);
      // フォールバック: タイプのカード画像を使用
      setCardImage(typeData ? `/cards/kinman-${typeData.id}.png` : '/images/fallback-card.png');
      setProgress(100);
    } finally {
      setIsGenerating(false);
    }
  }, [result, isGenerating, cardImage, typeData]);

  // マウント時にカード生成開始
  useEffect(() => {
    generateCard();
  }, [generateCard]);

  // プログレスアニメーション（疑似的な進捗表示）
  useEffect(() => {
    if (stage !== 'loading') return;

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev; // 90%で止める（完了時に100%になる）
        return prev + Math.random() * 8;
      });
    }, 800);

    return () => clearInterval(progressInterval);
  }, [stage]);

  // カード生成完了時にステージ切り替え
  useEffect(() => {
    if (cardImage && progress >= 100) {
      // 少し待ってからカード表示へ
      const timer = setTimeout(() => {
        setStage('card');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [cardImage, progress]);

  // カード完了時の処理
  const handleCardAnimationComplete = useCallback(() => {
    if (cardImage) {
      // 少し待ってから完了を通知
      setTimeout(() => {
        onComplete(cardImage);
      }, 1500);
    }
  }, [cardImage, onComplete]);

  return (
    <AnimatePresence mode="wait">
      {stage === 'loading' && (
        <FortuneLoadingStage
          key="loading"
          progress={progress}
          typeName={typeName}
        />
      )}
      {stage === 'card' && cardImage && (
        <CardRevealStage
          key="card"
          cardImage={cardImage}
          typeColor={typeColor}
          typeName={typeName}
          typeIcon={typeIcon}
          onAnimationComplete={handleCardAnimationComplete}
        />
      )}
    </AnimatePresence>
  );
}

export default DiagnosisFlow;
