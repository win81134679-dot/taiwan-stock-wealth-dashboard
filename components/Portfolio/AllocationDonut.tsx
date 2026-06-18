'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useStore } from '@/lib/store';
import { SECTOR_COLORS, SectorAllocation } from '@/lib/types';

export default function AllocationDonut() {
  const holdings = useStore((s) => s.holdings);

  const allocation = useMemo(() => {
    const sectorMap: Record<string, number> = {};
    let stockTotal = 0;

    Object.values(holdings).forEach((h) => {
      if (h.shares <= 0) return;
      const value = h.shares * (h.price || h.cost);
      sectorMap[h.sector] = (sectorMap[h.sector] || 0) + value;
      stockTotal += value;
    });

    const data: SectorAllocation[] = Object.entries(sectorMap)
      .map(([name, value]) => ({
        name,
        value,
        color: SECTOR_COLORS[name] || SECTOR_COLORS['其他'],
      }))
      .sort((a, b) => b.value - a.value);

    const legend = data.map((item) => ({
      ...item,
      pct: stockTotal > 0 ? ((item.value / stockTotal) * 100).toFixed(1) + '%' : '0%',
    }));

    const heldCount = Object.values(holdings).filter((h) => h.shares > 0).length;

    return { data, legend, heldCount };
  }, [holdings]);

  return (
    <div className="rounded-3xl border border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-[rgba(255,255,255,0.022)] to-transparent p-7">
      <div className="font-serif text-lg text-[#e8edf4] tracking-wide mb-5">資產配置</div>

      <div className="flex items-center gap-6">
        <div className="relative w-[158px] h-[158px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocation.data}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={74}
                paddingAngle={2}
                startAngle={90}
                endAngle={-270}
              >
                {allocation.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-xs text-[#aab6cc]">持股</div>
            <div className="font-serif text-3xl text-[#dbe2ee]">{allocation.heldCount}</div>
            <div className="text-xs text-[#aab6cc]">檔</div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-3">
          {allocation.legend.length === 0 ? (
            <div className="text-[13px] text-[#8d99af]">尚無持股,新增後顯示產業配置</div>
          ) : (
            allocation.legend.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: item.color }}
                ></span>
                <span className="text-sm text-[#b8c2d4] flex-1">{item.name}</span>
                <span className="font-mono font-medium text-sm text-[#aeb9cf] tabular-nums">{item.pct}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
