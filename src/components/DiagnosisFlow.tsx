/**
 * 夢タイプ診断ガチャ - 演出フローコンポーネント
 * Manus AI 調査結果を基に実装
 * 
 * 3段階演出:
 * 1. 共通演出（8秒）- きんまん + 水晶玉
 * 2. タイプ別演出（8秒）- 診断結果の動物 + バックグラウンドカード生成
 * 3. カード登場（2秒）- 3D回転 + エフェクト
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

// ==================== ステージ1: 共通演出（きんまん先生の占い動画） ====================

function CommonRevealStage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black z-50"
    >
      <div className="relative w-full max-w-md px-4">
        {/* 背景グロー */}
        <motion.div
          className="absolute inset-0 rounded-2xl blur-2xl opacity-40"
          style={{
            background: "radial-gradient(circle, rgba(147,112,219,0.8) 0%, rgba(147,112,219,0) 70%)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* メインコンテンツ */}
        <motion.div
          className="relative z-10"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* きんまん先生の占い動画 */}
          <div className="relative bg-gradient-to-b from-purple-900/80 to-indigo-900/80 rounded-2xl p-6 overflow-hidden">
            <motion.div
              className="relative flex justify-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
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

            {/* テキスト */}
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

            {/* ローディングドット */}
            <div className="flex justify-center gap-2 mt-3">
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
        </motion.div>
      </div>
    </motion.div>
  );
}

// ==================== ステージ2: タイプ別演出 ====================

function TypeSpecificStage({ dreamType, typeColor }: { dreamType: string; typeColor: string }) {
  const typeData = dreamTypes[dreamType];
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 flex items-center justify-center bg-black z-50"
    >
      <div className="relative w-full max-w-lg px-4">
        {/* 背景エフェクト */}
        <motion.div
          className="absolute inset-0 rounded-3xl"
          animate={{
            boxShadow: [
              `0 0 30px ${typeColor}50`,
              `0 0 60px ${typeColor}80`,
              `0 0 30px ${typeColor}50`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* タイプアイコン大表示 */}
        <motion.div
          className="relative z-10 flex flex-col items-center justify-center aspect-square"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
        >
          {/* 光の輪 */}
          <motion.div
            className="absolute w-64 h-64 rounded-full border-4"
            style={{ borderColor: typeColor }}
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute w-80 h-80 rounded-full border-2"
            style={{ borderColor: `${typeColor}60` }}
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          />

          {/* タイプアイコン */}
          <motion.div
            className="text-9xl z-10"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {typeData?.icon || '✨'}
          </motion.div>

          {/* タイプ名 */}
          <motion.h2
            className="mt-8 text-3xl font-bold text-white text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ textShadow: `0 0 20px ${typeColor}` }}
          >
            {typeData?.name || dreamType}タイプ
          </motion.h2>
        </motion.div>

        {/* ローディングインジケーター */}
        <motion.div
          className="absolute bottom-8 left-0 right-0 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 rounded-full bg-white"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ==================== ステージ3: カード登場 ====================

function CardReveal({ 
  cardImage, 
  typeColor,
  onAnimationComplete 
}: { 
  cardImage: string; 
  typeColor: string;
  onAnimationComplete?: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-black z-50"
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
  const [stage, setStage] = useState<'common' | 'type-specific' | 'card'>('common');
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const typeData = dreamTypes[result.dreamType];
  const typeColor = typeData?.color || '#a855f7';

  // ステージ1: 共通演出（8秒）
  useEffect(() => {
    if (stage === 'common') {
      const timer = setTimeout(() => {
        setStage('type-specific');
      }, 6000); // 少し短めに調整

      return () => clearTimeout(timer);
    }
  }, [stage]);

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
    } catch (error) {
      console.error('Failed to generate card:', error);
      // フォールバック: タイプのカード画像を使用
      setCardImage(typeData ? `/cards/kinman-${typeData.id}.png` : '/images/fallback-card.png');
    } finally {
      setIsGenerating(false);
    }
  }, [result, isGenerating, cardImage, typeData]);

  // ステージ2: タイプ別演出（8秒）+ バックグラウンドでカード生成
  useEffect(() => {
    if (stage === 'type-specific') {
      // カード生成を開始
      generateCard();

      // 8秒後にカードステージへ
      const timer = setTimeout(() => {
        setStage('card');
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [stage, generateCard]);

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
      {stage === 'common' && <CommonRevealStage key="common" />}
      {stage === 'type-specific' && (
        <TypeSpecificStage 
          key="type" 
          dreamType={result.dreamType} 
          typeColor={typeColor}
        />
      )}
      {stage === 'card' && cardImage && (
        <CardReveal
          key="card"
          cardImage={cardImage}
          typeColor={typeColor}
          onAnimationComplete={handleCardAnimationComplete}
        />
      )}
      {stage === 'card' && !cardImage && (
        <TypeSpecificStage 
          key="type-waiting" 
          dreamType={result.dreamType} 
          typeColor={typeColor}
        />
      )}
    </AnimatePresence>
  );
}

export default DiagnosisFlow;















