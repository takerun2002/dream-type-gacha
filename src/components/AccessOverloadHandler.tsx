"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AccessOverloadHandlerProps {
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export default function AccessOverloadHandler({
  isLoading,
  error,
  onRetry,
}: AccessOverloadHandlerProps) {
  const [showOverload, setShowOverload] = useState(false);
  const [loadingDuration, setLoadingDuration] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let durationTimer: NodeJS.Timeout;

    if (isLoading) {
      // ローディングが5秒以上続いたらアクセス集中メッセージを表示
      timer = setTimeout(() => {
        setShowOverload(true);
      }, 5000);

      // ローディング時間をカウント
      durationTimer = setInterval(() => {
        setLoadingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setShowOverload(false);
      setLoadingDuration(0);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(durationTimer);
    };
  }, [isLoading]);

  // エラータイプを判定
  const getErrorInfo = (errorMessage: string | null | undefined) => {
    if (!errorMessage) return null;

    if (
      errorMessage.includes("429") ||
      errorMessage.includes("rate limit") ||
      errorMessage.includes("too many")
    ) {
      return {
        title: "アクセスが集中しています",
        message:
          "ただいま多くの方がアクセスしています。しばらくお待ちいただいてから再度お試しください。",
        icon: "⏳",
        canRetry: true,
        retryDelay: 30,
      };
    }

    if (
      errorMessage.includes("500") ||
      errorMessage.includes("503") ||
      errorMessage.includes("server")
    ) {
      return {
        title: "サーバーが混雑しています",
        message:
          "一時的にサーバーが混雑しています。数分後に再度お試しください。",
        icon: "🔧",
        canRetry: true,
        retryDelay: 60,
      };
    }

    if (
      errorMessage.includes("timeout") ||
      errorMessage.includes("ETIMEDOUT")
    ) {
      return {
        title: "接続がタイムアウトしました",
        message:
          "サーバーとの接続に時間がかかっています。ネットワーク状況をご確認ください。",
        icon: "📡",
        canRetry: true,
        retryDelay: 10,
      };
    }

    if (
      errorMessage.includes("network") ||
      errorMessage.includes("offline") ||
      errorMessage.includes("fetch")
    ) {
      return {
        title: "ネットワークエラー",
        message:
          "インターネット接続をご確認ください。",
        icon: "📶",
        canRetry: true,
        retryDelay: 5,
      };
    }

    // デフォルトエラー
    return {
      title: "エラーが発生しました",
      message: "予期しないエラーが発生しました。再度お試しください。",
      icon: "😢",
      canRetry: true,
      retryDelay: 5,
    };
  };

  const errorInfo = getErrorInfo(error);

  return (
    <AnimatePresence>
      {/* アクセス集中警告 */}
      {showOverload && !error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="glass-card px-6 py-3 flex items-center gap-3">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="text-2xl"
            >
              ⏳
            </motion.span>
            <div className="text-sm">
              <p className="text-yellow-300 font-medium">
                処理に時間がかかっています...
              </p>
              <p className="text-purple-300 text-xs">
                {loadingDuration}秒経過 - アクセスが集中している可能性があります
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* エラー表示 */}
      {error && errorInfo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <div className="glass-card p-8 max-w-md text-center">
            <div className="text-6xl mb-4">{errorInfo.icon}</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {errorInfo.title}
            </h2>
            <p className="text-purple-200 mb-6">{errorInfo.message}</p>

            {errorInfo.canRetry && onRetry && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRetry}
                className="btn-primary"
              >
                🔄 再試行する
              </motion.button>
            )}

            <p className="text-xs text-purple-400 mt-4">
              問題が続く場合は、少し時間をおいてからお試しください
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}















