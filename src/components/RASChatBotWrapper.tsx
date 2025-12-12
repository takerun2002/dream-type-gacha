"use client";

import dynamic from "next/dynamic";

const RASChatBot = dynamic(() => import("./RASChatBot"), {
  ssr: false,
  loading: () => null,
});

export default function RASChatBotWrapper() {
  return <RASChatBot />;
}
