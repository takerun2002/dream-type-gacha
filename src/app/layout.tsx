import type { Metadata } from "next";
import { Noto_Sans_JP, Zen_Maru_Gothic } from "next/font/google";
import "./globals.css";
import RASChatBotWrapper from "@/components/RASChatBotWrapper";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const zenMaruGothic = Zen_Maru_Gothic({
  variable: "--font-zen-maru",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "夢タイプ診断ガチャ | Date with Dream Note",
  description: "あなたの夢タイプを診断して、パーソナライズされた鑑定書をお届けします。きんまん先生の引き寄せノート講座特典。",
  keywords: ["夢タイプ診断", "引き寄せノート", "きんまん", "鑑定書"],
  openGraph: {
    title: "夢タイプ診断ガチャ",
    description: "あなたの夢タイプを診断しよう！",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${notoSansJP.variable} ${zenMaruGothic.variable} antialiased bg-gradient-dream min-h-screen`}
      >
        {children}
        <RASChatBotWrapper />
      </body>
    </html>
  );
}
