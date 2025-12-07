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
  generationStats: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    recentHour: number;
  };
}

interface SearchResult {
  id: string;
  user_name: string;
  dream_type: string;
  created_at: string;
  fingerprint: string;
  ip_address?: string;
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
  records: SearchResult[];
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
          limit: 30,
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
          limit: 30
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
        // 記録を再取得
        fetchAllRecords(recordsPage, recordsSearchQuery);
        // 統計を更新
        fetchStats();
        // 3秒後にメッセージをクリア
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
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { id: "dashboard", label: "📊 ダッシュボード" },
            { id: "records", label: "👤 全診断記録" },
            { id: "errors", label: "⚠️ エラーログ" },
            { id: "data", label: "🗑️ データ管理" },
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

            {/* カード生成統計 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30"
            >
              <h3 className="text-lg font-bold text-purple-300 mb-4">
                🎴 カード生成統計
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-purple-400 text-sm mb-1">総生成数</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.generationStats.total}
                  </p>
                </div>
                <div>
                  <p className="text-green-400 text-sm mb-1">成功</p>
                  <p className="text-2xl font-bold text-green-400">
                    {stats.generationStats.successful}
                  </p>
                </div>
                <div>
                  <p className="text-red-400 text-sm mb-1">失敗</p>
                  <p className="text-2xl font-bold text-red-400">
                    {stats.generationStats.failed}
                  </p>
                </div>
                <div>
                  <p className="text-purple-400 text-sm mb-1">成功率</p>
                  <p className={`text-2xl font-bold ${
                    stats.generationStats.successRate >= 90
                      ? "text-green-400"
                      : stats.generationStats.successRate >= 70
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}>
                    {stats.generationStats.successRate}%
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-purple-500/30">
                <p className="text-purple-300 text-sm">
                  過去1時間の生成数: <span className="font-bold text-white">{stats.generationStats.recentHour}</span> 件
                </p>
              </div>
            </motion.div>

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

        {/* 全診断記録タブ */}
        {activeTab === "records" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-purple-300">
                👤 全診断記録 {allRecords && `（${allRecords.total}件）`}
              </h3>
            </div>
            
            {/* 検索フォーム */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={recordsSearchQuery}
                onChange={(e) => setRecordsSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchAllRecords(1, recordsSearchQuery)}
                placeholder="ユーザー名を検索（部分一致）"
                className="flex-1 p-3 rounded-lg bg-black/30 border border-purple-500/30 text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={() => fetchAllRecords(1, recordsSearchQuery)}
                disabled={recordsLoading}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-bold transition-colors disabled:opacity-50"
              >
                {recordsLoading ? "🔍..." : "🔍 検索"}
              </button>
              <button
                onClick={() => {
                  setRecordsSearchQuery("");
                  fetchAllRecords(1, "");
                }}
                className="px-4 py-3 bg-gray-600/50 hover:bg-gray-600 rounded-lg text-white transition-colors"
              >
                クリア
              </button>
            </div>

            {/* ステータス表示 */}
            {deleteStatus && (
              <div className="mb-4 p-3 bg-green-900/30 rounded-lg border border-green-500/30">
                <p className="text-green-200 text-sm">{deleteStatus}</p>
              </div>
            )}

            {/* 記録一覧 */}
            {recordsLoading ? (
              <div className="text-center py-8">
                <p className="text-purple-300">⏳ 読み込み中...</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {allRecords?.records.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 bg-purple-900/20 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {TYPE_NAMES[record.dream_type]?.split(" ")[0] || "❓"}
                        </span>
                        <div>
                          <p className="text-purple-200 font-medium">
                            {record.user_name}
                          </p>
                          <p className="text-purple-400/60 text-xs">
                            {TYPE_NAMES[record.dream_type] || record.dream_type} ・{" "}
                            {new Date(record.created_at).toLocaleString("ja-JP")}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteUser(record.user_name)}
                        className="px-4 py-2 bg-red-600/30 hover:bg-red-600/50 border border-red-500/50 rounded-lg text-red-300 text-sm font-bold transition-colors"
                      >
                        🗑️ 削除
                      </button>
                    </div>
                  ))}
                  {allRecords?.records.length === 0 && (
                    <p className="text-purple-400/60 text-center py-8">
                      {recordsSearchQuery ? "検索結果がありません" : "まだ診断記録がありません"}
                    </p>
                  )}
                </div>
                
                {/* ページネーション */}
                {allRecords && allRecords.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2">
                    <button
                      onClick={() => fetchAllRecords(recordsPage - 1, recordsSearchQuery)}
                      disabled={recordsPage <= 1}
                      className="px-4 py-2 bg-purple-600/50 hover:bg-purple-600 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ← 前
                    </button>
                    <span className="text-purple-300 px-4">
                      {recordsPage} / {allRecords.totalPages}
                    </span>
                    <button
                      onClick={() => fetchAllRecords(recordsPage + 1, recordsSearchQuery)}
                      disabled={recordsPage >= allRecords.totalPages}
                      className="px-4 py-2 bg-purple-600/50 hover:bg-purple-600 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed"
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
            className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-purple-300">
                ⚠️ カード生成エラーログ {errorLogs && `（${errorLogs.total}件）`}
              </h3>
              <button
                onClick={() => fetchErrorLogs(errorsPage)}
                disabled={errorsLoading}
                className="px-4 py-2 bg-purple-600/50 hover:bg-purple-600 rounded-lg text-white text-sm"
              >
                🔄 更新
              </button>
            </div>
            
            {errorsLoading ? (
              <div className="text-center py-8">
                <p className="text-purple-300">⏳ 読み込み中...</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {errorLogs?.logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-red-900/20 rounded-lg border border-red-500/30"
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
                        <p className="text-red-300 text-sm bg-black/30 p-2 rounded">
                          {log.error_message}
                        </p>
                      )}
                    </div>
                  ))}
                  {errorLogs?.logs.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-green-400">✅ エラーはありません</p>
                    </div>
                  )}
                </div>
                
                {/* ページネーション */}
                {errorLogs && errorLogs.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2">
                    <button
                      onClick={() => fetchErrorLogs(errorsPage - 1)}
                      disabled={errorsPage <= 1}
                      className="px-4 py-2 bg-purple-600/50 hover:bg-purple-600 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ← 前
                    </button>
                    <span className="text-purple-300 px-4">
                      {errorsPage} / {errorLogs.totalPages}
                    </span>
                    <button
                      onClick={() => fetchErrorLogs(errorsPage + 1)}
                      disabled={errorsPage >= errorLogs.totalPages}
                      className="px-4 py-2 bg-purple-600/50 hover:bg-purple-600 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed"
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
