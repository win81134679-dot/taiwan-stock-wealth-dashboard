'use client';

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useStore } from '@/lib/store';
import { COLOR } from '@/lib/types';
import { formatPercent, getColor } from '@/lib/calculator';

const RANGE_DAYS: Record<string, number> = {
  '1D': 0,
  '1W': 5,
  '1M': 22,
  '1Y': 250,
};

export default function NetWorthTrend() {
  const timeRange = useStore((s) => s.timeRange);
  const setTimeRange = useStore((s) => s.setTimeRange);
  const intradayNav = useStore((s) => s.intradayNav);
  const snapshots = useStore((s) => s.snapshots);

  const { data, baseValue, dataNote } = useMemo(() => {
    if (timeRange === '1D') {
      const series = intradayNav.length >= 2 ? intradayNav : intradayNav;
      const base = series[0] ?? 0;
      return {
        data: series.map((value, index) => ({ index, value })),
        baseValue: base,
        dataNote: series.length < 2 ? '盤中淨值累積中…' : '',
      };
    }

    // 1W/1M/1Y 用每日快照
    const days = RANGE_DAYS[timeRange];
    const sliced = snapshots.slice(-days);
    const base = sliced[0]?.value ?? 0;
    const note =
      sliced.length < 2
        ? '每日淨值累積中,持續使用即會長出走勢'
        : sliced.length < days
        ? `資料自 ${sliced[0]?.date} 起累積,共 ${sliced.length} 天`
        : '';
    return {
      data: sliced.map((s, index) => ({ index, value: s.value, date: s.date })),
      baseValue: base,
      dataNote: note,
    };
  }, [timeRange, intradayNav, snapshots]);

  const currentValue = data[data.length - 1]?.value ?? 0;
  const returnPct = baseValue > 0 ? (currentValue / baseValue - 1) * 100 : 0;
  const returnColor = getColor(returnPct, COLOR.UP, COLOR.DOWN, COLOR.FLAT);
  const hasData = data.length >= 2;

  return (
    <div className="rounded-3xl border border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-[rgba(255,255,255,0.022)] to-transparent p-4 sm:p-7 flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <div>
          <div className="font-serif text-lg text-[#e8edf4] tracking-wide">淨值走勢</div>
          <div className="text-[13.5px] text-[#aab6cc] mt-1">
            區間報酬{' '}
            <span className="font-mono" style={{ color: returnColor }}>
              {formatPercent(returnPct)}
            </span>
          </div>
        </div>

        <div className="flex gap-1 p-1 rounded-full border border-[rgba(255,255,255,0.07)]">
          {(['1D', '1W', '1M', '1Y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`font-mono font-medium text-[13.5px] px-3 py-1 rounded-full border-none cursor-pointer transition-all ${
                timeRange === range
                  ? 'bg-[rgba(216,180,110,0.16)] text-[#edd49c]'
                  : 'bg-transparent text-[#a8b4ca]'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[248px] relative">
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center text-[13px] text-[#8d99af] text-center px-4">
            {dataNote || '尚無淨值資料,新增持股後開始累積'}
          </div>
        )}
        {hasData && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 14, right: 8, bottom: 14, left: 48 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(230,196,120,0.26)" />
                  <stop offset="100%" stopColor="rgba(230,196,120,0)" />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.045)" vertical={false} />

              <XAxis dataKey="index" hide />

              <YAxis
                stroke="transparent"
                tick={{ fill: '#aab6cc', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                  const pct = baseValue > 0 ? (value / baseValue - 1) * 100 : 0;
                  const sign = pct >= 0 ? '+' : '';
                  return `${sign}${pct.toFixed(1)}%`;
                }}
                domain={['dataMin', 'dataMax']}
                width={44}
              />

              <ReferenceLine
                y={baseValue}
                stroke="rgba(230,196,120,0.5)"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{
                  value: `${timeRange === '1D' ? '今日起點' : '期初'} ${Math.round(baseValue).toLocaleString()}`,
                  position: 'insideTopLeft',
                  fill: '#f0d79a',
                  fontSize: 10,
                  fontFamily: 'IBM Plex Mono',
                  offset: 10,
                }}
              />

              <Area
                type="monotone"
                dataKey="value"
                stroke={COLOR.BRASS}
                strokeWidth={2.2}
                fill="url(#areaGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#f4e3b8', stroke: 'rgba(230,196,120,0.5)', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {hasData && dataNote && (
        <div className="text-[11px] text-[#6f7a8f] mt-1 text-right">{dataNote}</div>
      )}
    </div>
  );
}
