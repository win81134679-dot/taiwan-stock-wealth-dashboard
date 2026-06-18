'use client';

import { useEffect, useState } from 'react';

export default function Header() {
  const [clock, setClock] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClock(now.toTimeString().slice(0, 8));
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-4 mb-10">
      <div className="w-11 h-11 rounded-full border border-[rgba(216,180,110,0.45)] flex items-center justify-center flex-shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="block">
          <defs>
            <linearGradient id="brz" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f4e3b8" />
              <stop offset="0.5" stopColor="#d9b86e" />
              <stop offset="1" stopColor="#a9854d" />
            </linearGradient>
          </defs>
          <path
            d="M12 2 L21 9 L12 22 L3 9 Z"
            fill="rgba(216,180,110,0.08)"
            stroke="url(#brz)"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path d="M3 9 H21" stroke="url(#brz)" strokeWidth="1" />
          <path d="M8 9 L12 2 L16 9" stroke="url(#brz)" strokeWidth="0.9" strokeLinejoin="round" />
          <path d="M8 9 L12 22 M16 9 L12 22" stroke="url(#brz)" strokeWidth="0.9" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="flex-1">
        <div className="font-serif font-normal text-2xl tracking-wider text-[#eef2f8]">資產總覽</div>
        <div className="text-[13px] tracking-[0.34em] text-[#5f6b80] mt-0.5">PRIVATE WEALTH ・ 台股</div>
      </div>

      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[rgba(255,255,255,0.08)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#3fae84] animate-breathe"></span>
        <span className="text-sm text-[#9aa6ba] tracking-wide">盤中</span>
      </div>

      <div className="font-mono font-medium text-[15px] text-[#aeb9cf] tabular-nums tracking-wide">{clock}</div>

      <div className="flex items-center gap-2 w-60 px-4 py-2 rounded-full border border-[rgba(216,180,110,0.28)] bg-[rgba(255,255,255,0.025)]">
        <span className="text-[#d8b86e] text-[15px]">⌕</span>
        <span className="text-[#8d99af] text-[13px]">搜尋台股代號 / 名稱</span>
      </div>
    </div>
  );
}
