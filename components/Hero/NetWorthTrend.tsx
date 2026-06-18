'use client';

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useStore } from '@/lib/store';
import { generateSeries } from '@/lib/simulator';
import { COLOR } from '@/lib/types';
import { formatPercent, getColor } from '@/lib/calculator';

const TIME_RANGE_CONFIG = {
  '1D': { points: 80, vol: 0, trend: 0, labels: ['09:00', '10:30', '12:00', '13:30'] },
  '1W': { points: 70, vol: 0.004, trend: 0.025, labels: ['週一', '週二', '週三', '週四', '週五'] },
  '1M': { points: 80, vol: 0.008, trend: 0.05, labels: ['第1週', '第2週', '第3週', '第4週'] },
  '1Y': { points: 120, vol: 0.018, trend: 0.2, labels: ['1月', '4月', '7月', '10月', '12月'] },
};

export default function NetWorthTrend() {
  const { timeRange, setTimeRange, assetHistory, getPortfolioValue } = useStore();

  const data = useMemo(() => {
    const config = TIME_RANGE_CONFIG[timeRange];
    let series: number[];

    if (timeRange === '1D') {
      series = assetHistory.length >= 2 ? assetHistory : [getPortfolioValue(), getPortfolioValue()];
    } else {
      const currentValue = getPortfolioValue();
      series = generateSeries(config.points, currentValue, config.vol, config.trend);
    }

    const baseValue = series[0];
    return series.map((value, index) => ({
      index,
      value,
      pct: ((value / baseValue - 1) * 100).toFixed(2),
    }));
  }, [timeRange, assetHistory, getPortfolioValue]);

  const baseValue = data[0]?.value || 1;
  const currentValue = data[data.length - 1]?.value || 0;
  const returnPct = ((currentValue / baseValue - 1) * 100);
  const returnColor = getColor(returnPct, COLOR.UP, COLOR.DOWN, COLOR.FLAT);

  const labels = TIME_RANGE_CONFIG[timeRange].labels;

  return (
    <div className="rounded-3xl border border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-[rgba(255,255,255,0.022)] to-transparent p-7 flex flex-col">
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
              className={`font-mono font-medium text-[13.5px] px-3 py-1 rounded-full border-none cursor-pointer transition-all duration-250 ${
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

      <div className="flex-1 min-h-[248px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 14, right: 8, bottom: 24, left: 48 }}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(230,196,120,0.26)" />
                <stop offset="100%" stopColor="rgba(230,196,120,0)" />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.045)" vertical={false} />

            <XAxis
              dataKey="index"
              stroke="rgba(255,255,255,0.03)"
              tick={{ fill: '#8d99af', fontSize: 11, fontFamily: 'Noto Sans TC' }}
              tickLine={false}
              axisLine={false}
              ticks={labels.map((_, i) => Math.floor((data.length - 1) * (i / (labels.length - 1))))}
              tickFormatter={(index) => {
                const labelIndex = labels.findIndex(
                  (_, i) => Math.floor((data.length - 1) * (i / (labels.length - 1))) === index
                );
                return labelIndex !== -1 ? labels[labelIndex] : '';
              }}
            />

            <YAxis
              stroke="transparent"
              tick={{ fill: '#aab6cc', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                const pct = ((value / baseValue - 1) * 100);
                const sign = pct >= 0 ? '+' : '';
                return `${sign}${pct.toFixed(1)}%`;
              }}
              domain={['dataMin', 'dataMax']}
            />

            <ReferenceLine
              y={baseValue}
              stroke="rgba(230,196,120,0.5)"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: `${timeRange === '1D' ? '昨收' : '期初'} ${Math.round(baseValue).toLocaleString()}`,
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
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
