'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { formatPercent, getColor } from '@/lib/calculator';
import { COLOR } from '@/lib/types';
import { getDailyChanges } from '@/lib/snapshots';

export default function PerformanceDots() {
  const snapshots = useStore((s) => s.snapshots);

  const { dots, upDays, downDays, monthReturn } = useMemo(() => {
    const changes = getDailyChanges(snapshots, 30);
    const up = changes.filter((c) => c.changePct >= 0).length;
    const down = changes.length - up;
    const month = (changes.reduce((acc, c) => acc * (1 + c.changePct / 100), 1) - 1) * 100;

    const d = changes.map((c) => {
      const isUp = c.changePct >= 0;
      const intensity = Math.min(1, Math.abs(c.changePct) / 2.6);
      const base = isUp ? [214, 95, 87] : [63, 174, 132];
      return {
        bg: `rgba(${base[0]},${base[1]},${base[2]},${0.14 + intensity * 0.7})`,
        bd: `rgba(${base[0]},${base[1]},${base[2]},${0.3 + intensity * 0.4})`,
      };
    });

    return { dots: d, upDays: up, downDays: down, monthReturn: month };
  }, [snapshots]);

  const monthColor = getColor(monthReturn, COLOR.UP, COLOR.DOWN, COLOR.FLAT);
  // 不足 30 天時補空位佔位,維持版面
  const placeholders = Math.max(0, 30 - dots.length);

  return (
    <div className="rounded-3xl border border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-[rgba(255,255,255,0.022)] to-transparent p-4 sm:p-6 mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-4 sm:mb-5">
        <div className="font-serif text-lg text-[#e8edf4] tracking-wide">
          近 30 日績效
          {dots.length < 30 && (
            <span className="text-[12px] text-[#6f7a8f] ml-2 font-sans">(已累積 {dots.length} 天)</span>
          )}
        </div>

        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 sm:gap-5 text-[12px] sm:text-[13px] text-[#aab6cc]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#d65f57]"></span>上漲 {upDays} 天
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#3fae84]"></span>下跌 {downDays} 天
          </span>
          <span>
            月報酬{' '}
            <span className="font-mono font-medium" style={{ color: monthColor }}>
              {dots.length > 0 ? formatPercent(monthReturn) : '—'}
            </span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-[2px] sm:gap-1.5">
        {dots.map((dot, i) => (
          <div
            key={i}
            className="flex-1 max-w-[30px] aspect-square rounded-full border"
            style={{ background: dot.bg, borderColor: dot.bd }}
          ></div>
        ))}
        {Array.from({ length: placeholders }).map((_, i) => (
          <div
            key={`ph-${i}`}
            className="flex-1 max-w-[30px] aspect-square rounded-full border border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.015)]"
          ></div>
        ))}
      </div>
    </div>
  );
}
