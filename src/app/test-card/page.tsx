"use client";

import { useEffect, useRef, useState } from "react";
import { generateCardV2, downloadCardV2, type CardDataV2 } from "@/lib/cardGeneratorV2";
import { dreamTypes } from "@/lib/dreamTypes";

export default function TestCardPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<string>("準備中...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testCard = async () => {
      if (!canvasRef.current) return;

      setStatus("カード生成中...");

      try {
        // テストデータ
        const testData: CardDataV2 = {
          userName: "テストユーザー",
          dreamType: "phoenix",
          dreamTypeName: "鳳凰タイプ",
          dreamTypeDisplayName: "不死鳥", // 新しい表示名
          personalizedMessage: "あなたは不死鳥タイプです。どんな困難からも蘇る力を持っています。引き寄せノートには、過去に乗り越えた困難と、そこから得た強さを書き出してみましょう。",
          color: dreamTypes.phoenix.color,
          frameColor: dreamTypes.phoenix.frameColor,
          cardImageUrl: dreamTypes.phoenix.cardImage,
        };

        await generateCardV2(canvasRef.current, testData);
        setStatus("✅ カード生成完了！");
      } catch (err) {
        console.error("エラー:", err);
        setError(err instanceof Error ? err.message : "不明なエラー");
        setStatus("❌ エラー発生");
      }
    };

    // 少し待ってから実行（フォント読み込み待ち）
    setTimeout(testCard, 1000);
  }, []);

  const handleDownload = async () => {
    if (!canvasRef.current) return;
    try {
      await downloadCardV2(canvasRef.current, "test-card.png");
      setStatus("✅ ダウンロード完了！");
    } catch (err) {
      console.error("ダウンロードエラー:", err);
      setError(err instanceof Error ? err.message : "ダウンロード失敗");
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">カードジェネレーターV2 テスト</h1>
        
        <div className="mb-4">
          <p className="text-lg mb-2">ステータス: {status}</p>
          {error && <p className="text-red-400">エラー: {error}</p>}
        </div>

        <div className="mb-6">
          <canvas
            ref={canvasRef}
            className="border-2 border-gray-600 rounded-lg max-w-full"
            style={{ maxHeight: "600px" }}
          />
        </div>

        <button
          onClick={handleDownload}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold"
        >
          ダウンロード
        </button>

        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-bold mb-2">テスト内容</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>エンブレム表示: 「あなたは 不死鳥 タイプです」</li>
            <li>HTML2Canvas方式でテキスト合成</li>
            <li>Google Fonts（Zen Maru Gothic）使用</li>
            <li>完全無料（$0）</li>
          </ul>
        </div>
      </div>
    </div>
  );
}






