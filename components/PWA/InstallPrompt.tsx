'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 監聽 PWA 安裝提示
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // 延遲 3 秒再顯示,讓使用者先看到主畫面
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // 檢查是否已安裝
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // 7 天後再提示
    localStorage.setItem('pwa-dismissed', Date.now().toString());
  };

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-dismissed');
    if (dismissed) {
      const daysSince = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) {
        setShowPrompt(false);
      }
    }
  }, []);

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[380px] z-50 animate-slide-up">
      <div className="rounded-2xl border border-[rgba(255,255,255,0.1)] bg-gradient-to-b from-[rgba(255,255,255,0.05)] to-[rgba(255,255,255,0.02)] backdrop-blur-xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#d8b46e] to-[#b8945a] flex items-center justify-center flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M19 9l-7 7-7-7"
                stroke="#0f1419"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[15px] text-[#e8edf4] mb-1">安裝到主畫面</div>
            <div className="text-[13px] text-[#aab6cc] leading-relaxed mb-3">
              一鍵啟動,更快追蹤台股資產。支援離線瀏覽與通知。
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 px-4 py-2 rounded-lg bg-[rgba(216,180,110,0.16)] hover:bg-[rgba(216,180,110,0.22)] text-[#edd49c] font-medium text-[13px] transition-colors"
              >
                安裝
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 rounded-lg bg-transparent hover:bg-[rgba(255,255,255,0.05)] text-[#8d99af] text-[13px] transition-colors"
              >
                稍後
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
