"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

// シナリオのステップ
type ScenarioStep =
  | "greeting"
  | "category_select"
  | "faq_display"
  | "faq_resolved"
  | "inquiry_form"
  | "inquiry_sent"
  | "free_chat";

// カテゴリ定義
interface Category {
  id: string;
  label: string;
  icon: string;
  faqs: FAQ[];
}

interface FAQ {
  question: string;
  answer: string;
}

// FAQカテゴリデータ
const CATEGORIES: Category[] = [
  {
    id: "card_issue",
    label: "カード・画像について",
    icon: "🎴",
    faqs: [
      {
        question: "カードが生成されない、表示されない",
        answer: "混雑時は生成に時間がかかることがあります。\n\n対処法:\n1. しばらくお待ちください（最大1-2分）\n2. ページを再読み込みしてください\n3. 別のブラウザでお試しください",
      },
      {
        question: "カードの保存方法",
        answer: "結果画面の「写真に保存」ボタンをタップしてください。\n\nまたは:\n1. カード画像を長押し\n2. 「画像を保存」を選択\n\n※ メールで受け取ることもできます",
      },
      {
        question: "iPhoneでカードを保存する方法",
        answer: "方法1: 「写真に保存」ボタンをタップ\n\n方法2: カード画像を長押し → 「画像を保存」\n\n方法3: スクリーンショット（電源+音量上ボタン）",
      },
      {
        question: "Androidでカードを保存する方法",
        answer: "方法1: 「写真に保存」ボタンをタップ\n\n方法2: カード画像を長押し → 「画像をダウンロード」\n\n保存後はギャラリーアプリの「ダウンロード」フォルダで確認できます。",
      },
      {
        question: "カードの画像がぼやけている",
        answer: "対処法:\n1. PCで保存すると高画質で保存できます\n2. 「写真に保存」ボタンから保存してください\n3. メールで受け取ると元の画質で受け取れます",
      },
    ],
  },
  {
    id: "diagnosis",
    label: "診断結果について",
    icon: "🔮",
    faqs: [
      {
        question: "もう一度診断したい",
        answer: "診断は1人1回限りとなっております。\n\n別の結果が欲しい場合は:\n1. 別のブラウザまたは端末でお試しください\n2. サポートセンターへお問い合わせください\n\n※ 同じデバイスでは再診断できません",
      },
      {
        question: "診断結果がおかしい",
        answer: "診断結果は、四柱推命・九星気学・数秘術を組み合わせたAI診断です。\n\n結果についてのご質問は:\n1. サポートセンターへお問い合わせください\n2. きんまん先生の引き寄せノート講座で詳しく解説されています",
      },
      {
        question: "診断は何回でもできますか？",
        answer: "いいえ、診断はおひとり様1回限りとなっております。\n\n同じデバイス・同じブラウザでは再診断できませんので、ご注意ください。",
      },
      {
        question: "診断に時間がかかる",
        answer: "AIがあなた専用の鑑定書を生成するため、少し時間がかかります。\n\n通常: 約2-3分程度\n混雑時: 最大5分程度\n\nタイムアウトした場合はページを再読み込みしてください。",
      },
      {
        question: "診断は無料ですか？",
        answer: "はい、診断は完全無料です。\n\nきんまん先生の引き寄せノート講座の特典として提供されています。",
      },
    ],
  },
  {
    id: "name_issue",
    label: "名前・表示の問題",
    icon: "👤",
    faqs: [
      {
        question: "別の人の名前が表示される",
        answer: "共有デバイスで診断した可能性があります。\n\n対処法:\n1. 別のブラウザまたは端末でお試しください\n2. ブラウザのキャッシュをクリアしてください\n3. シークレットモードで診断してください",
      },
      {
        question: "なぜ他の人のカードが生成されるのか",
        answer: "技術的な原因:\n\n1. 同じデバイスから診断すると同じ人と認識される\n2. 同じWi-Fiからアクセスすると混同されることがある\n3. ブラウザキャッシュが残っている\n\n解決策:\n- 別のデバイスで診断する（最も確実）\n- 別のブラウザを使う\n- シークレットモードで診断する",
      },
    ],
  },
  {
    id: "email",
    label: "メール・鑑定書について",
    icon: "📧",
    faqs: [
      {
        question: "メールで鑑定書を受け取れない",
        answer: "メールが届かない場合:\n\n1. 迷惑メールフォルダを確認してください\n2. メールアドレスが正しいか確認してください\n3. 数分待ってから再度お試しください",
      },
    ],
  },
  {
    id: "error",
    label: "エラー・不具合",
    icon: "⚠️",
    faqs: [
      {
        question: "エラーが出る",
        answer: "一時的なエラーの可能性があります。\n\n対処法:\n1. ページを再読み込みしてください\n2. ブラウザのキャッシュをクリアしてください\n3. 別のブラウザでお試しください",
      },
    ],
  },
  {
    id: "sharing",
    label: "共有について",
    icon: "🔗",
    faqs: [
      {
        question: "診断結果を他の人に共有してもいいですか？",
        answer: "他の人に共有しないでください。\n\n診断結果はあなた専用のパーソナライズされた鑑定書です。\n\n他の人に共有すると診断の意味が薄れてしまいます。",
      },
      {
        question: "SNSに投稿してもいいですか？",
        answer: "推奨しませんが、投稿される場合は:\n\n- カード画像のみの投稿は可能です\n- ただし他の人に診断結果を共有しないでください\n- あなた自身の結果として楽しんでください",
      },
    ],
  },
];

interface UserInfo {
  name: string;
  dreamType: string;
  fingerprint: string;
}

type RASEmotion = "greeting" | "thinking" | "happy" | "explaining" | "confused" | "apologize";

const RAS_IMAGES: Record<RASEmotion, string> = {
  greeting: "/images/ras/ras-greeting.png",
  thinking: "/images/ras/ras-thinking.png",
  happy: "/images/ras/ras-happy.png",
  explaining: "/images/ras/ras-explaining.png",
  confused: "/images/ras/ras-confused.png",
  apologize: "/images/ras/ras-apologize.png",
};

export default function RASChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<ScenarioStep>("greeting");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [currentFaqIndex, setCurrentFaqIndex] = useState(0);
  const [viewedFaqs, setViewedFaqs] = useState<string[]>([]);
  const [emotion, setEmotion] = useState<RASEmotion>("greeting");
  const [showSparkles, setShowSparkles] = useState(false);

  // 問い合わせフォーム
  const [inquiryText, setInquiryText] = useState("");
  const [inquiryStatus, setInquiryStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  // ユーザー情報
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // フリーチャット（従来の機能、オプション）
  const [freeChatEnabled, setFreeChatEnabled] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ユーザー情報をlocalStorageから取得
  useEffect(() => {
    try {
      const savedData = localStorage.getItem("dream_diagnosis_completed");
      const fingerprint = localStorage.getItem("dream_diagnosis_fp") || "";
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setUserInfo({
          name: parsed.name || "不明",
          dreamType: parsed.dreamType || "不明",
          fingerprint,
        });
      }
    } catch (error) {
      console.error("ユーザー情報の取得に失敗:", error);
    }
  }, []);

  // キラキラエフェクト
  useEffect(() => {
    const interval = setInterval(() => {
      setShowSparkles(true);
      setTimeout(() => setShowSparkles(false), 1000);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [step, currentFaqIndex, messages]);

  // セッション初期化（フリーチャット用）
  useEffect(() => {
    if (freeChatEnabled && !sessionId) {
      const initSession = async () => {
        try {
          const res = await fetch("/api/chat/session", { method: "POST" });
          const data = await res.json();
          if (data.sessionId) {
            setSessionId(data.sessionId);
          }
        } catch (error) {
          console.error("Failed to initialize session:", error);
        }
      };
      initSession();
    }
  }, [freeChatEnabled, sessionId]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setStep("greeting");
      setEmotion("greeting");
      setSelectedCategory(null);
      setCurrentFaqIndex(0);
      setViewedFaqs([]);
      setInquiryText("");
      setInquiryStatus("idle");
    }
  };

  // カテゴリ選択
  const selectCategory = (category: Category) => {
    setSelectedCategory(category);
    setCurrentFaqIndex(0);
    setStep("faq_display");
    setEmotion("explaining");
  };

  // 「その他」選択 → 問い合わせフォーム
  const selectOther = () => {
    setStep("inquiry_form");
    setEmotion("explaining");
  };

  // FAQ解決した
  const faqResolved = () => {
    setStep("faq_resolved");
    setEmotion("happy");
  };

  // 次のFAQを見る
  const showNextFaq = () => {
    if (selectedCategory && currentFaqIndex < selectedCategory.faqs.length - 1) {
      const currentFaq = selectedCategory.faqs[currentFaqIndex];
      setViewedFaqs((prev) => [...prev, currentFaq.question]);
      setCurrentFaqIndex((prev) => prev + 1);
    } else {
      // FAQを全部見た → 問い合わせフォームへ
      setStep("inquiry_form");
      setEmotion("apologize");
    }
  };

  // カテゴリ選択に戻る
  const backToCategories = () => {
    setStep("category_select");
    setSelectedCategory(null);
    setCurrentFaqIndex(0);
    setEmotion("greeting");
  };

  // 問い合わせ送信
  const submitInquiry = async () => {
    if (!inquiryText.trim()) return;

    setInquiryStatus("sending");

    try {
      const response = await fetch("/api/support/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: userInfo || { name: "未設定", dreamType: "不明", fingerprint: "" },
          conversation: messages.length > 0
            ? messages.map((m) => ({ role: m.role, content: m.content }))
            : [],
          issue: inquiryText,
          severity: "medium",
          // シナリオ情報を追加
          scenario: {
            selectedCategory: selectedCategory?.label || "その他",
            viewedFaqs,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setInquiryStatus("success");
        setStep("inquiry_sent");
        setEmotion("happy");
      } else {
        setInquiryStatus("error");
      }
    } catch (error) {
      console.error("問い合わせ送信エラー:", error);
      setInquiryStatus("error");
    }
  };

  // フリーチャットモードに切り替え
  const enableFreeChat = () => {
    setFreeChatEnabled(true);
    setStep("free_chat");
    setEmotion("explaining");
  };

  // フリーチャット送信
  const sendFreeChatMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { role: "user" as const, content: inputValue.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setEmotion("thinking");

    try {
      const res = await fetch("/api/chat/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId,
        }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage = {
        role: "assistant" as const,
        content: data.response || "申し訳ありません、回答を生成できませんでした。",
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setEmotion("happy");
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant" as const,
          content: "すみません、エラーが発生しました。もう一度お試しください。",
        },
      ]);
      setEmotion("apologize");
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, sessionId]);

  // レンダリング：ステップごとのコンテンツ
  const renderContent = () => {
    switch (step) {
      case "greeting":
        return (
          <div className="space-y-4">
            <div className="flex gap-3 items-start">
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 shadow-lg" style={{ boxShadow: "0 0 15px rgba(255, 165, 0, 0.4)" }}>
                <div className="w-full h-full border-2 border-orange-400/60 rounded-full overflow-hidden bg-gradient-to-br from-orange-200 to-pink-200 p-0.5">
                  <Image src={RAS_IMAGES.greeting} alt="RASくん" width={44} height={44} className="object-cover rounded-full" />
                </div>
              </div>
              <div
                className="flex-1 rounded-2xl rounded-tl-sm p-4 shadow-xl"
                style={{
                  background: "linear-gradient(135deg, rgba(255, 250, 248, 0.98) 0%, rgba(255, 245, 250, 0.98) 100%)",
                  boxShadow: "0 4px 20px rgba(201, 75, 124, 0.15), 0 0 40px rgba(255, 200, 220, 0.1)"
                }}
              >
                <p className="text-sm leading-relaxed text-gray-700">
                  <span className="text-lg">👋</span> こんにちは！
                  <br />
                  <span className="font-bold text-pink-600">オペレーターRASくん</span>です。
                  <br /><br />
                  どのようなことでお困りですか？
                  <br />
                  <span className="text-gray-500 text-xs">下のボタンから選んでください✨</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setStep("category_select")}
              className="w-full py-3.5 text-white rounded-xl font-bold shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #c94b7c 0%, #9b4b8a 100%)",
                boxShadow: "0 4px 15px rgba(201, 75, 124, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
              }}
            >
              🔍 質問カテゴリを選ぶ
            </button>
          </div>
        );

      case "category_select":
        return (
          <div className="space-y-3">
            <div className="flex gap-3 items-start mb-4">
              <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 shadow-lg" style={{ boxShadow: "0 0 12px rgba(255, 165, 0, 0.4)" }}>
                <div className="w-full h-full border-2 border-orange-400/60 rounded-full overflow-hidden bg-gradient-to-br from-orange-200 to-pink-200 p-0.5">
                  <Image src={RAS_IMAGES.explaining} alt="RASくん" width={40} height={40} className="object-cover rounded-full" />
                </div>
              </div>
              <div
                className="flex-1 rounded-2xl rounded-tl-sm p-3 shadow-lg"
                style={{
                  background: "linear-gradient(135deg, rgba(255, 250, 248, 0.98) 0%, rgba(255, 245, 250, 0.98) 100%)",
                  boxShadow: "0 4px 15px rgba(201, 75, 124, 0.12)"
                }}
              >
                <p className="text-sm leading-relaxed text-gray-700">
                  どんなことでお困りですか？ 🤔
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {CATEGORIES.map((category, index) => (
                <button
                  key={category.id}
                  onClick={() => selectCategory(category)}
                  className="w-full py-3 px-4 rounded-xl text-left flex items-center gap-3 transition-all duration-200 hover:scale-[1.02] hover:translate-x-1"
                  style={{
                    background: "linear-gradient(135deg, rgba(45, 16, 40, 0.8) 0%, rgba(35, 12, 35, 0.9) 100%)",
                    border: "1px solid rgba(201, 75, 124, 0.3)",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  <span className="text-xl w-8 h-8 flex items-center justify-center rounded-lg" style={{ background: "rgba(201, 75, 124, 0.2)" }}>
                    {category.icon}
                  </span>
                  <span className="text-sm text-pink-100/90">{category.label}</span>
                  <span className="ml-auto text-pink-400/50">›</span>
                </button>
              ))}
            </div>

            <button
              onClick={selectOther}
              className="w-full py-3 px-4 rounded-xl text-left flex items-center gap-3 transition-all duration-200 hover:scale-[1.02] mt-3"
              style={{
                background: "linear-gradient(135deg, rgba(212, 165, 116, 0.15) 0%, rgba(201, 75, 124, 0.1) 100%)",
                border: "2px solid rgba(212, 165, 116, 0.4)",
                boxShadow: "0 0 15px rgba(212, 165, 116, 0.15)"
              }}
            >
              <span className="text-xl w-8 h-8 flex items-center justify-center rounded-lg" style={{ background: "rgba(212, 165, 116, 0.2)" }}>
                ❓
              </span>
              <span className="text-sm font-medium" style={{ color: "#d4a574" }}>その他（上記に該当しない）</span>
              <span className="ml-auto" style={{ color: "rgba(212, 165, 116, 0.6)" }}>›</span>
            </button>
          </div>
        );

      case "faq_display":
        if (!selectedCategory) return null;
        const currentFaq = selectedCategory.faqs[currentFaqIndex];

        return (
          <div className="space-y-4">
            {/* カテゴリ表示 - バッジスタイル */}
            <div
              className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full"
              style={{
                background: "linear-gradient(135deg, rgba(201, 75, 124, 0.2) 0%, rgba(155, 75, 138, 0.15) 100%)",
                border: "1px solid rgba(201, 75, 124, 0.3)"
              }}
            >
              <span>{selectedCategory.icon}</span>
              <span className="text-pink-200/90">{selectedCategory.label}</span>
              <span
                className="ml-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: "rgba(212, 165, 116, 0.3)", color: "#d4a574" }}
              >
                {currentFaqIndex + 1}/{selectedCategory.faqs.length}
              </span>
            </div>

            {/* FAQ - カード形式 */}
            <div className="flex gap-3 items-start">
              <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 shadow-lg" style={{ boxShadow: "0 0 12px rgba(255, 165, 0, 0.4)" }}>
                <div className="w-full h-full border-2 border-orange-400/60 rounded-full overflow-hidden bg-gradient-to-br from-orange-200 to-pink-200 p-0.5">
                  <Image src={RAS_IMAGES.explaining} alt="RASくん" width={40} height={40} className="object-cover rounded-full" />
                </div>
              </div>
              <div
                className="flex-1 rounded-2xl rounded-tl-sm p-4 shadow-xl"
                style={{
                  background: "linear-gradient(135deg, rgba(255, 250, 248, 0.98) 0%, rgba(255, 245, 250, 0.98) 100%)",
                  boxShadow: "0 4px 20px rgba(201, 75, 124, 0.15)"
                }}
              >
                <p
                  className="font-bold text-sm mb-3 pb-2"
                  style={{
                    color: "#c94b7c",
                    borderBottom: "1px dashed rgba(201, 75, 124, 0.3)"
                  }}
                >
                  💭 Q. {currentFaq.question}
                </p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                  {currentFaq.answer}
                </p>
              </div>
            </div>

            {/* アクションボタン - 改良版 */}
            <div className="space-y-3 pt-2">
              <p className="text-center text-xs" style={{ color: "rgba(232, 180, 200, 0.7)" }}>
                ✨ この回答で解決しましたか？
              </p>
              <div className="flex gap-3">
                <button
                  onClick={faqResolved}
                  className="flex-1 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, rgba(34, 197, 94, 0.25) 0%, rgba(22, 163, 74, 0.2) 100%)",
                    border: "2px solid rgba(34, 197, 94, 0.5)",
                    color: "#4ade80",
                    boxShadow: "0 0 15px rgba(34, 197, 94, 0.15)"
                  }}
                >
                  ✅ 解決した
                </button>
                <button
                  onClick={showNextFaq}
                  className="flex-1 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, rgba(251, 146, 60, 0.25) 0%, rgba(234, 88, 12, 0.2) 100%)",
                    border: "2px solid rgba(251, 146, 60, 0.5)",
                    color: "#fb923c",
                    boxShadow: "0 0 15px rgba(251, 146, 60, 0.15)"
                  }}
                >
                  {currentFaqIndex < selectedCategory.faqs.length - 1 ? "🔄 他の回答を見る" : "📝 問い合わせる"}
                </button>
              </div>
              <button
                onClick={backToCategories}
                className="w-full py-2 text-xs transition-all duration-200 hover:translate-x-[-4px]"
                style={{ color: "rgba(192, 132, 252, 0.6)" }}
              >
                ← カテゴリ選択に戻る
              </button>
            </div>
          </div>
        );

      case "faq_resolved":
        return (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full overflow-hidden shadow-xl" style={{ boxShadow: "0 0 25px rgba(34, 197, 94, 0.5), 0 0 50px rgba(255, 165, 0, 0.3)" }}>
                <div className="w-full h-full border-3 border-green-400/60 rounded-full overflow-hidden bg-gradient-to-br from-green-200 to-emerald-200 p-0.5">
                  <Image src={RAS_IMAGES.happy} alt="RASくん" width={60} height={60} className="object-cover rounded-full" />
                </div>
              </div>
            </div>
            <div
              className="rounded-2xl p-5 shadow-xl"
              style={{
                background: "linear-gradient(135deg, rgba(255, 250, 248, 0.98) 0%, rgba(240, 253, 244, 0.98) 100%)",
                boxShadow: "0 4px 20px rgba(34, 197, 94, 0.15), 0 0 40px rgba(255, 200, 220, 0.1)"
              }}
            >
              <p className="text-5xl mb-3">🎉</p>
              <p className="text-base font-bold mb-2 text-green-600">よかったです！</p>
              <p className="text-sm text-gray-600">
                他にお困りのことがあれば、
                <br />
                いつでもお声がけくださいね ✨
              </p>
            </div>
            <button
              onClick={backToCategories}
              className="w-full py-3.5 text-white rounded-xl font-bold shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #c94b7c 0%, #9b4b8a 100%)",
                boxShadow: "0 4px 15px rgba(201, 75, 124, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
              }}
            >
              🔍 他の質問をする
            </button>
            <button
              onClick={toggleChat}
              className="w-full py-2 text-sm transition-all duration-200"
              style={{ color: "rgba(192, 132, 252, 0.6)" }}
            >
              閉じる ×
            </button>
          </div>
        );

      case "inquiry_form":
        return (
          <div className="space-y-4">
            <div className="flex gap-3 items-start">
              <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 shadow-lg" style={{ boxShadow: "0 0 12px rgba(251, 146, 60, 0.4)" }}>
                <div className="w-full h-full border-2 border-orange-400/60 rounded-full overflow-hidden bg-gradient-to-br from-orange-200 to-pink-200 p-0.5">
                  <Image src={RAS_IMAGES.apologize} alt="RASくん" width={40} height={40} className="object-cover rounded-full" />
                </div>
              </div>
              <div
                className="flex-1 rounded-2xl rounded-tl-sm p-4 shadow-lg"
                style={{
                  background: "linear-gradient(135deg, rgba(255, 250, 248, 0.98) 0%, rgba(255, 245, 250, 0.98) 100%)",
                  boxShadow: "0 4px 15px rgba(201, 75, 124, 0.12)"
                }}
              >
                <p className="text-sm leading-relaxed text-gray-700">
                  申し訳ありません、お力になれず... 😢
                  <br /><br />
                  サポート担当に直接お問い合わせください。
                  <br />
                  <span className="text-xs text-gray-500">できるだけ早くご対応いたします。</span>
                </p>
              </div>
            </div>

            {userInfo && (
              <div
                className="p-3 rounded-xl text-sm"
                style={{
                  background: "linear-gradient(135deg, rgba(201, 75, 124, 0.1) 0%, rgba(155, 75, 138, 0.08) 100%)",
                  border: "1px solid rgba(201, 75, 124, 0.2)"
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-pink-400">👤</span>
                  <span className="text-pink-200/90">{userInfo.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-pink-400">🎴</span>
                  <span className="text-pink-200/90">{userInfo.dreamType}</span>
                </div>
              </div>
            )}

            {viewedFaqs.length > 0 && (
              <div
                className="px-3 py-2 rounded-lg text-xs flex items-center gap-2"
                style={{
                  background: "rgba(155, 75, 138, 0.15)",
                  color: "rgba(192, 132, 252, 0.8)"
                }}
              >
                <span>📋</span>
                <span>確認済みFAQ: {viewedFaqs.length}件</span>
              </div>
            )}

            <div>
              <label className="block text-sm mb-2" style={{ color: "rgba(232, 180, 200, 0.9)" }}>
                📝 お困りの内容を詳しく教えてください
              </label>
              <textarea
                value={inquiryText}
                onChange={(e) => setInquiryText(e.target.value)}
                placeholder="例: カード画像が保存できない、○○のエラーが出る..."
                className="w-full h-28 px-4 py-3 rounded-xl text-sm resize-none transition-all duration-200"
                style={{
                  background: "rgba(45, 16, 40, 0.8)",
                  border: "2px solid rgba(201, 75, 124, 0.3)",
                  color: "white",
                  outline: "none"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(201, 75, 124, 0.6)";
                  e.target.style.boxShadow = "0 0 20px rgba(201, 75, 124, 0.2)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(201, 75, 124, 0.3)";
                  e.target.style.boxShadow = "none";
                }}
                autoFocus
              />
            </div>

            {inquiryStatus === "error" && (
              <div
                className="p-3 rounded-xl text-sm text-center"
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#f87171"
                }}
              >
                ⚠️ 送信に失敗しました。もう一度お試しください。
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={backToCategories}
                className="flex-1 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: "rgba(45, 16, 40, 0.6)",
                  border: "1px solid rgba(201, 75, 124, 0.3)",
                  color: "rgba(232, 180, 200, 0.8)"
                }}
              >
                ← 戻る
              </button>
              <button
                onClick={submitInquiry}
                disabled={!inquiryText.trim() || inquiryStatus === "sending"}
                className="flex-1 py-3 rounded-xl text-white font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  background: inquiryText.trim() && inquiryStatus !== "sending"
                    ? "linear-gradient(135deg, #c94b7c 0%, #9b4b8a 100%)"
                    : "linear-gradient(135deg, #6b6b6b 0%, #4a4a4a 100%)",
                  boxShadow: inquiryText.trim() && inquiryStatus !== "sending"
                    ? "0 4px 15px rgba(201, 75, 124, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                    : "none"
                }}
              >
                {inquiryStatus === "sending" ? "⏳ 送信中..." : "📤 送信する"}
              </button>
            </div>
          </div>
        );

      case "inquiry_sent":
        return (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full overflow-hidden shadow-xl" style={{ boxShadow: "0 0 25px rgba(59, 130, 246, 0.5), 0 0 50px rgba(255, 165, 0, 0.3)" }}>
                <div className="w-full h-full border-3 border-blue-400/60 rounded-full overflow-hidden bg-gradient-to-br from-blue-200 to-indigo-200 p-0.5">
                  <Image src={RAS_IMAGES.happy} alt="RASくん" width={60} height={60} className="object-cover rounded-full" />
                </div>
              </div>
            </div>
            <div
              className="rounded-2xl p-5 shadow-xl"
              style={{
                background: "linear-gradient(135deg, rgba(255, 250, 248, 0.98) 0%, rgba(239, 246, 255, 0.98) 100%)",
                boxShadow: "0 4px 20px rgba(59, 130, 246, 0.15), 0 0 40px rgba(255, 200, 220, 0.1)"
              }}
            >
              <p className="text-5xl mb-3">✅</p>
              <p className="text-base font-bold mb-2 text-blue-600">お問い合わせを受け付けました</p>
              <p className="text-sm text-gray-600">
                サポート担当が確認次第、
                <br />
                ご連絡させていただきます。
                <br /><br />
                <span className="text-xs text-gray-500">しばらくお待ちください 🙏</span>
              </p>
            </div>
            <button
              onClick={toggleChat}
              className="w-full py-3.5 text-white rounded-xl font-bold shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #c94b7c 0%, #9b4b8a 100%)",
                boxShadow: "0 4px 15px rgba(201, 75, 124, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
              }}
            >
              閉じる ✨
            </button>
          </div>
        );

      case "free_chat":
        return (
          <div className="space-y-4">
            {/* メッセージ一覧 */}
            {messages.length === 0 && (
              <div className="flex gap-3 items-start">
                <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 shadow-lg" style={{ boxShadow: "0 0 12px rgba(255, 165, 0, 0.4)" }}>
                  <div className="w-full h-full border-2 border-orange-400/60 rounded-full overflow-hidden bg-gradient-to-br from-orange-200 to-pink-200 p-0.5">
                    <Image src={RAS_IMAGES.greeting} alt="RASくん" width={40} height={40} className="object-cover rounded-full" />
                  </div>
                </div>
                <div
                  className="flex-1 rounded-2xl rounded-tl-sm p-4 shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, rgba(255, 250, 248, 0.98) 0%, rgba(255, 245, 250, 0.98) 100%)",
                    boxShadow: "0 4px 15px rgba(201, 75, 124, 0.12)"
                  }}
                >
                  <p className="text-sm leading-relaxed text-gray-700">
                    何でも聞いてくださいね！ 💬✨
                  </p>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`flex gap-3 items-start ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                {message.role === "assistant" && (
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 shadow-lg" style={{ boxShadow: "0 0 10px rgba(255, 165, 0, 0.3)" }}>
                    <div className="w-full h-full border-2 border-orange-400/50 rounded-full overflow-hidden bg-gradient-to-br from-orange-200 to-pink-200 p-0.5">
                      <Image src={RAS_IMAGES[emotion]} alt="RASくん" width={36} height={36} className="object-cover rounded-full" />
                    </div>
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl p-3 shadow-lg ${
                    message.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"
                  }`}
                  style={message.role === "user" ? {
                    background: "linear-gradient(135deg, #c94b7c 0%, #9b4b8a 100%)",
                    color: "white",
                    boxShadow: "0 4px 12px rgba(201, 75, 124, 0.3)"
                  } : {
                    background: "linear-gradient(135deg, rgba(255, 250, 248, 0.98) 0%, rgba(255, 245, 250, 0.98) 100%)",
                    color: "#374151",
                    boxShadow: "0 4px 12px rgba(201, 75, 124, 0.1)"
                  }}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 shadow-lg" style={{ boxShadow: "0 0 10px rgba(255, 165, 0, 0.4)" }}>
                  <div className="w-full h-full border-2 border-orange-400/50 rounded-full overflow-hidden bg-gradient-to-br from-orange-200 to-pink-200 p-0.5">
                    <Image src={RAS_IMAGES.thinking} alt="RASくん" width={36} height={36} className="object-cover rounded-full" />
                  </div>
                </div>
                <div
                  className="rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, rgba(255, 250, 248, 0.98) 0%, rgba(255, 245, 250, 0.98) 100%)"
                  }}
                >
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ background: "#c94b7c", animationDelay: "0ms" }} />
                    <span className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ background: "#9b4b8a", animationDelay: "150ms" }} />
                    <span className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ background: "#7a4b9b", animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />

            {/* 入力エリア */}
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendFreeChatMessage();
                  }
                }}
                placeholder="メッセージを入力..."
                className="flex-1 px-4 py-3 rounded-xl text-sm resize-none transition-all duration-200"
                style={{
                  background: "rgba(45, 16, 40, 0.8)",
                  border: "2px solid rgba(201, 75, 124, 0.3)",
                  color: "white",
                  outline: "none"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(201, 75, 124, 0.6)";
                  e.target.style.boxShadow = "0 0 15px rgba(201, 75, 124, 0.2)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(201, 75, 124, 0.3)";
                  e.target.style.boxShadow = "none";
                }}
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={sendFreeChatMessage}
                disabled={!inputValue.trim() || isLoading}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                style={{
                  background: inputValue.trim() && !isLoading
                    ? "linear-gradient(135deg, #c94b7c 0%, #9b4b8a 100%)"
                    : "linear-gradient(135deg, #6b6b6b 0%, #4a4a4a 100%)",
                  boxShadow: inputValue.trim() && !isLoading
                    ? "0 4px 15px rgba(201, 75, 124, 0.4)"
                    : "none"
                }}
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>

            <button
              onClick={backToCategories}
              className="w-full py-2 text-xs transition-all duration-200 hover:translate-x-[-4px]"
              style={{ color: "rgba(192, 132, 252, 0.6)" }}
            >
              ← カテゴリ選択に戻る
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* フローティングボタン */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-50 w-18 h-18 rounded-full overflow-hidden ras-float ras-pulse-glow cursor-pointer transition-all duration-300 hover:scale-110 focus:outline-none"
        aria-label="オペレーターRASくんとチャット"
        style={{
          width: "72px",
          height: "72px",
          boxShadow: "0 0 25px rgba(255, 140, 0, 0.6), 0 0 50px rgba(255, 105, 180, 0.3), 0 8px 30px rgba(0, 0, 0, 0.4)"
        }}
      >
        <div className="relative w-full h-full bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center p-1">
          <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/40">
            <Image
              src={RAS_IMAGES.greeting}
              alt="RASくん"
              width={64}
              height={64}
              className="object-cover w-full h-full"
              priority
            />
          </div>
          {showSparkles && (
            <>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full animate-ping" style={{ animationDuration: "0.8s" }} />
              <span className="absolute bottom-0 -left-1 w-2.5 h-2.5 bg-pink-300 rounded-full animate-ping" style={{ animationDuration: "1s", animationDelay: "0.2s" }} />
              <span className="absolute top-1 left-0 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDuration: "1.2s", animationDelay: "0.4s" }} />
            </>
          )}
        </div>
        {/* ヘルプテキスト */}
        <div className="absolute -top-2 -left-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg animate-pulse">
          💬 質問
        </div>
      </button>

      {/* チャットウィンドウ */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-4 sm:right-6 z-50 w-[340px] sm:w-[380px] max-w-[calc(100vw-32px)] h-[520px] sm:h-[580px] max-h-[calc(100vh-150px)] flex flex-col rounded-3xl overflow-hidden"
          style={{
            boxShadow: "0 0 60px rgba(201, 75, 124, 0.4), 0 0 100px rgba(155, 75, 138, 0.2), 0 25px 50px rgba(0, 0, 0, 0.5)",
            border: "2px solid rgba(212, 165, 116, 0.4)"
          }}
        >
          {/* ヘッダー - よりリッチなデザイン */}
          <div
            className="relative flex items-center gap-3 p-4 text-white overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #c94b7c 0%, #9b4b8a 50%, #7a4b9b 100%)",
            }}
          >
            {/* 背景の装飾 */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-pink-300/10 rounded-full translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 ras-pulse-glow" style={{ boxShadow: "0 0 15px rgba(255, 165, 0, 0.6)" }}>
              <div className="w-full h-full border-2 border-white/60 rounded-full overflow-hidden bg-gradient-to-br from-orange-300 to-pink-400 p-0.5">
                <Image src={RAS_IMAGES[emotion]} alt="RASくん" width={52} height={52} className="object-cover rounded-full" />
              </div>
            </div>
            <div className="relative flex-1">
              <h3 className="font-bold text-lg drop-shadow-lg" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                ✨ オペレーターRASくん
              </h3>
              <p className="text-xs text-white/80 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                夢タイプ診断のサポーター
              </p>
            </div>
            <button
              onClick={toggleChat}
              className="relative w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 transition-all duration-200 hover:rotate-90"
              aria-label="チャットを閉じる"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* コンテンツエリア - 背景グラデーション強化 */}
          <div
            className="flex-1 overflow-y-auto p-4 relative"
            style={{
              background: "linear-gradient(180deg, #2d1028 0%, #1f0d1f 50%, #150a15 100%)",
            }}
          >
            {/* 背景のキラキラ効果 */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-10 left-5 w-1 h-1 bg-pink-400/40 rounded-full animate-pulse" />
              <div className="absolute top-20 right-10 w-1.5 h-1.5 bg-orange-300/30 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }} />
              <div className="absolute top-40 left-10 w-1 h-1 bg-purple-400/40 rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
              <div className="absolute bottom-20 right-5 w-1 h-1 bg-pink-300/30 rounded-full animate-pulse" style={{ animationDelay: "1.5s" }} />
            </div>

            <div className="relative z-10">
              {renderContent()}
            </div>
            <div ref={messagesEndRef} />
          </div>

          {/* フッター（フリーチャット切替） - より目立つデザイン */}
          {step !== "free_chat" && step !== "inquiry_sent" && step !== "faq_resolved" && (
            <div
              className="p-3 border-t"
              style={{
                background: "linear-gradient(180deg, #1f0d1f 0%, #150a15 100%)",
                borderColor: "rgba(201, 75, 124, 0.3)"
              }}
            >
              <button
                onClick={enableFreeChat}
                className="w-full py-2.5 text-xs rounded-xl transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, rgba(201, 75, 124, 0.15) 0%, rgba(155, 75, 138, 0.1) 100%)",
                  border: "1px solid rgba(201, 75, 124, 0.3)",
                  color: "rgba(232, 180, 200, 0.8)"
                }}
              >
                💬 自由にチャットで質問する（AI回答）
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
