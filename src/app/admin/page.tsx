"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

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
  hourlyUniqueDistribution: number[];
  dailyDistribution: Array<{ date: string; pv: number; upv: number }>;
  recentDiagnoses: Array<{
    user_name: string;
    dream_type: string;
    created_at: string;
  }>;
  queueStatus: {
    waiting: number;
    processing: number;
  };
  generationStats: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    recentHour: number;
  };
}

interface DiagnosisRecord {
  id: string;
  user_name: string;
  dream_type: string;
  created_at: string;
  fingerprint: string;
  ip_address?: string;
  card_image_url?: string | null;
}

interface ErrorLog {
  id: string;
  user_name: string;
  dream_type: string;
  success: boolean;
  error_message?: string;
  created_at: string;
}

interface PaginatedRecords {
  records: DiagnosisRecord[];
  total: number;
  page: number;
  totalPages: number;
}

interface PaginatedLogs {
  logs: ErrorLog[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "records" | "errors" | "data">("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [clearStatus, setClearStatus] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  // 全診断記録
  const [allRecords, setAllRecords] = useState<PaginatedRecords | null>(null);
  const [recordsPage, setRecordsPage] = useState(1);
  const [recordsSearchQuery, setRecordsSearchQuery] = useState("");
  const [recordsLoading, setRecordsLoading] = useState(false);
  // エラーログ
  const [errorLogs, setErrorLogs] = useState<PaginatedLogs | null>(null);
  const [errorsPage, setErrorsPage] = useState(1);
  const [errorsLoading, setErrorsLoading] = useState(false);
  // 削除ステータス
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);
  // 詳細モーダル
  const [selectedRecord, setSelectedRecord] = useState<DiagnosisRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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
      const interval = setInterval(fetchStats, 10000);
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

  // 全診断記録を取得
  const fetchAllRecords = useCallback(async (page = 1, search = "") => {
    setRecordsLoading(true);
    try {
      const response = await fetch("/api/admin/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          password: ADMIN_PASSWORD, 
          action: "getAllRecords",
          page,
          limit: 20,
          searchQuery: search
        }),
      });
      const data = await response.json();
      if (data.success) {
        setAllRecords({
          records: data.records,
          total: data.total,
          page: data.page,
          totalPages: data.totalPages,
        });
        setRecordsPage(page);
      }
    } catch (error) {
      console.error("Records fetch error:", error);
    }
    setRecordsLoading(false);
  }, []);

  // エラーログを取得
  const fetchErrorLogs = useCallback(async (page = 1) => {
    setErrorsLoading(true);
    try {
      const response = await fetch("/api/admin/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          password: ADMIN_PASSWORD, 
          action: "getErrorLogs",
          page,
          limit: 20
        }),
      });
      const data = await response.json();
      if (data.success) {
        setErrorLogs({
          logs: data.logs,
          total: data.total,
          page: data.page,
          totalPages: data.totalPages,
        });
        setErrorsPage(page);
      }
    } catch (error) {
      console.error("Error logs fetch error:", error);
    }
    setErrorsLoading(false);
  }, []);

  // ユーザー削除
  const deleteUser = async (userName: string) => {
    if (!confirm(`「${userName}」さんの記録を削除しますか？\n\n削除すると、このユーザーは再診断が可能になります。`)) {
      return;
    }
    setDeleteStatus("🔄 削除中...");
    try {
      const response = await fetch("/api/admin/clear-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: ADMIN_PASSWORD, userName }),
      });
      const data = await response.json();
      if (data.success) {
        setDeleteStatus("✅ " + data.message);
        fetchAllRecords(recordsPage, recordsSearchQuery);
        fetchStats();
        setTimeout(() => setDeleteStatus(null), 3000);
      } else {
        setDeleteStatus("❌ " + data.error);
      }
    } catch (error) {
      setDeleteStatus("❌ 削除に失敗: " + (error as Error).message);
    }
  };

  // タブ切り替え時にデータを取得
  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === "records" && !allRecords) {
        fetchAllRecords(1, "");
      } else if (activeTab === "errors" && !errorLogs) {
        fetchErrorLogs(1);
      }
    }
  }, [activeTab, isAuthenticated, allRecords, errorLogs, fetchAllRecords, fetchErrorLogs]);

  // 検索クリア
  const handleSearchClear = () => {
    setRecordsSearchQuery("");
    fetchAllRecords(1, "");
  };

  // 詳細モーダルを開く
  const openDetailModal = (record: DiagnosisRecord) => {
    setSelectedRecord(record);
    setShowDetailModal(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-purple-500/20 shadow-2xl shadow-purple-500/10 max-w-md w-full mx-4"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔐</span>
            </div>
            <h1 className="text-2xl font-bold text-white">管理者ログイン</h1>
            <p className="text-slate-400 text-sm mt-2">夢タイプ診断ガチャ</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(false);
              }}
              placeholder="管理者パスワード"
              className={`w-full p-4 rounded-xl bg-slate-800/50 border-2 ${
                passwordError ? "border-red-500" : "border-slate-700"
              } text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors`}
              autoFocus
            />
            {passwordError && (
              <p className="text-red-400 text-sm">パスワードが違います</p>
            )}
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-white font-bold transition-all shadow-lg shadow-purple-500/25"
            >
              ログイン
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900">
      {/* ヘッダー */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-xl">⚙️</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">管理者ダッシュボード</h1>
                <p className="text-slate-400 text-xs">夢タイプ診断ガチャ</p>
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <label className="flex items-center gap-2 text-slate-300 text-sm bg-slate-800/50 px-3 py-2 rounded-lg">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded accent-purple-500"
                />
                自動更新
              </label>
              <button
                onClick={fetchStats}
                disabled={loading}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white text-sm transition-colors flex items-center gap-2"
              >
                <span className={loading ? "animate-spin" : ""}>🔄</span>
                更新
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* タブ */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: "dashboard", label: "📊 ダッシュボード", icon: "📊" },
            { id: "records", label: "👤 診断記録", icon: "👤" },
            { id: "errors", label: "⚠️ エラーログ", icon: "⚠️" },
            { id: "data", label: "🗑️ データ管理", icon: "🗑️" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-5 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25"
                  : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="総診断数"
                value={stats.totalDiagnoses}
                icon="📊"
                gradient="from-purple-500 to-indigo-600"
              />
              <StatCard
                title="今日の診断"
                value={stats.todayDiagnoses}
                icon="📅"
                gradient="from-blue-500 to-cyan-600"
              />
              <StatCard
                title="待機中"
                value={stats.queueStatus.waiting}
                icon="⏳"
                gradient="from-amber-500 to-orange-600"
              />
              <StatCard
                title="処理中"
                value={stats.queueStatus.processing}
                icon="⚡"
                gradient="from-emerald-500 to-teal-600"
              />
            </div>

            {/* カード生成統計 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50"
            >
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-sm">🎴</span>
                カード生成統計
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-slate-900/50 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">総生成数</p>
                  <p className="text-3xl font-bold text-white">{stats.generationStats.total}</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-4">
                  <p className="text-emerald-400 text-sm mb-1">成功</p>
                  <p className="text-3xl font-bold text-emerald-400">{stats.generationStats.successful}</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-4">
                  <p className="text-red-400 text-sm mb-1">失敗</p>
                  <p className="text-3xl font-bold text-red-400">{stats.generationStats.failed}</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">成功率</p>
                  <p className={`text-3xl font-bold ${
                    stats.generationStats.successRate >= 90 ? "text-emerald-400" :
                    stats.generationStats.successRate >= 70 ? "text-amber-400" : "text-red-400"
                  }`}>
                    {stats.generationStats.successRate}%
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <p className="text-slate-400 text-sm">
                  過去1時間: <span className="font-bold text-white">{stats.generationStats.recentHour}</span> 件
                </p>
              </div>
            </motion.div>

            {/* 日別アクセス推移 */}
            {stats.dailyDistribution && stats.dailyDistribution.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50"
              >
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-sm">📈</span>
                  日別アクセス推移（過去7日）
                </h3>
                <div className="flex items-center gap-4 mb-4">
                  <span className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                    <span className="text-slate-300">PV（総アクセス）</span>
                  </span>
                  <span className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                    <span className="text-slate-300">UPV（ユニーク）</span>
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {stats.dailyDistribution.map((day, i) => {
                    const maxPV = Math.max(...stats.dailyDistribution.map(d => d.pv), 1);
                    const pvHeight = (day.pv / maxPV) * 100;
                    const upvHeight = (day.upv / maxPV) * 100;
                    const date = new Date(day.date);
                    const dayName = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
                    return (
                      <div key={i} className="flex flex-col items-center">
                        <div className="relative h-32 w-full flex items-end justify-center gap-1 mb-2">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${pvHeight}%` }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                            className="w-5 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t"
                            title={`PV: ${day.pv}`}
                          />
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${upvHeight}%` }}
                            transition={{ duration: 0.5, delay: i * 0.05 + 0.1 }}
                            className="w-5 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t"
                            title={`UPV: ${day.upv}`}
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-slate-400 text-xs">{date.getMonth() + 1}/{date.getDate()}</p>
                          <p className="text-slate-500 text-[10px]">({dayName})</p>
                        </div>
                        <div className="text-center mt-1">
                          <p className="text-purple-400 text-xs font-bold">{day.pv}</p>
                          <p className="text-emerald-400 text-[10px]">{day.upv}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* タイプ分布グラフ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50"
            >
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center text-sm">🎯</span>
                タイプ分布
              </h3>
              <div className="space-y-4">
                {Object.entries(stats.typeDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => {
                    const percentage = stats.totalDiagnoses > 0
                      ? (count / stats.totalDiagnoses) * 100
                      : 0;
                    return (
                      <div key={type} className="flex items-center gap-4">
                        <div className="w-28 text-sm text-white font-medium">
                          {TYPE_NAMES[type] || type}
                        </div>
                        <div className="flex-1 bg-slate-900/50 rounded-full h-8 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full rounded-full flex items-center justify-end pr-3"
                            style={{ 
                              background: `linear-gradient(90deg, ${TYPE_COLORS[type] || "#9370db"}88, ${TYPE_COLORS[type] || "#9370db"})` 
                            }}
                          >
                            {percentage > 15 && (
                              <span className="text-white text-xs font-bold">{count}</span>
                            )}
                          </motion.div>
                        </div>
                        <div className="w-20 text-right">
                          <span className="text-white font-bold">{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                {Object.keys(stats.typeDistribution).length === 0 && (
                  <p className="text-slate-500 text-center py-8">まだデータがありません</p>
                )}
              </div>
            </motion.div>

            {/* 時間帯別アクセス */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50"
            >
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center text-sm">⏰</span>
                時間帯別アクセス（過去7日）
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <span className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                  <span className="text-slate-300">PV</span>
                </span>
                <span className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                  <span className="text-slate-300">UPV</span>
                </span>
              </div>
              <div className="flex items-end gap-[2px] h-40">
                {stats.hourlyDistribution.map((count, hour) => {
                  const maxCount = Math.max(...stats.hourlyDistribution, 1);
                  const pvHeight = (count / maxCount) * 100;
                  const upvHeight = stats.hourlyUniqueDistribution 
                    ? (stats.hourlyUniqueDistribution[hour] / maxCount) * 100 
                    : 0;
                  return (
                    <div key={hour} className="flex-1 flex flex-col items-center group relative">
                      <div className="flex items-end gap-[1px] h-32 w-full justify-center">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${pvHeight}%` }}
                          transition={{ duration: 0.5, delay: hour * 0.02 }}
                          className="w-1/2 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t"
                        />
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${upvHeight}%` }}
                          transition={{ duration: 0.5, delay: hour * 0.02 + 0.1 }}
                          className="w-1/2 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t"
                        />
                      </div>
                      {hour % 3 === 0 && (
                        <span className="text-[10px] text-slate-500 mt-1">{hour}</span>
                      )}
                      {/* ツールチップ */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                        {hour}時: PV {count}, UPV {stats.hourlyUniqueDistribution?.[hour] || 0}
                      </div>
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
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50"
          >
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center text-sm">🗑️</span>
              データ管理
            </h3>
            <div className="space-y-4 max-w-md">
              <button
                onClick={clearAllLocalData}
                className="w-full py-4 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/50 rounded-xl text-amber-300 font-bold transition-colors"
              >
                🔄 ローカルデータをクリア
              </button>
              <button
                onClick={clearSupabaseRecords}
                className="w-full py-4 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/50 rounded-xl text-orange-300 font-bold transition-colors"
              >
                🌐 Supabase全記録をクリア
              </button>
              <button
                onClick={fullReset}
                className="w-full py-4 bg-gradient-to-r from-red-600/30 to-pink-600/30 hover:from-red-600/50 hover:to-pink-600/50 border border-red-500/50 rounded-xl text-white font-bold transition-colors"
              >
                ⚡ 完全リセット（ローカル + サーバー）
              </button>
            </div>

            {clearStatus && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50"
              >
                <pre className="text-slate-200 text-sm whitespace-pre-wrap">{clearStatus}</pre>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* 全診断記録タブ */}
        {activeTab === "records" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-sm">👤</span>
                診断記録
                {allRecords && (
                  <span className="ml-2 px-3 py-1 bg-purple-600/30 rounded-full text-purple-300 text-sm">
                    {allRecords.total}件
                  </span>
                )}
              </h3>
              <button
                onClick={() => fetchAllRecords(1, recordsSearchQuery)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm"
              >
                🔄 更新
              </button>
            </div>
            
            {/* 検索フォーム */}
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={recordsSearchQuery}
                onChange={(e) => setRecordsSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchAllRecords(1, recordsSearchQuery)}
                placeholder="ユーザー名を検索..."
                className="flex-1 p-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={() => fetchAllRecords(1, recordsSearchQuery)}
                disabled={recordsLoading}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-bold transition-colors disabled:opacity-50"
              >
                {recordsLoading ? "⏳" : "🔍"}
              </button>
              <button
                onClick={handleSearchClear}
                className="px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white transition-colors"
              >
                クリア
              </button>
            </div>

            {/* ステータス表示 */}
            {deleteStatus && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-emerald-900/30 rounded-xl border border-emerald-500/30"
              >
                <p className="text-emerald-200 text-sm">{deleteStatus}</p>
              </motion.div>
            )}

            {/* 記録一覧 */}
            {recordsLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400">読み込み中...</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {allRecords?.records.map((record) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 hover:border-purple-500/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {/* サムネイル or タイプアイコン */}
                        {record.card_image_url ? (
                          <div
                            className="w-14 h-18 rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all bg-slate-800"
                            onClick={() => openDetailModal(record)}
                          >
                            <Image
                              src={record.card_image_url}
                              alt="カードサムネイル"
                              width={56}
                              height={72}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all"
                            style={{ backgroundColor: TYPE_COLORS[record.dream_type] + "30" }}
                            onClick={() => openDetailModal(record)}
                          >
                            <span className="text-2xl">
                              {TYPE_NAMES[record.dream_type]?.split(" ")[0] || "❓"}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">{record.user_name}</p>
                          <p className="text-slate-400 text-xs">
                            {TYPE_NAMES[record.dream_type] || record.dream_type}
                          </p>
                          <p className="text-slate-500 text-xs">
                            {new Date(record.created_at).toLocaleString("ja-JP")}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openDetailModal(record)}
                          className="px-3 py-2 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 rounded-lg text-blue-300 text-sm transition-colors"
                        >
                          📋 詳細
                        </button>
                        <button
                          onClick={() => deleteUser(record.user_name)}
                          className="px-3 py-2 bg-red-600/30 hover:bg-red-600/50 border border-red-500/50 rounded-lg text-red-300 text-sm transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </motion.div>
                  ))}
                  {allRecords?.records.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-slate-500">
                        {recordsSearchQuery ? "検索結果がありません" : "診断記録がありません"}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* ページネーション */}
                {allRecords && allRecords.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4">
                    <button
                      onClick={() => fetchAllRecords(recordsPage - 1, recordsSearchQuery)}
                      disabled={recordsPage <= 1}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ← 前
                    </button>
                    <span className="text-slate-300">
                      {recordsPage} / {allRecords.totalPages}
                    </span>
                    <button
                      onClick={() => fetchAllRecords(recordsPage + 1, recordsSearchQuery)}
                      disabled={recordsPage >= allRecords.totalPages}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      次 →
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* エラーログタブ */}
        {activeTab === "errors" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg flex items-center justify-center text-sm">⚠️</span>
                エラーログ
                {errorLogs && (
                  <span className="ml-2 px-3 py-1 bg-red-600/30 rounded-full text-red-300 text-sm">
                    {errorLogs.total}件
                  </span>
                )}
              </h3>
              <button
                onClick={() => fetchErrorLogs(errorsPage)}
                disabled={errorsLoading}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm"
              >
                🔄 更新
              </button>
            </div>
            
            {errorsLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400">読み込み中...</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {errorLogs?.logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 bg-red-900/20 rounded-xl border border-red-500/30"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-red-200 font-medium">
                            ❌ {log.user_name || "不明"}
                          </p>
                          <p className="text-red-400/60 text-xs">
                            {TYPE_NAMES[log.dream_type] || log.dream_type} ・{" "}
                            {new Date(log.created_at).toLocaleString("ja-JP")}
                          </p>
                        </div>
                      </div>
                      {log.error_message && (
                        <p className="text-red-300 text-sm bg-slate-900/50 p-3 rounded-lg font-mono">
                          {log.error_message}
                        </p>
                      )}
                    </div>
                  ))}
                  {errorLogs?.logs.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">✅</span>
                      </div>
                      <p className="text-emerald-400 font-medium">エラーはありません</p>
                    </div>
                  )}
                </div>
                
                {/* ページネーション */}
                {errorLogs && errorLogs.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4">
                    <button
                      onClick={() => fetchErrorLogs(errorsPage - 1)}
                      disabled={errorsPage <= 1}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ← 前
                    </button>
                    <span className="text-slate-300">
                      {errorsPage} / {errorLogs.totalPages}
                    </span>
                    <button
                      onClick={() => fetchErrorLogs(errorsPage + 1)}
                      disabled={errorsPage >= errorLogs.totalPages}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      次 →
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* フッター */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-slate-400 hover:text-white underline transition-colors"
          >
            ← トップページに戻る
          </a>
        </div>
      </div>

      {/* 詳細モーダル */}
      <AnimatePresence>
        {showDetailModal && selectedRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold text-white">診断詳細</h3>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-slate-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* カードプレビュー */}
                  {selectedRecord.card_image_url && (
                    <div className="rounded-xl overflow-hidden border border-slate-700">
                      <Image
                        src={selectedRecord.card_image_url}
                        alt="生成カード"
                        width={600}
                        height={900}
                        className="w-full h-auto"
                        priority
                      />
                      <a
                        href={selectedRecord.card_image_url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center py-2 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-sm"
                      >
                        🔗 画像を開く / 保存
                      </a>
                    </div>
                  )}
                  {/* タイプ表示 */}
                  <div 
                    className="p-6 rounded-xl flex items-center gap-4"
                    style={{ backgroundColor: TYPE_COLORS[selectedRecord.dream_type] + "20" }}
                  >
                    <span className="text-5xl">
                      {TYPE_NAMES[selectedRecord.dream_type]?.split(" ")[0] || "❓"}
                    </span>
                    <div>
                      <p className="text-white text-2xl font-bold">
                        {TYPE_NAMES[selectedRecord.dream_type] || selectedRecord.dream_type}
                      </p>
                      <p className="text-slate-400">診断タイプ</p>
                    </div>
                  </div>
                  
                  {/* 詳細情報 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-slate-400 text-sm mb-1">ユーザー名</p>
                      <p className="text-white text-lg font-bold">{selectedRecord.user_name}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-slate-400 text-sm mb-1">診断日時</p>
                      <p className="text-white">{new Date(selectedRecord.created_at).toLocaleString("ja-JP")}</p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <p className="text-slate-400 text-sm mb-1">フィンガープリント</p>
                    <p className="text-slate-300 text-xs font-mono break-all">{selectedRecord.fingerprint}</p>
                  </div>
                  
                  {selectedRecord.ip_address && (
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-slate-400 text-sm mb-1">IPアドレス</p>
                      <p className="text-slate-300 text-sm font-mono">{selectedRecord.ip_address}</p>
                    </div>
                  )}
                  
                  <button
                    onClick={() => {
                      deleteUser(selectedRecord.user_name);
                      setShowDetailModal(false);
                    }}
                    className="w-full py-3 bg-red-600/30 hover:bg-red-600/50 border border-red-500/50 rounded-xl text-red-300 font-bold transition-colors"
                  >
                    🗑️ この記録を削除（再診断を許可）
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 統計カードコンポーネント
function StatCard({
  title,
  value,
  icon,
  gradient,
}: {
  title: string;
  value: number;
  icon: string;
  gradient: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-5 border border-slate-700/50 relative overflow-hidden"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10`} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">{icon}</span>
          <span className="text-slate-400 text-sm">{title}</span>
        </div>
        <div className="text-4xl font-bold text-white">{value.toLocaleString()}</div>
      </div>
    </motion.div>
  );
}
