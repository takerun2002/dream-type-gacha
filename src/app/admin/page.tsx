"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

// 管理者パスワード（環境変数で設定可能）
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "kinmanadmin2025";

// タイプ名のマッピング
const TYPE_NAMES: Record<string, string> = {
  phoenix: "🔥 不死鳥",
  dragon: "🐉 龍",
  wolf: "🐺 狼",
  deer: "🦌 鹿",
  fox: "🦊 妖狐",
  turtle: "🐢 亀",
  pegasus: "🦄 ペガサス",
  elephant: "🐘 象",
  shark: "🦈 シャーク",
};

// タイプの色
const TYPE_COLORS: Record<string, string> = {
  phoenix: "#ff6b6b",
  dragon: "#ffd93d",
  wolf: "#6bcb77",
  deer: "#4d96ff",
  fox: "#ff922b",
  turtle: "#38d9a9",
  pegasus: "#cc5de8",
  elephant: "#868e96",
  shark: "#339af0",
};

interface Stats {
  totalDiagnoses: number;
  todayDiagnoses: number;
  typeDistribution: Record<string, number>;
  hourlyDistribution: number[];
  recentDiagnoses: Array<{
    user_name: string;
    dream_type: string;
    created_at: string;
  }>;
  queueStatus: {
    waiting: number;
    processing: number;
  };
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "data" | "logs">("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [clearStatus, setClearStatus] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  // 統計データを取得
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: ADMIN_PASSWORD }),
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Stats fetch error:", error);
    }
    setLoading(false);
  }, []);

  // 認証後に統計を取得
  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated, fetchStats]);

  // 自動更新
  useEffect(() => {
    if (autoRefresh && isAuthenticated) {
      const interval = setInterval(fetchStats, 10000); // 10秒ごと
      return () => clearInterval(interval);
    }
  }, [autoRefresh, isAuthenticated, fetchStats]);

  // データクリア関数
  const clearAllLocalData = () => {
    try {
      localStorage.removeItem("dream_diagnosis_completed");
      localStorage.removeItem("dream_diagnosis_fp");
      localStorage.removeItem("dream_card_image");
      sessionStorage.clear();
      setClearStatus("✅ ローカルデータをクリアしました！");
    } catch (error) {
      setClearStatus("❌ クリアに失敗: " + (error as Error).message);
    }
  };

  const clearSupabaseRecords = async () => {
    try {
      setClearStatus("🔄 Supabaseの記録をクリア中...");
      const response = await fetch("/api/admin/clear-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: ADMIN_PASSWORD, clearAll: true }),
      });
      const data = await response.json();
      setClearStatus(data.success ? "✅ " + data.message : "❌ " + data.error);
      if (data.success) fetchStats();
    } catch (error) {
      setClearStatus("❌ API呼び出しに失敗: " + (error as Error).message);
    }
  };

  const fullReset = async () => {
    clearAllLocalData();
    await clearSupabaseRecords();
    setClearStatus("✅ 完全リセット完了！");
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-purple-300">
              ⚙️ 管理者ダッシュボード
            </h1>
            <p className="text-purple-400/60 text-sm">夢タイプ診断ガチャ</p>
          </div>
          <div className="flex gap-2 items-center">
            <label className="flex items-center gap-2 text-purple-300 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              自動更新
            </label>
            <button
              onClick={fetchStats}
              disabled={loading}
              className="px-4 py-2 bg-purple-600/50 hover:bg-purple-600 rounded-lg text-white text-sm transition-colors"
            >
              {loading ? "⏳" : "🔄"} 更新
            </button>
          </div>
        </div>

        {/* タブ */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "dashboard", label: "📊 ダッシュボード" },
            { id: "data", label: "🗑️ データ管理" },
            { id: "logs", label: "📋 最近の診断" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white"
                  : "bg-purple-900/30 text-purple-300 hover:bg-purple-900/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ダッシュボードタブ */}
        {activeTab === "dashboard" && stats && (
          <div className="space-y-6">
            {/* 概要カード */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="総診断数"
                value={stats.totalDiagnoses}
                icon="📊"
                color="purple"
              />
              <StatCard
                title="今日の診断"
                value={stats.todayDiagnoses}
                icon="📅"
                color="blue"
              />
              <StatCard
                title="待機中"
                value={stats.queueStatus.waiting}
                icon="⏳"
                color="yellow"
              />
              <StatCard
                title="処理中"
                value={stats.queueStatus.processing}
                icon="⚡"
                color="green"
              />
            </div>

            {/* タイプ分布グラフ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30"
            >
              <h3 className="text-lg font-bold text-purple-300 mb-4">
                🎯 タイプ分布
              </h3>
              <div className="space-y-3">
                {Object.entries(stats.typeDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => {
                    const percentage = stats.totalDiagnoses > 0
                      ? (count / stats.totalDiagnoses) * 100
                      : 0;
                    return (
                      <div key={type} className="flex items-center gap-3">
                        <div className="w-24 text-sm text-purple-200">
                          {TYPE_NAMES[type] || type}
                        </div>
                        <div className="flex-1 bg-purple-900/30 rounded-full h-6 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: TYPE_COLORS[type] || "#9370db" }}
                          />
                        </div>
                        <div className="w-16 text-right text-sm text-purple-300">
                          {count}人 ({percentage.toFixed(1)}%)
                        </div>
                      </div>
                    );
                  })}
                {Object.keys(stats.typeDistribution).length === 0 && (
                  <p className="text-purple-400/60 text-center py-4">
                    まだデータがありません
                  </p>
                )}
              </div>
            </motion.div>

            {/* 時間帯別グラフ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30"
            >
              <h3 className="text-lg font-bold text-purple-300 mb-4">
                ⏰ 時間帯別アクセス（過去7日）
              </h3>
              <div className="flex items-end gap-1 h-32">
                {stats.hourlyDistribution.map((count, hour) => {
                  const maxCount = Math.max(...stats.hourlyDistribution, 1);
                  const height = (count / maxCount) * 100;
                  return (
                    <div
                      key={hour}
                      className="flex-1 flex flex-col items-center"
                    >
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 0.5, delay: hour * 0.02 }}
                        className="w-full bg-gradient-to-t from-purple-600 to-pink-500 rounded-t"
                        title={`${hour}時: ${count}件`}
                      />
                      {hour % 3 === 0 && (
                        <span className="text-[10px] text-purple-400 mt-1">
                          {hour}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}

        {/* データ管理タブ */}
        {activeTab === "data" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30"
          >
            <h3 className="text-lg font-bold text-purple-300 mb-4">
              🗑️ データ管理
            </h3>
            <div className="space-y-4">
              <button
                onClick={clearAllLocalData}
                className="w-full py-4 bg-yellow-600/30 hover:bg-yellow-600/50 border border-yellow-500/50 rounded-xl text-yellow-300 font-bold transition-colors"
              >
                🔄 ローカルデータをクリア
              </button>
              <button
                onClick={clearSupabaseRecords}
                className="w-full py-4 bg-orange-600/30 hover:bg-orange-600/50 border border-orange-500/50 rounded-xl text-orange-300 font-bold transition-colors"
              >
                🌐 Supabase全記録をクリア
              </button>
              <button
                onClick={fullReset}
                className="w-full py-4 bg-gradient-to-r from-red-600/50 to-pink-600/50 hover:from-red-600/70 hover:to-pink-600/70 border border-red-500/50 rounded-xl text-white font-bold transition-colors"
              >
                ⚡ 完全リセット（ローカル + サーバー）
              </button>
            </div>

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
          </motion.div>
        )}

        {/* 最近の診断タブ */}
        {activeTab === "logs" && stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30"
          >
            <h3 className="text-lg font-bold text-purple-300 mb-4">
              📋 最近の診断（最新10件）
            </h3>
            <div className="space-y-2">
              {stats.recentDiagnoses.map((diagnosis, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-3 bg-purple-900/20 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {TYPE_NAMES[diagnosis.dream_type]?.split(" ")[0] || "❓"}
                    </span>
                    <div>
                      <p className="text-purple-200 font-medium">
                        {diagnosis.user_name}
                      </p>
                      <p className="text-purple-400/60 text-xs">
                        {TYPE_NAMES[diagnosis.dream_type] || diagnosis.dream_type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-purple-300 text-sm">
                      {new Date(diagnosis.created_at).toLocaleDateString("ja-JP")}
                    </p>
                    <p className="text-purple-400/60 text-xs">
                      {new Date(diagnosis.created_at).toLocaleTimeString("ja-JP")}
                    </p>
                  </div>
                </motion.div>
              ))}
              {stats.recentDiagnoses.length === 0 && (
                <p className="text-purple-400/60 text-center py-8">
                  まだ診断記録がありません
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* フッター */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            ← トップページに戻る
          </a>
        </div>
      </div>
    </div>
  );
}

// 統計カードコンポーネント
function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: string;
  color: "purple" | "blue" | "yellow" | "green";
}) {
  const colorClasses = {
    purple: "from-purple-600/30 to-purple-900/30 border-purple-500/30",
    blue: "from-blue-600/30 to-blue-900/30 border-blue-500/30",
    yellow: "from-yellow-600/30 to-yellow-900/30 border-yellow-500/30",
    green: "from-green-600/30 to-green-900/30 border-green-500/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-xl rounded-xl p-4 border`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-purple-300 text-sm">{title}</span>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </motion.div>
  );
}
