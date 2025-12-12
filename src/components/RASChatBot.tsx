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
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-orange-400/50">
                <Image src={RAS_IMAGES.greeting} alt="RASくん" width={40} height={40} className="object-cover" />
              </div>
              <div className="flex-1 bg-white/95 rounded-2xl rounded-tl-sm p-3 text-gray-800 shadow-lg">
                <p className="text-sm leading-relaxed">
                  こんにちは！オペレーターRASくんです。
                  <br /><br />
                  どのようなことでお困りですか？
                  <br />
                  下のボタンから選んでください。
                </p>
              </div>
            </div>
            <button
              onClick={() => setStep("category_select")}
              className="w-full py-3 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:opacity-90 transition-opacity"
            >
              質問カテゴリを選ぶ
            </button>
          </div>
        );

      case "category_select":
        return (
          <div className="space-y-3">
            <div className="flex gap-3 mb-4">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-orange-400/50">
                <Image src={RAS_IMAGES.explaining} alt="RASくん" width={40} height={40} className="object-cover" />
              </div>
              <div className="flex-1 bg-white/95 rounded-2xl rounded-tl-sm p-3 text-gray-800 shadow-lg">
                <p className="text-sm leading-relaxed">
                  どんなことでお困りですか？
                </p>
              </div>
            </div>

            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => selectCategory(category)}
                className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 border border-orange-400/30 rounded-xl text-white text-left flex items-center gap-3 transition-colors"
              >
                <span className="text-xl">{category.icon}</span>
                <span className="text-sm">{category.label}</span>
              </button>
            ))}

            <button
              onClick={selectOther}
              className="w-full py-3 px-4 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-400/50 rounded-xl text-orange-300 text-left flex items-center gap-3 transition-colors"
            >
              <span className="text-xl">❓</span>
              <span className="text-sm">その他（上記に該当しない）</span>
            </button>
          </div>
        );

      case "faq_display":
        if (!selectedCategory) return null;
        const currentFaq = selectedCategory.faqs[currentFaqIndex];

        return (
          <div className="space-y-4">
            {/* カテゴリ表示 */}
            <div className="flex items-center gap-2 text-orange-300 text-sm">
              <span>{selectedCategory.icon}</span>
              <span>{selectedCategory.label}</span>
              <span className="text-orange-400/60">({currentFaqIndex + 1}/{selectedCategory.faqs.length})</span>
            </div>

            {/* FAQ */}
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-orange-400/50">
                <Image src={RAS_IMAGES.explaining} alt="RASくん" width={40} height={40} className="object-cover" />
              </div>
              <div className="flex-1 bg-white/95 rounded-2xl rounded-tl-sm p-4 text-gray-800 shadow-lg">
                <p className="font-bold text-sm mb-2 text-orange-600">
                  Q. {currentFaq.question}
                </p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {currentFaq.answer}
                </p>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="space-y-2">
              <p className="text-center text-purple-300/80 text-xs">この回答で解決しましたか？</p>
              <div className="flex gap-2">
                <button
                  onClick={faqResolved}
                  className="flex-1 py-3 bg-green-500/30 hover:bg-green-500/50 border border-green-400/50 rounded-xl text-green-300 font-medium transition-colors"
                >
                  解決した
                </button>
                <button
                  onClick={showNextFaq}
                  className="flex-1 py-3 bg-orange-500/30 hover:bg-orange-500/50 border border-orange-400/50 rounded-xl text-orange-300 font-medium transition-colors"
                >
                  {currentFaqIndex < selectedCategory.faqs.length - 1 ? "他の回答を見る" : "問い合わせる"}
                </button>
              </div>
              <button
                onClick={backToCategories}
                className="w-full py-2 text-purple-400/60 text-xs hover:text-purple-300 transition-colors"
              >
                ← カテゴリ選択に戻る
              </button>
            </div>
          </div>
        );

      case "faq_resolved":
        return (
          <div className="space-y-4 text-center">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-orange-400/50 mx-auto">
                <Image src={RAS_IMAGES.happy} alt="RASくん" width={40} height={40} className="object-cover" />
              </div>
            </div>
            <div className="bg-white/95 rounded-2xl p-4 text-gray-800 shadow-lg">
              <p className="text-4xl mb-2">🎉</p>
              <p className="text-sm font-bold mb-2">よかったです！</p>
              <p className="text-xs text-gray-600">
                他にお困りのことがあれば、
                <br />
                いつでもお声がけくださいね。
              </p>
            </div>
            <button
              onClick={backToCategories}
              className="w-full py-3 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:opacity-90 transition-opacity"
            >
              他の質問をする
            </button>
            <button
              onClick={toggleChat}
              className="w-full py-2 text-purple-400/60 text-sm hover:text-purple-300 transition-colors"
            >
              閉じる
            </button>
          </div>
        );

      case "inquiry_form":
        return (
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-orange-400/50">
                <Image src={RAS_IMAGES.apologize} alt="RASくん" width={40} height={40} className="object-cover" />
              </div>
              <div className="flex-1 bg-white/95 rounded-2xl rounded-tl-sm p-3 text-gray-800 shadow-lg">
                <p className="text-sm leading-relaxed">
                  申し訳ありません、お力になれず...
                  <br /><br />
                  サポート担当に直接お問い合わせください。
                  <br />
                  できるだけ早くご対応いたします。
                </p>
              </div>
            </div>

            {userInfo && (
              <div className="p-3 bg-white/5 rounded-lg text-sm">
                <p className="text-purple-300/80">
                  <span className="text-purple-400">お名前:</span> {userInfo.name}
                </p>
                <p className="text-purple-300/80">
                  <span className="text-purple-400">夢タイプ:</span> {userInfo.dreamType}
                </p>
              </div>
            )}

            {viewedFaqs.length > 0 && (
              <div className="p-2 bg-purple-900/30 rounded-lg text-xs text-purple-400/60">
                確認済みFAQ: {viewedFaqs.length}件
              </div>
            )}

            <div>
              <label className="block text-purple-300/80 text-sm mb-2">
                お困りの内容を詳しく教えてください
              </label>
              <textarea
                value={inquiryText}
                onChange={(e) => setInquiryText(e.target.value)}
                placeholder="例: カード画像が保存できない、○○のエラーが出る..."
                className="w-full h-28 px-4 py-3 rounded-lg bg-white/10 border border-orange-400/30 text-white placeholder-white/30 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 text-sm resize-none"
                autoFocus
              />
            </div>

            {inquiryStatus === "error" && (
              <p className="text-red-400 text-sm text-center">
                送信に失敗しました。もう一度お試しください。
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={backToCategories}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-purple-300 font-medium transition-colors"
              >
                戻る
              </button>
              <button
                onClick={submitInquiry}
                disabled={!inquiryText.trim() || inquiryStatus === "sending"}
                className="flex-1 py-3 bg-gradient-to-r from-orange-400 to-pink-500 hover:opacity-90 rounded-xl text-white font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {inquiryStatus === "sending" ? "送信中..." : "送信する"}
              </button>
            </div>
          </div>
        );

      case "inquiry_sent":
        return (
          <div className="space-y-4 text-center">
            <div className="flex gap-3 justify-center">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-orange-400/50">
                <Image src={RAS_IMAGES.happy} alt="RASくん" width={40} height={40} className="object-cover" />
              </div>
            </div>
            <div className="bg-white/95 rounded-2xl p-4 text-gray-800 shadow-lg">
              <p className="text-4xl mb-2">✅</p>
              <p className="text-sm font-bold mb-2">お問い合わせを受け付けました</p>
              <p className="text-xs text-gray-600">
                サポート担当が確認次第、
                <br />
                ご連絡させていただきます。
                <br /><br />
                しばらくお待ちください。
              </p>
            </div>
            <button
              onClick={toggleChat}
              className="w-full py-3 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:opacity-90 transition-opacity"
            >
              閉じる
            </button>
          </div>
        );

      case "free_chat":
        return (
          <div className="space-y-4">
            {/* メッセージ一覧 */}
            {messages.length === 0 && (
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-orange-400/50">
                  <Image src={RAS_IMAGES.greeting} alt="RASくん" width={40} height={40} className="object-cover" />
                </div>
                <div className="flex-1 bg-white/95 rounded-2xl rounded-tl-sm p-3 text-gray-800 shadow-lg">
                  <p className="text-sm leading-relaxed">
                    何でも聞いてくださいね！
                  </p>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                {message.role === "assistant" && (
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-orange-400/50">
                    <Image src={RAS_IMAGES[emotion]} alt="RASくん" width={40} height={40} className="object-cover" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl p-3 shadow-lg ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-tr-sm"
                    : "bg-white/95 text-gray-800 rounded-tl-sm"
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-orange-400/50">
                  <Image src={RAS_IMAGES.thinking} alt="RASくん" width={40} height={40} className="object-cover" />
                </div>
                <div className="bg-white/95 rounded-2xl rounded-tl-sm p-3 shadow-lg">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />

            {/* 入力エリア */}
            <div className="flex gap-2">
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
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-orange-400/30 text-white placeholder-white/50 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 text-sm resize-none"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={sendFreeChatMessage}
                disabled={!inputValue.trim() || isLoading}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>

            <button
              onClick={backToCategories}
              className="w-full py-2 text-purple-400/60 text-xs hover:text-purple-300 transition-colors"
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
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full overflow-hidden ras-float ras-pulse-glow cursor-pointer transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-orange-400/50"
        aria-label="オペレーターRASくんとチャット"
      >
        <div className="relative w-full h-full bg-gradient-to-br from-orange-400 via-orange-500 to-pink-500 flex items-center justify-center">
          <Image
            src={RAS_IMAGES.greeting}
            alt="RASくん"
            width={56}
            height={56}
            className="object-cover rounded-full"
            priority
          />
          {showSparkles && (
            <>
              <span className="absolute top-0 right-0 w-2 h-2 bg-yellow-300 rounded-full animate-ping" />
              <span className="absolute bottom-2 left-0 w-1.5 h-1.5 bg-pink-300 rounded-full animate-ping delay-150" />
              <span className="absolute top-2 left-2 w-1 h-1 bg-white rounded-full animate-ping delay-300" />
            </>
          )}
        </div>
      </button>

      {/* チャットウィンドウ */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] h-[550px] max-h-[calc(100vh-150px)] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-orange-400/30">
          {/* ヘッダー */}
          <div
            className="relative flex items-center gap-3 p-4 text-white"
            style={{
              background: "linear-gradient(135deg, #ff8c00 0%, #ff6347 50%, #ff69b4 100%)",
            }}
          >
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/50 bg-white/20 flex-shrink-0">
              <Image src={RAS_IMAGES[emotion]} alt="RASくん" width={48} height={48} className="object-cover" />
            </div>
            <div className="relative flex-1">
              <h3 className="font-bold text-lg drop-shadow-md">オペレーターRASくん</h3>
              <p className="text-xs opacity-90">夢タイプ診断のサポーター</p>
            </div>
            <button
              onClick={toggleChat}
              className="relative w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              aria-label="チャットを閉じる"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* コンテンツエリア */}
          <div
            className="flex-1 overflow-y-auto p-4"
            style={{
              background: "linear-gradient(180deg, #2d1028 0%, #1a0a1a 100%)",
            }}
          >
            {renderContent()}
            <div ref={messagesEndRef} />
          </div>

          {/* フッター（フリーチャット切替） */}
          {step !== "free_chat" && step !== "inquiry_sent" && step !== "faq_resolved" && (
            <div className="p-2 bg-gradient-to-r from-[#2d1028] to-[#1a0a1a] border-t border-orange-400/20">
              <button
                onClick={enableFreeChat}
                className="w-full py-2 text-xs text-purple-400/50 hover:text-purple-300 transition-colors"
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
