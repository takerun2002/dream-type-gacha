"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";

interface GachaEffectsProps {
  isActive: boolean;
  color?: string;
  onComplete?: () => void;
}

// 光線エフェクト
function LightRays({ color }: { color: string }) {
  const rays = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      angle: (i * 30) + Math.sin(i) * 5,
      length: 150 + Math.cos(i * 0.5) * 50,
      width: 2 + Math.sin(i) * 1,
      delay: i * 0.05,
    }));
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {rays.map((ray, i) => (
        <motion.div
          key={i}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ 
            scaleY: [0, 1, 1.5, 0],
            opacity: [0, 0.8, 0.6, 0],
          }}
          transition={{
            duration: 1.5,
            delay: ray.delay,
            ease: "easeOut",
          }}
          style={{
            position: "absolute",
            width: `${ray.width}px`,
            height: `${ray.length}px`,
            background: `linear-gradient(to top, transparent 0%, ${color}80 30%, ${color} 60%, transparent 100%)`,
            transformOrigin: "bottom center",
            transform: `rotate(${ray.angle}deg)`,
            filter: "blur(1px)",
          }}
        />
      ))}
    </div>
  );
}

// 爆発パーティクル
function BurstParticles({ color }: { color: string }) {
  const particles = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => {
      const angle = (i / 40) * Math.PI * 2;
      const radius = 100 + Math.random() * 150;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        size: 4 + Math.random() * 8,
        delay: Math.random() * 0.3,
        duration: 1 + Math.random() * 0.5,
        colorVariant: i % 4,
      };
    });
  }, []);

  const getColor = (variant: number) => {
    switch(variant) {
      case 0: return color;
      case 1: return "#fbbf24"; // gold
      case 2: return "#ffffff"; // white
      default: return "#ec4899"; // pink
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: 0, 
            y: 0, 
            scale: 0,
            opacity: 1,
          }}
          animate={{ 
            x: p.x, 
            y: p.y, 
            scale: [0, 1.5, 0],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeOut",
          }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: getColor(p.colorVariant),
            boxShadow: `0 0 10px ${getColor(p.colorVariant)}, 0 0 20px ${getColor(p.colorVariant)}80`,
          }}
        />
      ))}
    </div>
  );
}

// キラキラリング
function SparkleRing({ color, delay = 0 }: { color: string; delay?: number }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0.8 }}
      animate={{ scale: [0, 2, 3], opacity: [0.8, 0.4, 0] }}
      transition={{ duration: 1.5, delay, ease: "easeOut" }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <div
        style={{
          width: 200,
          height: 200,
          borderRadius: "50%",
          border: `3px solid ${color}`,
          boxShadow: `0 0 30px ${color}, inset 0 0 30px ${color}40`,
        }}
      />
    </motion.div>
  );
}

// 流れ星エフェクト
function ShootingStars({ color }: { color: string }) {
  const stars = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      startX: -100 + Math.random() * 400,
      startY: -50 + Math.random() * 100,
      endX: 200 + Math.random() * 300,
      endY: 200 + Math.random() * 200,
      delay: 0.5 + i * 0.15,
      duration: 0.6 + Math.random() * 0.3,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: star.startX, 
            y: star.startY,
            opacity: 0,
          }}
          animate={{ 
            x: star.endX, 
            y: star.endY,
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            width: 60,
            height: 2,
            background: `linear-gradient(to right, transparent, ${color}, ${color}, transparent)`,
            transform: "rotate(45deg)",
            filter: "blur(0.5px)",
            boxShadow: `0 0 10px ${color}`,
          }}
        />
      ))}
    </div>
  );
}

// 中央フラッシュ
function CenterFlash({ color }: { color: string }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: [0, 1, 3],
        opacity: [0, 1, 0],
      }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <div
        style={{
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color} 0%, ${color}80 30%, transparent 70%)`,
          filter: "blur(20px)",
        }}
      />
    </motion.div>
  );
}

// 渦巻きエフェクト
function SwirlEffect({ color }: { color: string }) {
  const spiralPoints = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => {
      const t = i / 20;
      const angle = t * Math.PI * 4;
      const radius = 30 + t * 120;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        delay: i * 0.03,
        size: 3 + t * 4,
      };
    });
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {spiralPoints.map((point, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: 0, 
            y: 0, 
            scale: 0,
            opacity: 0,
          }}
          animate={{ 
            x: point.x, 
            y: point.y, 
            scale: [0, 1, 0.5],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1,
            delay: point.delay,
            ease: "easeOut",
          }}
          style={{
            position: "absolute",
            width: point.size,
            height: point.size,
            borderRadius: "50%",
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      ))}
    </div>
  );
}

// メインのGachaEffectsコンポーネント
export default function GachaEffects({ 
  isActive, 
  color = "#9333ea",
  onComplete 
}: GachaEffectsProps) {
  const [phase, setPhase] = useState<"idle" | "burst" | "complete">("idle");

  useEffect(() => {
    if (isActive) {
      setPhase("burst");
      
      const timer = setTimeout(() => {
        setPhase("complete");
        onComplete?.();
      }, 2500);

      return () => clearTimeout(timer);
    } else {
      setPhase("idle");
    }
  }, [isActive, onComplete]);

  return (
    <AnimatePresence>
      {phase === "burst" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 pointer-events-none"
        >
          {/* 中央フラッシュ（最初） */}
          <CenterFlash color={color} />
          
          {/* 光線 */}
          <LightRays color={color} />
          
          {/* リング（複数） */}
          <SparkleRing color={color} delay={0.1} />
          <SparkleRing color="#fbbf24" delay={0.3} />
          <SparkleRing color="#ec4899" delay={0.5} />
          
          {/* 爆発パーティクル */}
          <BurstParticles color={color} />
          
          {/* 渦巻き */}
          <SwirlEffect color={color} />
          
          {/* 流れ星 */}
          <ShootingStars color={color} />
          
          {/* 画面全体のフラッシュ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at center, ${color}40 0%, transparent 70%)`,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 個別エフェクトもエクスポート
export { LightRays, BurstParticles, SparkleRing, ShootingStars, CenterFlash, SwirlEffect };

























