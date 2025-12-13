"use client";

import { Component, ReactNode } from "react";
import { motion } from "framer-motion";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    
    // エラータイプを判定
    let friendlyMessage = "予期しないエラーが発生しました。";
    
    if (error.message.includes("WebGL") || error.message.includes("THREE")) {
      friendlyMessage = "背景の描画に問題が発生しました。";
    } else if (error.message.includes("network") || error.message.includes("fetch")) {
      friendlyMessage = "ネットワーク接続に問題があります。";
    } else if (error.message.includes("quota") || error.message.includes("storage")) {
      friendlyMessage = "ストレージの空き容量が不足しています。";
    }

    this.setState({ errorInfo: friendlyMessage });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: "" });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-dream">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 max-w-md text-center"
          >
            <div className="text-6xl mb-4">😢</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              問題が発生しました
            </h2>
            <p className="text-purple-200 mb-6">
              {this.state.errorInfo}
              <br />
              <span className="text-sm text-purple-400">
                ページを再読み込みしてください
              </span>
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={this.handleRetry}
              className="btn-primary"
            >
              🔄 再読み込み
            </motion.button>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

























