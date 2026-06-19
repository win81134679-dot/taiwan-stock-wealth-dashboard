'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { COLOR } from '@/lib/types';
import { formatPercent, formatSignedCurrency, getColor } from '@/lib/calculator';
import Header from '@/components/Layout/Header';
import NewsTicker from '@/components/Layout/NewsTicker';
import AssetRing from '@/components/Hero/AssetRing';
import NetWorthTrend from '@/components/Hero/NetWorthTrend';
import StatCard from '@/components/Stats/StatCard';
import PerformanceDots from '@/components/Stats/PerformanceDots';
import AllocationDonut from '@/components/Portfolio/AllocationDonut';
import HoldingsList from '@/components/Portfolio/HoldingsList';
import TradeModal from '@/components/Trade/TradeModal';
import BackupBar from '@/components/Layout/BackupBar';
import { useQuotes } from '@/lib/hooks/useQuotes';

export default function Home() {
  const getPortfolioValue = useStore((s) => s.getPortfolioValue);
  const getPortfolioCost = useStore((s) => s.getPortfolioCost);
  const stocks = useStore((s) => s.holdings);
  const cash = useStore((s) => s.cash);
  const realized = useStore((s) => s.realized);
  const lastUpdated = useStore((s) => s.lastUpdated);
  const loadFromCloud = useStore((s) => s.loadFromCloud);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 啟動時拉雲端持倉與每日快照(雲端為權威來源)
    loadFromCloud();
  }, [loadFromCloud]);

  // 真實報價輪詢(盤中 30 秒;只在 mounted 後啟動)
  const { status: marketStatus } = useQuotes();

  const stats = useMemo(() => {
    const totalValue = getPortfolioValue();
    const costBasis = getPortfolioCost();
    const pnl = totalValue - costBasis;
    const cumulativeReturn = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

    const dayPnl = Object.values(stocks).reduce((sum, h) => {
      const live = h.price || h.cost;
      const prev = h.prevClose || h.cost;
      return sum + h.shares * (live - prev);
    }, 0);

    const dayBase =
      Object.values(stocks).reduce((sum, h) => sum + h.shares * (h.prevClose || h.cost), 0) || 1;

    const dayPct = (dayPnl / dayBase) * 100;
    const cashPct = totalValue > 0 ? (cash / totalValue) * 100 : 0;

    return {
      totalValue,
      costBasis,
      pnl,
      cumulativeReturn,
      dayPnl,
      dayPct,
      cashPct,
      realized,
    };
    // lastUpdated 觸發重算(報價更新後)
  }, [getPortfolioValue, getPortfolioCost, stocks, cash, realized, lastUpdated]);

  const statCards = [
    {
      key: 'today',
      label: '今日損益率',
      value: formatPercent(stats.dayPct),
      valueColor: getColor(stats.dayPnl, COLOR.UP, COLOR.DOWN, COLOR.FLAT),
      badge: stats.dayPnl >= 0 ? '▲' : '▼',
      badgeColor: getColor(stats.dayPnl, COLOR.UP, COLOR.DOWN, COLOR.FLAT),
      ringFraction: Math.min(1, Math.abs(stats.dayPct) / 3),
      ringColor: getColor(stats.dayPnl, COLOR.UP, COLOR.DOWN, COLOR.FLAT),
      cardBg:
        stats.dayPnl >= 0
          ? 'linear-gradient(180deg, rgba(214,95,87,0.10), rgba(214,95,87,0))'
          : 'linear-gradient(180deg, rgba(63,174,132,0.10), rgba(63,174,132,0))',
      cardBorder: stats.dayPnl >= 0 ? 'rgba(214,95,87,0.24)' : 'rgba(63,174,132,0.24)',
    },
    {
      key: 'cumret',
      label: '累積報酬率',
      value: formatPercent(stats.cumulativeReturn),
      valueColor: '#e3c178',
      badge: Math.round(stats.cumulativeReturn) + '%',
      badgeColor: '#e3c178',
      ringFraction: Math.min(1, stats.cumulativeReturn / 30),
      ringColor: COLOR.BRASS,
      cardBg: 'linear-gradient(180deg, rgba(216,180,110,0.09), rgba(216,180,110,0))',
      cardBorder: 'rgba(216,180,110,0.22)',
    },
    {
      key: 'cash',
      label: '現金水位',
      value: stats.cashPct.toFixed(1) + '%',
      valueColor: '#aebcd2',
      badge: Math.round(stats.cashPct) + '%',
      badgeColor: '#9fb0c8',
      ringFraction: Math.min(1, stats.cashPct / 100),
      ringColor: '#6f93c0',
      cardBg: 'linear-gradient(180deg, rgba(255,255,255,0.022), rgba(255,255,255,0))',
      cardBorder: 'rgba(255,255,255,0.06)',
    },
    {
      key: 'realized',
      label: '已實現損益',
      value: formatSignedCurrency(stats.realized),
      valueColor: COLOR.DOWN,
      badge: '+',
      badgeColor: '#6fb89a',
      ringFraction: Math.min(1, stats.realized / 800000),
      ringColor: COLOR.DOWN,
      cardBg: 'linear-gradient(180deg, rgba(255,255,255,0.022), rgba(255,255,255,0))',
      cardBorder: 'rgba(255,255,255,0.06)',
    },
  ];

  if (!mounted) {
    return (
      <div className="relative overflow-hidden min-h-screen bg-[radial-gradient(140%_120%_at_50%_-20%,_#0f1a2c_0%,_#0a111d_55%,_#070c16_100%)]" />
    );
  }

  return (
    <div className="relative overflow-hidden min-h-screen bg-[radial-gradient(140%_120%_at_50%_-20%,_#0f1a2c_0%,_#0a111d_55%,_#070c16_100%)] px-4 py-5 sm:px-6 sm:py-8 lg:px-10 lg:py-12">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute right-[-110px] top-5 w-[540px] h-[540px] opacity-5">
          <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none">
            <path d="M12 2 L21 9 L12 22 L3 9 Z" stroke="#d9b86e" strokeWidth="0.4" strokeLinejoin="round" />
            <path d="M3 9 H21" stroke="#d9b86e" strokeWidth="0.3" />
            <path d="M8 9 L12 2 L16 9" stroke="#d9b86e" strokeWidth="0.3" />
            <path d="M8 9 L12 22 M16 9 L12 22" stroke="#d9b86e" strokeWidth="0.3" />
          </svg>
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(110%_80%_at_50%_116%,_rgba(0,0,0,0.45),_rgba(0,0,0,0)_58%)]"></div>
      </div>

      <div className="relative z-10 max-w-[1240px] mx-auto">
        <Header marketStatus={marketStatus} />

        <BackupBar />

        <div className="grid grid-cols-1 lg:grid-cols-[392px_1fr] gap-4 sm:gap-6 mb-4 sm:mb-6">
          <AssetRing
            totalValue={stats.totalValue}
            todayPnl={stats.dayPnl}
            todayPct={stats.dayPct}
            cumulativeReturn={stats.cumulativeReturn}
            costBasis={stats.costBasis}
          />
          <NetWorthTrend />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-6">
          {statCards.map((card) => {
            const { key, ...cardProps } = card;
            return <StatCard key={key} {...cardProps} />;
          })}
        </div>

        <PerformanceDots />

        <div className="grid grid-cols-1 lg:grid-cols-[392px_1fr] gap-4 sm:gap-6 mb-4 sm:mb-6">
          <AllocationDonut />
          <HoldingsList />
        </div>

        <NewsTicker />
      </div>

      <TradeModal />
    </div>
  );
}
