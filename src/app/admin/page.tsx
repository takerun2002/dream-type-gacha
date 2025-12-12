"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

interface RecentDiagnosis {
  id: string;
  user_name: string;
  dream_type: string;
  created_at: string;
  ip_address?: string;
  fingerprint?: string;
  user_agent?: string;
  card_image_url?: string;
  card_image_base64?: string;
  has_card_image?: boolean;
}

interface SupportInquiry {
  id: string;
  created_at: string;
  user_name: string | null;
  dream_type: string | null;
  fingerprint: string | null;
  issue_summary: string;
  conversation: { role: string; content: string }[];
  status: "open" | "in_progress" | "resolved";
  resolved_at: string | null;
  notes: string | null;
}

interface Stats {
  totalDiagnoses: number;
  todayDiagnoses: number;
  typeDistribution: Record<string, number>;
  hourlyDistribution: number[];
  recentDiagnoses: RecentDiagnosis[];
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
  supportInquiries: SupportInquiry[];
  supportStats: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
  };
}

interface SearchResult {
  id: string;
  user_name: string;
  dream_type: string;
  created_at: string;
  fingerprint: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "data" | "logs" | "users" | "support">("dashboard");
  // サポート問い合わせ関連
  const [selectedInquiry, setSelectedInquiry] = useState<SupportInquiry | null>(null);
  const [inquiryStatusUpdating, setInquiryStatusUpdating] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [clearStatus, setClearStatus] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  // ユーザー検索・削除
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);
  // カード画像モーダル
  const [selectedCard, setSelectedCard] = useState<RecentDiagnosis | null>(null);
  const [cardImageLoading, setCardImageLoading] = useState(false);
  const [cardImageCache, setCardImageCache] = useState<Record<string, string>>({});

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

  // ユーザー検索
  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setDeleteStatus(null);
    try {
      const response = await fetch("/api/admin/clear-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: ADMIN_PASSWORD, searchQuery: searchQuery.trim() }),
      });
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.records || []);
        if (data.records?.length === 0) {
          setDeleteStatus("🔍 該当するユーザーが見つかりません");
        }
      } else {
        setDeleteStatus("❌ " + data.error);
      }
    } catch (error) {
      setDeleteStatus("❌ 検索に失敗: " + (error as Error).message);
    }
    setSearchLoading(false);
  };

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
        // 検索結果から削除
        setSearchResults(prev => prev.filter(r => r.user_name !== userName));
        // 統計を更新
        fetchStats();
      } else {
        setDeleteStatus("❌ " + data.error);
      }
    } catch (error) {
      setDeleteStatus("❌ 削除に失敗: " + (error as Error).message);
    }
  };

  // 個別のカード画像を取得
  const fetchCardImage = useCallback(async (userName: string): Promise<string | null> => {
    // キャッシュがあればそれを返す
    if (cardImageCache[userName]) {
      return cardImageCache[userName];
    }

    try {
      const response = await fetch("/api/admin/card-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: ADMIN_PASSWORD, userName }),
      });
      const data = await response.json();

      if (data.success) {
        const imageData = data.cardImageUrl ||
          (data.cardImageBase64 ? `data:image/png;base64,${data.cardImageBase64}` : null);

        if (imageData) {
          setCardImageCache(prev => ({ ...prev, [userName]: imageData }));
          return imageData;
        }
      }
      return null;
    } catch (error) {
      console.error("Card image fetch error:", error);
      return null;
    }
  }, [cardImageCache]);

  // モーダルを開く時に画像を取得
  const openCardModal = async (diagnosis: RecentDiagnosis) => {
    setSelectedCard(diagnosis);

    // すでに画像URLがある場合はそのまま使用
    if (diagnosis.card_image_url || diagnosis.card_image_base64) {
      return;
    }

    // 画像フラグがあり、キャッシュにない場合は取得
    if (diagnosis.has_card_image && !cardImageCache[diagnosis.user_name]) {
      setCardImageLoading(true);
      await fetchCardImage(diagnosis.user_name);
      setCardImageLoading(false);
    }
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
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { id: "dashboard", label: "📊 ダッシュボード" },
            { id: "support", label: `📨 問い合わせ${stats?.supportStats?.open ? ` (${stats.supportStats.open})` : ""}` },
            { id: "users", label: "👤 ユーザー管理" },
            { id: "data", label: "🗑️ データ管理" },
            { id: "logs", label: "📋 全診断一覧" },
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

        {/* 全ユーザー診断タブ */}
        {activeTab === "logs" && stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30 flex flex-col"
            style={{ maxHeight: 'calc(100vh - 250px)' }}
          >
            <h3 className="text-lg font-bold text-purple-300 mb-4 flex-shrink-0">
              📋 全ユーザー診断一覧（{stats.recentDiagnoses.length}件）
            </h3>
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 pb-6" style={{ minHeight: 0 }}>
              {stats.recentDiagnoses.map((diagnosis, i) => (
                <motion.div
                  key={diagnosis.id || i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.5) }}
                  className="flex flex-col md:flex-row gap-4 p-4 bg-purple-900/20 rounded-lg min-w-0"
                >
                  {/* カード画像サムネイル */}
                  <div className="flex-shrink-0">
                    <CardThumbnail
                      diagnosis={diagnosis}
                      cardImageCache={cardImageCache}
                      onLoadImage={fetchCardImage}
                      onOpenModal={openCardModal}
                    />
                  </div>

                  {/* ユーザー情報 */}
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2 mb-2">
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

                    {/* 詳細情報 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs break-words">
                      <div className="text-purple-400">
                        📅 {new Date(diagnosis.created_at).toLocaleString("ja-JP")}
                      </div>
                      {diagnosis.ip_address && (
                        <div className="text-purple-400">
                          🌐 IP: {diagnosis.ip_address}
                        </div>
                      )}
                      {diagnosis.fingerprint && (
                        <div className="text-purple-400/60 truncate">
                          🔑 FP: {diagnosis.fingerprint.substring(0, 16)}...
                        </div>
                      )}
                      {diagnosis.user_agent && (
                        <div className="text-purple-400/40 truncate col-span-2">
                          📱 {diagnosis.user_agent.substring(0, 50)}...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* アクション */}
                  <div className="flex-shrink-0 flex items-center gap-2 flex-wrap md:flex-nowrap">
                    {(diagnosis.card_image_url || diagnosis.card_image_base64 || diagnosis.has_card_image) && (
                      <button
                        onClick={() => openCardModal(diagnosis)}
                        className="px-3 py-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 rounded-lg text-purple-300 text-xs transition-colors whitespace-nowrap"
                      >
                        🔍 拡大
                      </button>
                    )}
                    <button
                      onClick={() => deleteUser(diagnosis.user_name)}
                      className="px-3 py-2 bg-red-600/30 hover:bg-red-600/50 border border-red-500/50 rounded-lg text-red-300 text-xs transition-colors whitespace-nowrap"
                    >
                      🗑️ 削除
                    </button>
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

        {/* ユーザー管理タブ */}
        {activeTab === "users" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30"
          >
            <h3 className="text-lg font-bold text-purple-300 mb-4">
              👤 ユーザー検索・削除
            </h3>
            
            {/* 検索フォーム */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                placeholder="ユーザー名を入力（部分一致）"
                className="flex-1 p-3 rounded-lg bg-black/30 border border-purple-500/30 text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={searchUsers}
                disabled={searchLoading}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-bold transition-colors disabled:opacity-50"
              >
                {searchLoading ? "🔍..." : "🔍 検索"}
              </button>
            </div>

            {/* ステータス表示 */}
            {deleteStatus && (
              <div className="mb-4 p-3 bg-black/30 rounded-lg border border-purple-500/30">
                <p className="text-purple-200 text-sm">{deleteStatus}</p>
              </div>
            )}

            {/* 検索結果 */}
            <div className="space-y-2">
              {searchResults.map((record) => (
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
              {searchResults.length === 0 && searchQuery && !searchLoading && (
                <p className="text-purple-400/60 text-center py-8">
                  検索結果がありません
                </p>
              )}
              {!searchQuery && (
                <p className="text-purple-400/60 text-center py-8">
                  ユーザー名を入力して検索してください
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* サポート問い合わせタブ */}
        {activeTab === "support" && stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* 問い合わせ統計 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="総問い合わせ"
                value={stats.supportStats?.total || 0}
                icon="📨"
                color="purple"
              />
              <StatCard
                title="未対応"
                value={stats.supportStats?.open || 0}
                icon="🔴"
                color="yellow"
              />
              <StatCard
                title="対応中"
                value={stats.supportStats?.inProgress || 0}
                icon="🟡"
                color="blue"
              />
              <StatCard
                title="解決済み"
                value={stats.supportStats?.resolved || 0}
                icon="🟢"
                color="green"
              />
            </div>

            {/* 問い合わせ一覧 */}
            <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
              <h3 className="text-lg font-bold text-purple-300 mb-4">
                📋 問い合わせ一覧
              </h3>
              <div className="space-y-4">
                {stats.supportInquiries && stats.supportInquiries.length > 0 ? (
                  stats.supportInquiries.map((inquiry) => (
                    <motion.div
                      key={inquiry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        inquiry.status === "open"
                          ? "bg-red-900/20 border-red-500/30 hover:bg-red-900/30"
                          : inquiry.status === "in_progress"
                          ? "bg-yellow-900/20 border-yellow-500/30 hover:bg-yellow-900/30"
                          : "bg-green-900/20 border-green-500/30 hover:bg-green-900/30"
                      }`}
                      onClick={() => setSelectedInquiry(inquiry)}
                    >
                      <div className="flex flex-col md:flex-row justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              inquiry.status === "open"
                                ? "bg-red-500/30 text-red-300"
                                : inquiry.status === "in_progress"
                                ? "bg-yellow-500/30 text-yellow-300"
                                : "bg-green-500/30 text-green-300"
                            }`}>
                              {inquiry.status === "open" ? "未対応" : inquiry.status === "in_progress" ? "対応中" : "解決済み"}
                            </span>
                            <span className="text-purple-300 font-medium">
                              {inquiry.user_name || "名前不明"}
                            </span>
                            {inquiry.dream_type && (
                              <span className="text-purple-400/60 text-sm">
                                ({TYPE_NAMES[inquiry.dream_type] || inquiry.dream_type})
                              </span>
                            )}
                          </div>
                          <p className="text-purple-200 text-sm line-clamp-2">
                            {inquiry.issue_summary}
                          </p>
                          <p className="text-purple-400/60 text-xs mt-1">
                            {new Date(inquiry.created_at).toLocaleString("ja-JP")}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInquiry(inquiry);
                            }}
                            className="px-3 py-1 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 rounded-lg text-purple-300 text-xs transition-colors"
                          >
                            詳細
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-purple-400/60 text-center py-8">
                    問い合わせはまだありません
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* 問い合わせ詳細モーダル */}
        {selectedInquiry && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setSelectedInquiry(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 rounded-2xl border border-purple-500/30 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ヘッダー */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-purple-300 mb-1">
                    問い合わせ詳細
                  </h3>
                  <p className="text-purple-400/60 text-sm">
                    {new Date(selectedInquiry.created_at).toLocaleString("ja-JP")}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedInquiry(null)}
                  className="w-8 h-8 bg-purple-600/50 hover:bg-purple-600 rounded-full text-white flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* ユーザー情報 */}
              <div className="mb-4 p-4 bg-purple-900/30 rounded-lg">
                <h4 className="text-purple-300 font-bold mb-2">ユーザー情報</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p className="text-purple-400">
                    名前: <span className="text-purple-200">{selectedInquiry.user_name || "不明"}</span>
                  </p>
                  <p className="text-purple-400">
                    タイプ: <span className="text-purple-200">{selectedInquiry.dream_type ? TYPE_NAMES[selectedInquiry.dream_type] || selectedInquiry.dream_type : "不明"}</span>
                  </p>
                </div>
              </div>

              {/* 問い合わせ内容 */}
              <div className="mb-4 p-4 bg-purple-900/30 rounded-lg">
                <h4 className="text-purple-300 font-bold mb-2">問い合わせ内容</h4>
                <p className="text-purple-200 whitespace-pre-wrap">
                  {selectedInquiry.issue_summary}
                </p>
              </div>

              {/* 会話履歴 */}
              {selectedInquiry.conversation && selectedInquiry.conversation.length > 0 && (
                <div className="mb-4 p-4 bg-purple-900/30 rounded-lg">
                  <h4 className="text-purple-300 font-bold mb-2">
                    チャット履歴 ({selectedInquiry.conversation.length}件)
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedInquiry.conversation.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg text-sm ${
                          msg.role === "user"
                            ? "bg-blue-900/30 text-blue-200 ml-8"
                            : "bg-gray-900/30 text-gray-200 mr-8"
                        }`}
                      >
                        <span className="text-xs text-purple-400">
                          {msg.role === "user" ? "ユーザー" : "RASくん"}:
                        </span>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ステータス更新 */}
              <div className="flex gap-2 flex-wrap">
                <span className="text-purple-300 text-sm self-center">ステータス:</span>
                {["open", "in_progress", "resolved"].map((status) => (
                  <button
                    key={status}
                    disabled={inquiryStatusUpdating || selectedInquiry.status === status}
                    onClick={async () => {
                      setInquiryStatusUpdating(true);
                      try {
                        const response = await fetch("/api/admin/support-status", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            password: ADMIN_PASSWORD,
                            inquiryId: selectedInquiry.id,
                            status,
                          }),
                        });
                        const data = await response.json();
                        if (data.success) {
                          setSelectedInquiry({ ...selectedInquiry, status: status as "open" | "in_progress" | "resolved" });
                          fetchStats();
                        }
                      } catch (error) {
                        console.error("ステータス更新エラー:", error);
                      }
                      setInquiryStatusUpdating(false);
                    }}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      selectedInquiry.status === status
                        ? status === "open"
                          ? "bg-red-500 text-white"
                          : status === "in_progress"
                          ? "bg-yellow-500 text-black"
                          : "bg-green-500 text-white"
                        : "bg-purple-900/50 text-purple-300 hover:bg-purple-900"
                    } disabled:opacity-50`}
                  >
                    {inquiryStatusUpdating ? "..." : status === "open" ? "未対応" : status === "in_progress" ? "対応中" : "解決済み"}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* フッター */}
        <div className="mt-8 mb-24 text-center">
          <a
            href="/"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            ← トップページに戻る
          </a>
        </div>
      </div>

      {/* カード画像モーダル */}
      {selectedCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedCard(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {cardImageLoading ? (
              <div className="flex items-center justify-center h-64 bg-purple-900/30 rounded-xl border-2 border-purple-500/30">
                <span className="text-purple-300 text-lg">🔄 読み込み中...</span>
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={selectedCard.card_image_url ||
                     (selectedCard.card_image_base64 ? `data:image/png;base64,${selectedCard.card_image_base64}` : null) ||
                     cardImageCache[selectedCard.user_name]}
                alt={`${selectedCard.user_name}のカード`}
                className="w-full rounded-xl shadow-2xl border-2 border-purple-500/30"
              />
            )}
            <div className="mt-4 text-center">
              <p className="text-white font-bold text-xl">{selectedCard.user_name}</p>
              <p className="text-purple-300">
                {TYPE_NAMES[selectedCard.dream_type] || selectedCard.dream_type}
              </p>
              <p className="text-purple-400/60 text-sm mt-1">
                {new Date(selectedCard.created_at).toLocaleString("ja-JP")}
              </p>
              {selectedCard.ip_address && (
                <p className="text-purple-400/60 text-xs mt-1">
                  IP: {selectedCard.ip_address}
                </p>
              )}
            </div>
            <button
              onClick={() => setSelectedCard(null)}
              className="absolute -top-3 -right-3 w-10 h-10 bg-purple-600 hover:bg-purple-500 rounded-full text-white font-bold text-xl flex items-center justify-center shadow-lg transition-colors"
            >
              ✕
            </button>
            {/* ダウンロードボタン */}
            {(selectedCard.card_image_url || cardImageCache[selectedCard.user_name]) && (
              <a
                href={selectedCard.card_image_url || cardImageCache[selectedCard.user_name]}
                download={`${selectedCard.user_name}-card.png`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 right-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm font-bold transition-colors"
              >
                📥 ダウンロード
              </a>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}

// サムネイルコンポーネント（Intersection Observer対応）
function CardThumbnail({
  diagnosis,
  cardImageCache,
  onLoadImage,
  onOpenModal,
}: {
  diagnosis: RecentDiagnosis;
  cardImageCache: Record<string, string>;
  onLoadImage: (userName: string) => Promise<string | null>;
  onOpenModal: (diagnosis: RecentDiagnosis) => void;
}) {
  const thumbnailRef = useRef<HTMLButtonElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasTriedLoad, setHasTriedLoad] = useState(false);

  const imageUrl = diagnosis.card_image_url ||
    (diagnosis.card_image_base64 ? `data:image/png;base64,${diagnosis.card_image_base64}` : null) ||
    cardImageCache[diagnosis.user_name];

  useEffect(() => {
    if (imageUrl || hasTriedLoad || !diagnosis.has_card_image) {
      return;
    }

    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !hasTriedLoad) {
          setHasTriedLoad(true);
          setIsLoading(true);
          await onLoadImage(diagnosis.user_name);
          setIsLoading(false);
        }
      },
      { rootMargin: '100px', threshold: 0.1 }
    );

    if (thumbnailRef.current) {
      observer.observe(thumbnailRef.current);
    }

    return () => observer.disconnect();
  }, [diagnosis.user_name, diagnosis.has_card_image, imageUrl, hasTriedLoad, onLoadImage]);

  if (!diagnosis.card_image_url && !diagnosis.card_image_base64 && !diagnosis.has_card_image && !cardImageCache[diagnosis.user_name]) {
    return (
      <div className="w-20 h-28 bg-purple-900/30 rounded-lg flex items-center justify-center border border-purple-500/20">
        <span className="text-purple-400/50 text-xs text-center">No<br />Image</span>
      </div>
    );
  }

  return (
    <button
      ref={thumbnailRef}
      onClick={() => onOpenModal(diagnosis)}
      className="block w-20 h-28 overflow-hidden rounded-lg border-2 border-purple-500/30 hover:border-purple-400 transition-colors cursor-pointer"
    >
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center bg-purple-900/50">
          <span className="text-purple-300 text-lg animate-spin">🔄</span>
        </div>
      ) : imageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imageUrl}
          alt={`${diagnosis.user_name}のカード`}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-purple-900/50">
          <span className="text-purple-300 text-2xl">🎴</span>
        </div>
      )}
    </button>
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
