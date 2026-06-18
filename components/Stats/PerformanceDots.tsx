'use client';

import { useStore } from '@/lib/store';
import { formatPercent, getColor } from '@/lib/calculator';
import { COLOR } from '@/lib/types';

export default function PerformanceDots() {
  const { daily30 } = useStore();

  const upDays = daily30.filter((r) => r >= 0).length;
  const downDays = 30 - upDays;
  const monthReturn = (daily30.reduce((acc, r) => acc * (1 + r / 100), 1) - 1) * 100;
  const monthColor = getColor(monthReturn, COLOR.UP, COLOR.DOWN, COLOR.FLAT);

  const dots = daily30.map((r) => {
    const up = r >= 0;
    const intensity = Math.min(1, Math.abs(r) / 2.6);
    const base = up ? [214, 95, 87] : [63, 174, 132];
    return {
      bg: `rgba(${base[0]},${base[1]},${base[2]},${0.14 + intensity * 0.7})`,
      bd: `rgba(${base[0]},${base[1]},${base[2]},${0.3 + intensity * 0.4})`,
    };
  });

  return (
    <div className="rounded-3xl border border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-[rgba(255,255,255,0.022)] to-transparent p-6 mb-6">
      <div className="flex justify-between items-center mb-5">
        <div className="font-serif text-lg text-[#e8edf4] tracking-wide">近 30 日績效</div>

        <div className="flex items-center gap-5 text-[13px] text-[#aab6cc]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#d65f57]"></span>上漲 {upDays} 天
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#3fae84]"></span>下跌 {downDays} 天
          </span>
          <span>
            月報酬{' '}
            <span className="font-mono font-medium" style={{ color: monthColor }}>
              {formatPercent(monthReturn)}
            </span>
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center">
        {dots.map((dot, i) => (
          <div
            key={i}
            className="w-[30px] h-[30px] flex-shrink-0 rounded-full border"
            style={{
              background: dot.bg,
              borderColor: dot.bd,
            }}
          ></div>
        ))}
      </div>
    </div>
  );
}
