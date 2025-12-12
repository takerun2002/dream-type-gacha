"use client";

import { useState, Suspense, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { questions } from "@/lib/questions";
import ErrorBoundary from "@/components/ErrorBoundary";
import { checkCanDiagnose, recordDiagnosis } from "@/lib/diagnosisRecord";

// Three.js背景を遅延読み込み
const SpiritualBackground = dynamic(
  () => import("@/components/SpiritualBackground"),
  { 
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-gradient-dream -z-50" />
  }
);

type Step = "password" | "welcome" | "name" | "birthdate" | "questions" | "processing";

interface Answer {
  questionId: number;
  answerId?: string;
  textAnswer?: string;
}

// 🔐 合言葉（パスワード）設定
const SECRET_PASSWORD = process.env.NEXT_PUBLIC_ACCESS_PASSWORD || "kinman2025";

// リッチなオーラエフェクトコンポーネント
function MysticalAura() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
      {/* 浮遊する光のオーブ */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute rounded-full"
          style={{
            width: `${60 + i * 20}px`,
            height: `${60 + i * 20}px`,
            left: `${10 + i * 12}%`,
            top: `${20 + (i % 3) * 25}%`,
            background: `radial-gradient(circle, ${
              i % 2 === 0 
                ? 'rgba(255,215,0,0.3), rgba(255,215,0,0)' 
                : 'rgba(200,100,255,0.2), rgba(200,100,255,0)'
            })`,
            filter: 'blur(8px)',
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}
      
      {/* キラキラスパークル */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute"
          style={{
            left: `${5 + (i * 7) % 90}%`,
            top: `${10 + (i * 11) % 80}%`,
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            rotate: [0, 180],
          }}
          transition={{
            duration: 2 + (i % 3),
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeInOut",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path
              d="M10 0L12 8L20 10L12 12L10 20L8 12L0 10L8 8L10 0Z"
              fill={i % 3 === 0 ? "#FFD700" : i % 3 === 1 ? "#FFF" : "#C8A2FF"}
              opacity="0.8"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("password"); // 最初はパスワード画面
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [userName, setUserName] = useState("");
  const [birthDate, setBirthDate] = useState({ year: 2000, month: 1, day: 1 });
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [isHovering, setIsHovering] = useState(false);
  const [isAlreadyDiagnosed, setIsAlreadyDiagnosed] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(true);

  // パスワード認証
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inputPassword = password.trim().toLowerCase();
    const correctPassword = SECRET_PASSWORD.toLowerCase();
    
    if (inputPassword === correctPassword) {
      setPasswordError(false);
      // 診断済みの場合はリザルトへ、そうでなければウェルカムへ
      if (isAlreadyDiagnosed) {
        const rid = localStorage.getItem("dream_diagnosis_record_id");
        router.push(rid ? `/result?rid=${encodeURIComponent(rid)}` : "/result");
      } else {
        setStep("welcome");
      }
    } else {
      setPasswordError(true);
    }
  };

  // 診断済みチェック（おひとり様1回制限）
  // ※ パスワード認証後にリザルトへ遷移するよう変更
  useEffect(() => {
    const checkDiagnosis = async () => {
      // テストモード: ?test=1 でスキップ（パスワードもスキップ）
      const params = new URLSearchParams(window.location.search);
      if (params.get("test") === "1") {
        setCheckingLimit(false);
        setStep("welcome"); // パスワードをスキップ
        return;
      }
      
      const result = await checkCanDiagnose();
      
      if (!result.canDiagnose) {
        if (result.reason === "rate_limited") {
          alert("アクセスが集中しています。しばらく待ってから再度お試しください。");
          setCheckingLimit(false);
          return;
        }
        
        if (result.reason === "already_diagnosed" && result.existingData) {
          setIsAlreadyDiagnosed(true);
          // sessionStorageに復元
          sessionStorage.setItem("userName", result.existingData.userName);
          sessionStorage.setItem("dreamType", result.existingData.dreamType);
          // ※ パスワード画面に留まり、認証後にリダイレクト
          setCheckingLimit(false);
          return;
        }
      }
      setCheckingLimit(false);
    };
    checkDiagnosis();
  }, [router]);

  const handleStart = () => {
    // パスワード認証後は診断を開始できる
    // （診断済みの場合はパスワード認証時にリザルトに遷移済み）
    setStep("name");
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      setStep("birthdate");
    }
  };

  const handleBirthDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("questions");
  };

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handleNext = async () => {
    const currentQ = questions[currentQuestion];
    
    if (currentQ.type === "choice" && !selectedOption) return;
    if (currentQ.type === "text" && !textAnswer.trim()) return;

    const newAnswer: Answer = {
      questionId: currentQ.id,
    };
    
    if (currentQ.type === "choice") {
      newAnswer.answerId = selectedOption!;
    } else {
      newAnswer.textAnswer = textAnswer.trim();
    }

    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);
    setSelectedOption(null);
    setTextAnswer("");

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setStep("processing");
      
      try {
        const response = await fetch("/api/diagnose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: userName,
            birthDate,
            answers: newAnswers,
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          sessionStorage.setItem("userName", userName);
          sessionStorage.setItem("dreamType", data.result.dreamType);
          sessionStorage.setItem("diagnosisResult", JSON.stringify(data.result));
          sessionStorage.setItem("answers", JSON.stringify(newAnswers));
          
          // おひとり様1回制限: 診断完了を記録（DB + ローカル）
          const rec = await recordDiagnosis(data.result.dreamType, userName);
          if (rec?.recordId) {
            sessionStorage.setItem("diagnosisRecordId", rec.recordId);
            localStorage.setItem("dream_diagnosis_record_id", rec.recordId);
          }
          
          setTimeout(() => {
            router.push("/gacha");
          }, 1500);
        } else {
          alert("診断処理中にエラーが発生しました");
          setStep("questions");
          setCurrentQuestion(questions.length - 1);
        }
      } catch (error) {
        console.error("診断エラー:", error);
        alert("診断処理中にエラーが発生しました");
        setStep("questions");
        setCurrentQuestion(questions.length - 1);
      }
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      const prevAnswer = answers[answers.length - 1];
      setAnswers(answers.slice(0, -1));
      
      if (prevAnswer) {
        if (prevAnswer.answerId) {
          setSelectedOption(prevAnswer.answerId);
        } else {
          setTextAnswer(prevAnswer.textAnswer || "");
        }
      }
    } else if (step === "questions") {
      setStep("birthdate");
    } else if (step === "birthdate") {
      setStep("name");
    } else if (step === "name") {
      setStep("welcome");
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];
  const canProceed = currentQ?.type === "choice" 
    ? selectedOption !== null 
    : textAnswer.trim().length > 0;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // 制限チェック中はローディング表示
  if (checkingLimit) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-dream">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-5xl mb-4"
          >
            🔮
          </motion.div>
          <p className="text-purple-300">読み込み中...</p>
        </motion.div>
      </main>
    );
  }

  return (
    <ErrorBoundary>
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Three.js スピリチュアル背景 */}
      <Suspense fallback={<div className="fixed inset-0 bg-gradient-dream -z-50" />}>
        <SpiritualBackground intensity="medium" />
      </Suspense>

      {/* ミスティカルオーラ（ウェルカム画面のみ） */}
      {step === "welcome" && <MysticalAura />}

      <AnimatePresence mode="wait">
        {/* ========== パスワード認証画面 ========== */}
        {step === "password" && (
          <motion.div
            key="password"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-center w-full max-w-md px-4 relative z-20"
          >
            <div className="glass-card-gold p-8 relative overflow-hidden">
              {/* キラキラ背景 */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-purple-500/10 pointer-events-none" />
              
              {/* きんまん先生 */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="mb-6"
              >
                <Image
                  src="/images/kinman-standing-transparent.png"
                  alt="きんまん先生"
                  width={120}
                  height={120}
                  className="mx-auto"
                />
              </motion.div>
              
              <h1 className="text-2xl font-bold text-gradient mb-2">
                🔐 合言葉を入力
              </h1>
              <p className="text-purple-300 text-sm mb-6">
                ライブ参加者限定コンテンツです
              </p>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError(false);
                    }}
                    placeholder="合言葉を入力..."
                    className={`w-full p-4 rounded-xl bg-black/30 border-2 ${
                      passwordError 
                        ? 'border-red-500 text-red-300' 
                        : 'border-purple-500/30 text-white'
                    } placeholder-purple-400/50 text-center text-lg focus:outline-none focus:border-yellow-500/50 transition-colors`}
                    autoFocus
                  />
                  {passwordError && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-sm mt-2"
                    >
                      ❌ 合言葉が違います
                    </motion.p>
                  )}
                </div>
                
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-gold w-full py-4 text-lg"
                >
                  ✨ 診断を始める
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}

        {/* ========== ウェルカム画面 - DOPA風リッチデザイン ========== */}
        {step === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6 }}
            className="text-center w-full max-w-4xl px-4 relative z-20"
          >
            {/* サムネイル/ヒーロー画像 */}
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="relative mb-6"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                {/* ゴールドグロー */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-transparent to-yellow-500/20 animate-pulse" />
                
                <Image
                  src="/gacha-thumbnail-final.png"
                  alt="夢タイプ診断ガチャ"
                  width={800}
                  height={420}
                  className="w-full h-auto"
                  priority
                />
                
                {/* オーバーレイグロー */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              
            </motion.div>

            {/* サブテキスト - 視認性強化 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-6"
            >
              <p className="text-lg font-bold mb-2" style={{
                color: '#FFD700',
                textShadow: '0 0 10px rgba(255,215,0,0.8), 0 2px 4px rgba(0,0,0,0.8)',
                letterSpacing: '0.1em'
              }}>
                🌟 四柱推命 × 九星気学 × 数秘術 × AI 🌟
              </p>
              <p className="text-base font-medium" style={{
                color: '#FFF',
                textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.5)',
              }}>
                10個の質問と生年月日から、あなただけの
                <span className="font-black" style={{ color: '#FFD700', textShadow: '0 0 15px rgba(255,215,0,0.8)' }}>
                  運命のカード
                </span>
                を召喚！
              </p>
            </motion.div>

            {/* カードプレビュー（横スクロール） */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mb-8 overflow-hidden"
            >
              <motion.div 
                className="flex gap-3 justify-center"
                animate={{ x: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                {[
                  { name: '鳳凰', file: 'kinman-phoenix.png' },
                  { name: 'ペガサス', file: 'kinman-pegasus.png' },
                  { name: 'ドラゴン', file: 'kinman-dragon.png' },
                  { name: '狐', file: 'kinman-kitsune.png' },
                  { name: 'ウルフ', file: 'kinman-wolf.png' },
                ].map((card, i) => (
                  <motion.div
                    key={card.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    whileHover={{ scale: 1.1, y: -10 }}
                    className="relative"
                  >
                    <Image
                      src={`/cards/${card.file}`}
                      alt={card.name}
                      width={80}
                      height={110}
                      className="rounded-lg shadow-lg border-2 border-yellow-500/50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent rounded-lg" />
                  </motion.div>
                ))}
              </motion.div>
              <p className="text-sm mt-3 font-medium" style={{
                color: '#E8D5FF',
                textShadow: '0 2px 6px rgba(0,0,0,0.8)',
              }}>※ カードは一例です。全9タイプからあなたの運命のカードが決まります</p>
            </motion.div>

            {/* ガチャボタン - 高級感リッチデザイン */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, type: "spring", stiffness: 200 }}
              className="relative"
            >
              <motion.button
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStart}
                className="relative group"
              >
                {/* 外側グロー */}
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 rounded-full blur-md opacity-75 group-hover:opacity-100 transition-opacity" />
                
                {/* ボタン本体 - スマホ対応 */}
                <div className="relative px-6 py-3 sm:px-14 sm:py-5 bg-gradient-to-b from-yellow-300 via-yellow-500 to-orange-600 rounded-full shadow-[0_4px_0_#92400e,0_6px_20px_rgba(0,0,0,0.5),inset_0_2px_0_rgba(255,255,255,0.4)] sm:shadow-[0_6px_0_#92400e,0_8px_25px_rgba(0,0,0,0.5),inset_0_2px_0_rgba(255,255,255,0.4)] transition-all group-hover:shadow-[0_4px_0_#92400e,0_6px_20px_rgba(0,0,0,0.5)] group-active:shadow-[0_0px_0_#92400e] group-active:translate-y-[4px] sm:group-active:translate-y-[6px]">
                  <span className="relative z-10 flex items-center gap-2 sm:gap-3 text-base sm:text-2xl" style={{
                    fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", serif',
                    fontWeight: 900,
                    color: '#1a0a00',
                    textShadow: '0 1px 0 rgba(255,255,255,0.5)',
                    letterSpacing: '0.05em',
                  }}>
                    <motion.span
                      animate={{ rotate: isHovering ? 360 : 0 }}
                      transition={{ duration: 0.5 }}
                      className="text-xl sm:text-3xl"
                    >
                      🎲
                    </motion.span>
                    <span style={{ 
                      background: 'linear-gradient(180deg, #4a2800 0%, #1a0a00 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 1px 0 rgba(255,255,255,0.3))',
                    }}>
                      運命のカードを引く
                    </span>
                    <motion.span
                      animate={{ rotate: isHovering ? -360 : 0 }}
                      transition={{ duration: 0.5 }}
                      className="text-xl sm:text-3xl"
                    >
                      🎲
                    </motion.span>
                  </span>
                  
                  {/* 光沢エフェクト */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/50 via-transparent to-transparent h-1/2" />
                </div>
                
                {/* パルスエフェクト */}
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 -z-10 blur-sm"
                />
              </motion.button>
              
              {/* サブテキスト - 視認性強化 */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 }}
                className="text-sm mt-5 font-bold"
                style={{
                  color: '#FFF',
                  textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.6)',
                }}
              >
                📱 スマホ対応
              </motion.p>
            </motion.div>

            {/* フッターinfo - 視認性強化 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="mt-8 text-center"
            >
              <div 
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,215,0,0.3)',
                  color: '#FFD700',
                  textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                }}
              >
                <span>Powered by</span>
                <Image
                  src="/images/kinman-sitting-transparent.png"
                  alt=""
                  width={28}
                  height={28}
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
                />
                <span className="font-bold">きんまん先生</span>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ========== 名前入力画面 ========== */}
        {step === "name" && (
          <motion.div
            key="name"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-md w-full px-4"
          >
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-4"
            >
              <Image
                src="/images/kinman-standing-transparent.png"
                alt="きんまん先生"
                width={140}
                height={140}
                className="mx-auto kinman-character"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="speech-bubble mb-6 mx-4"
            >
              <p className="text-base font-medium text-[#2d1028]">
                診断をはじめる前に、
                <br />
                あなたのお名前を教えてください！
              </p>
            </motion.div>

            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              onSubmit={handleNameSubmit}
              className="glass-card p-8"
            >
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="お名前（ニックネーム可）"
                className="input-field mb-6"
                autoFocus
                maxLength={20}
              />
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn-secondary flex-1"
                >
                  戻る
                </button>
                <motion.button
                  whileHover={{ scale: userName.trim() ? 1.05 : 1 }}
                  whileTap={{ scale: userName.trim() ? 0.95 : 1 }}
                  type="submit"
                  disabled={!userName.trim()}
                  className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  次へ →
                </motion.button>
              </div>
            </motion.form>
          </motion.div>
        )}

        {/* ========== 生年月日入力画面 ========== */}
        {step === "birthdate" && (
          <motion.div
            key="birthdate"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-md w-full px-4"
          >
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-4"
            >
              <Image
                src="/images/kinman-sitting-transparent.png"
                alt="きんまん先生"
                width={140}
                height={140}
                className="mx-auto kinman-character"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="speech-bubble mb-6 mx-4"
            >
              <p className="text-base font-medium text-[#2d1028]">
                {userName}さんの生年月日を教えてください。
                <br />
                <span className="text-xs text-gray-500">※四柱推命でより深く診断します</span>
              </p>
            </motion.div>

            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              onSubmit={handleBirthDateSubmit}
              className="glass-card p-4 sm:p-8"
            >
              <div className="flex justify-center gap-2 sm:gap-3 mb-6">
                <div className="flex flex-col items-center">
                  <select
                    value={birthDate.year}
                    onChange={(e) => setBirthDate({ ...birthDate, year: parseInt(e.target.value) })}
                    className="input-field text-center text-sm sm:text-base w-20 sm:w-24 px-2 py-2"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <p className="text-xs text-[#a87890] mt-1">年</p>
                </div>
                <div className="flex flex-col items-center">
                  <select
                    value={birthDate.month}
                    onChange={(e) => setBirthDate({ ...birthDate, month: parseInt(e.target.value) })}
                    className="input-field text-center text-sm sm:text-base w-16 sm:w-20 px-2 py-2"
                  >
                    {months.map((month) => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                  <p className="text-xs text-[#a87890] mt-1">月</p>
                </div>
                <div className="flex flex-col items-center">
                  <select
                    value={birthDate.day}
                    onChange={(e) => setBirthDate({ ...birthDate, day: parseInt(e.target.value) })}
                    className="input-field text-center text-sm sm:text-base w-16 sm:w-20 px-2 py-2"
                  >
                    {days.map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                  <p className="text-xs text-[#a87890] mt-1">日</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn-secondary flex-1"
                >
                  戻る
                </button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="btn-primary flex-1 whitespace-nowrap"
                >
                  診断開始→
                </motion.button>
              </div>
            </motion.form>
          </motion.div>
        )}

        {/* ========== 質問画面 ========== */}
        {step === "questions" && currentQ && (
          <motion.div
            key={`question-${currentQuestion}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-xl px-4"
          >
            {/* プログレスバー */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#e8b4c8] font-medium">
                  Q{currentQuestion + 1} / {questions.length}
                </span>
                <span className="text-[#d4a574] font-bold">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="progress-bar">
                <motion.div
                  className="progress-fill"
                  initial={{ width: `${((currentQuestion) / questions.length) * 100}%` }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            {/* 質問カード */}
            <div className="glass-card p-6 mb-6">
              <div className="flex items-start gap-4 mb-4">
                <Image
                  src="/images/kinman-standing-transparent.png"
                  alt=""
                  width={50}
                  height={50}
                  className="flex-shrink-0"
                />
                <h2 className="text-xl font-bold text-white leading-relaxed pt-2">
                  {currentQ.text}
                </h2>
              </div>

              {currentQ.type === "choice" && currentQ.options ? (
                <div className="space-y-3">
                  {currentQ.options.map((option, index) => (
                    <motion.button
                      key={option.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleOptionSelect(option.id)}
                      className={`question-option w-full text-left ${
                        selectedOption === option.id ? "selected" : ""
                      }`}
                    >
                      <span className="text-[#c94b7c] mr-3 font-bold">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      {option.text}
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div>
                  <textarea
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    placeholder={currentQ.placeholder || "あなたの回答を入力してください"}
                    className="w-full min-h-[120px] p-4 rounded-lg bg-white/10 border border-purple-500/30 text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 focus:bg-white/15 resize-none"
                    autoFocus
                  />
                  <p className="text-xs text-purple-300/70 mt-2">
                    {textAnswer.length}文字
                  </p>
                </div>
              )}
            </div>

            {/* ナビゲーション */}
            <div className="flex justify-between items-center">
              <button
                onClick={handleBack}
                className="btn-secondary disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← 戻る
              </button>
              <motion.button
                whileHover={{ scale: canProceed ? 1.05 : 1 }}
                whileTap={{ scale: canProceed ? 0.95 : 1 }}
                onClick={handleNext}
                disabled={!canProceed}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {currentQuestion === questions.length - 1 ? "🔮 診断する" : "次へ →"}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ========== 処理中画面 ========== */}
        {step === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 3, -3, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="mb-6"
            >
              <Image
                src="/images/kinman-sitting-transparent.png"
                alt="診断中"
                width={160}
                height={160}
                className="mx-auto kinman-character"
              />
            </motion.div>

            <div className="glass-card p-8 max-w-sm mx-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-5xl mb-4"
              >
                🔮
              </motion.div>
              <h2 className="text-2xl font-bold mb-2 text-gradient">
                診断中...
              </h2>
              <p className="text-[#e8b4c8]">
                {userName}さんの
                <br />
                夢タイプをAIが分析しています
              </p>
              <p className="text-xs text-[#a87890] mt-2">
                四柱推命データを計算中...
              </p>
              
              <div className="flex justify-center gap-2 mt-4">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -10, 0] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                    className="w-3 h-3 bg-[#c94b7c] rounded-full"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* フッター */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-4 text-center text-sm font-medium"
        style={{
          color: '#D4AF37',
          textShadow: '0 2px 6px rgba(0,0,0,0.9)',
        }}
      >
        Date with Dream Note © 2025
      </motion.div>
    </main>
    </ErrorBoundary>
  );
}
