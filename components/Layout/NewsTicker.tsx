'use client';

import { NewsItem } from '@/lib/types';

const NEWS: NewsItem[] = [
  { tag: '2330', text: '台積電 AI 需求強勁，外資調升目標價' },
  { tag: '盤勢', text: '加權指數量縮收紅，權值股撐盤' },
  { tag: '外資', text: '外資連三日買超，偏多操作' },
  { tag: '2454', text: '聯發科旗艦晶片出貨優於預期' },
  { tag: '2308', text: '台達電電源管理訂單能見度看至明年' },
  { tag: '政策', text: '央行理監事會維持利率不變' },
];

export default function NewsTicker() {
  const newsLoop = [...NEWS, ...NEWS];

  return (
    <div className="flex items-center gap-4 px-6 py-3.5 rounded-full border border-[rgba(255,255,255,0.06)] overflow-hidden">
      <span className="flex-shrink-0 flex items-center gap-2 text-[13.5px] tracking-[0.16em] text-[#e3c178]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#e3c178]"></span>
        快訊
      </span>

      <div className="flex-1 overflow-hidden whitespace-nowrap">
        <div className="inline-flex gap-12 animate-marquee">
          {newsLoop.map((item, i) => (
            <span key={i} className="text-sm text-[#a3afc4]">
              <span className="font-mono text-[#a8b4ca] mr-2">{item.tag}</span>
              {item.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
