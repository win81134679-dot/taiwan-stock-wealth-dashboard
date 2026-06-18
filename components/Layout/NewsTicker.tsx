'use client';

import { useEffect, useState } from 'react';
import { fetchNews, ClientNews } from '@/lib/yahoo-client';

export default function NewsTicker() {
  const [news, setNews] = useState<ClientNews[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const items = await fetchNews();
        if (!cancelled && items.length > 0) setNews(items);
      } catch {
        // 靜默失敗,顯示 fallback
      }
    };
    load();
    const interval = setInterval(load, 300_000); // 5 分鐘更新
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const display = news.length > 0 ? news : [{ title: '載入即時台股新聞中…', link: '' }];
  const newsLoop = [...display, ...display];

  return (
    <div className="flex items-center gap-4 px-6 py-3.5 rounded-full border border-[rgba(255,255,255,0.06)] overflow-hidden">
      <span className="flex-shrink-0 flex items-center gap-2 text-[13.5px] tracking-[0.16em] text-[#e3c178]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#e3c178]"></span>
        快訊
      </span>

      <div className="flex-1 overflow-hidden whitespace-nowrap">
        <div className="inline-flex gap-12 animate-marquee">
          {newsLoop.map((item, i) =>
            item.link ? (
              <a
                key={i}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#a3afc4] hover:text-[#e3c178] transition-colors"
              >
                {item.title}
              </a>
            ) : (
              <span key={i} className="text-sm text-[#a3afc4]">
                {item.title}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}
