"use client";

import { useState } from "react";
import { motion } from "framer-motion";

// 管理者パスワード（環境変数で設定可能）
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "kinmanadmin2025";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [clearStatus, setClearStatus] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  // 全てのローカルデータをクリア
  const clearAllLocalData = () => {
    try {
      // ローカルストレージをクリア
      localStorage.removeItem("dream_diagnosis_completed");
      localStorage.removeItem("dream_diagnosis_fp");
      localStorage.removeItem("dream_card_image");
      
      // セッションストレージをクリア
      sessionStorage.clear();
      
      setClearStatus("✅ ローカルデータをクリアしました！ページをリロードしてください。");
    } catch (error) {
      setClearStatus("❌ クリアに失敗しました: " + (error as Error).message);
    }
  };

  // 診断履歴のみクリア（カード画像は残す）
  const clearDiagnosisOnly = () => {
    try {
      localStorage.removeItem("dream_diagnosis_completed");
      localStorage.removeItem("dream_diagnosis_fp");
      sessionStorage.removeItem("userName");
      sessionStorage.removeItem("dreamType");
      sessionStorage.removeItem("diagnosisResult");
      
      setClearStatus("✅ 診断履歴をクリアしました！再診断が可能です。");
    } catch (error) {
      setClearStatus("❌ クリアに失敗しました: " + (error as Error).message);
    }
  };

  // カード画像のみクリア
  const clearCardImageOnly = () => {
    try {
      localStorage.removeItem("dream_card_image");
      setClearStatus("✅ 保存済みカード画像をクリアしました！");
    } catch (error) {
      setClearStatus("❌ クリアに失敗しました: " + (error as Error).message);
    }
  };

  // サーバーサイド（Supabase）の全記録をクリア
  const clearSupabaseRecords = async () => {
    try {
      setClearStatus("🔄 Supabaseの記録をクリア中...");
      const response = await fetch("/api/admin/clear-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: ADMIN_PASSWORD, clearAll: true }),
      });
      const data = await response.json();
      
      if (data.success) {
        setClearStatus("✅ " + data.message);
      } else {
        setClearStatus("❌ " + (data.error || "クリアに失敗しました"));
      }
    } catch (error) {
      setClearStatus("❌ API呼び出しに失敗: " + (error as Error).message);
    }
  };

  // 完全リセット（ローカル + サーバー）
  const fullReset = async () => {
    try {
      setClearStatus("🔄 完全リセット中...");
      
      // ローカルデータクリア
      localStorage.removeItem("dream_diagnosis_completed");
      localStorage.removeItem("dream_diagnosis_fp");
      localStorage.removeItem("dream_card_image");
      sessionStorage.clear();
      
      // サーバーサイドクリア
      const response = await fetch("/api/admin/clear-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: ADMIN_PASSWORD, clearAll: true }),
      });
      const data = await response.json();
      
      if (data.success) {
        setClearStatus("✅ 完全リセット完了！\nローカルデータ + Supabase記録をクリアしました。\nページをリロードしてください。");
      } else {
        setClearStatus("⚠️ ローカルデータはクリア済み。\nSupabase: " + (data.error || data.message));
      }
    } catch (error) {
      setClearStatus("⚠️ ローカルデータはクリア済み。\nAPI: " + (error as Error).message);
    }
  };

  // 現在のデータ状態を確認
  const checkCurrentData = () => {
    const data = {
      診断完了データ: localStorage.getItem("dream_diagnosis_completed") ? "あり" : "なし",
      フィンガープリント: localStorage.getItem("dream_diagnosis_fp") ? "あり" : "なし",
      カード画像: localStorage.getItem("dream_card_image") ? "保存済み" : "なし",
      セッション_ユーザー名: sessionStorage.getItem("userName") || "なし",
      セッション_夢タイプ: sessionStorage.getItem("dreamType") || "なし",
    };
    setClearStatus("📊 現在のデータ:\n" + JSON.stringify(data, null, 2));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/50 backdrop-blur-xl p-8 rounded-2xl border border-purple-500/30 max-w-md w-full mx-4"
        >
          <h1 className="text-2xl font-bold text-center mb-6 text-purple-300">
            🔐 管理者ログイン
          </h1>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(false);
              }}
              placeholder="管理者パスワード"
              className={`w-full p-4 rounded-xl bg-black/30 border-2 ${
                passwordError ? "border-red-500" : "border-purple-500/30"
              } text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-500`}
              autoFocus
            />
            {passwordError && (
              <p className="text-red-400 text-sm">パスワードが違います</p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-bold transition-colors"
            >
              ログイン
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/50 backdrop-blur-xl p-8 rounded-2xl border border-purple-500/30"
        >
          <h1 className="text-2xl font-bold text-center mb-2 text-purple-300">
            ⚙️ 管理者モード
          </h1>
          <p className="text-center text-purple-400/60 text-sm mb-8">
            夢タイプ診断ガチャ - データ管理
          </p>

          <div className="space-y-4">
            {/* データ確認 */}
            <button
              onClick={checkCurrentData}
              className="w-full py-4 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 rounded-xl text-blue-300 font-bold transition-colors"
            >
              📊 現在のデータ状態を確認
            </button>

            {/* 診断履歴クリア */}
            <button
              onClick={clearDiagnosisOnly}
              className="w-full py-4 bg-yellow-600/30 hover:bg-yellow-600/50 border border-yellow-500/50 rounded-xl text-yellow-300 font-bold transition-colors"
            >
              🔄 診断履歴のみクリア（再診断可能に）
            </button>

            {/* カード画像クリア */}
            <button
              onClick={clearCardImageOnly}
              className="w-full py-4 bg-orange-600/30 hover:bg-orange-600/50 border border-orange-500/50 rounded-xl text-orange-300 font-bold transition-colors"
            >
              🖼️ 保存済みカード画像をクリア
            </button>

            {/* ローカルデータクリア */}
            <button
              onClick={clearAllLocalData}
              className="w-full py-4 bg-red-600/30 hover:bg-red-600/50 border border-red-500/50 rounded-xl text-red-300 font-bold transition-colors"
            >
              🗑️ ローカルデータをクリア
            </button>

            {/* サーバーサイドクリア */}
            <button
              onClick={clearSupabaseRecords}
              className="w-full py-4 bg-pink-600/30 hover:bg-pink-600/50 border border-pink-500/50 rounded-xl text-pink-300 font-bold transition-colors"
            >
              🌐 Supabase全記録をクリア
            </button>

            {/* 完全リセット */}
            <button
              onClick={fullReset}
              className="w-full py-4 bg-gradient-to-r from-red-600/50 to-pink-600/50 hover:from-red-600/70 hover:to-pink-600/70 border border-red-500/50 rounded-xl text-white font-bold transition-colors"
            >
              ⚡ 完全リセット（ローカル + サーバー）
            </button>
          </div>

          {/* ステータス表示 */}
          {clearStatus && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-black/30 rounded-xl border border-purple-500/30"
            >
              <pre className="text-purple-200 text-sm whitespace-pre-wrap">
                {clearStatus}
              </pre>
            </motion.div>
          )}

          {/* トップに戻るリンク */}
          <div className="mt-8 text-center">
            <a
              href="/"
              className="text-purple-400 hover:text-purple-300 underline"
            >
              ← トップページに戻る
            </a>
          </div>
        </motion.div>

        {/* 注意書き */}
        <p className="text-center text-purple-500/40 text-xs mt-4">
          ※ このページはフロントエンドには公開されていません
        </p>
      </div>
    </div>
  );
}

