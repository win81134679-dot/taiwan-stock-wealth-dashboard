'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { fetchQuotes } from '@/lib/yahoo-client';

const POLL_INTERVAL = 30_000; // 盤中 30 秒
const CLOSED_INTERVAL = 300_000; // 收盤後 5 分鐘抓一次(更新昨收即可)

export type MarketStatus = 'pre' | 'open' | 'closed';

// 台股交易時間判斷(台北時區 09:00-13:30,週一至週五)
export function getMarketStatus(): MarketStatus {
  const now = new Date();
  const taipei = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
  const day = taipei.getDay(); // 0=日 6=六
  if (day === 0 || day === 6) return 'closed';

  const minutes = taipei.getHours() * 60 + taipei.getMinutes();
  const openMin = 9 * 60; // 09:00
  const closeMin = 13 * 60 + 30; // 13:30

  if (minutes < openMin) return 'pre';
  if (minutes <= closeMin) return 'open';
  return 'closed';
}

export function useQuotes() {
  const holdings = useStore((s) => s.holdings);
  const applyQuotes = useStore((s) => s.applyQuotes);
  const recordNav = useStore((s) => s.recordNav);
  const [status, setStatus] = useState<MarketStatus>('closed');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const codes = Object.keys(holdings);
  const codesKey = codes.join(',');

  const poll = useCallback(async () => {
    const currentCodes = Object.keys(useStore.getState().holdings);
    if (currentCodes.length === 0) {
      recordNav();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const quotes = await fetchQuotes(currentCodes);
      if (quotes.length > 0) {
        applyQuotes(quotes);
        // 只在成功取得報價後才記錄淨值;失敗的輪詢不寫入,避免曲線跳動
        recordNav();
      } else {
        setError('報價暫時無法取得');
      }
    } catch {
      setError('報價暫時無法取得');
    } finally {
      setLoading(false);
    }
  }, [applyQuotes, recordNav]);

  useEffect(() => {
    let cancelled = false;

    const scheduleNext = () => {
      const market = getMarketStatus();
      if (!cancelled) setStatus(market);
      const interval = market === 'open' ? POLL_INTERVAL : CLOSED_INTERVAL;
      timerRef.current = setTimeout(run, interval);
    };

    const run = async () => {
      if (cancelled) return;
      await poll();
      scheduleNext();
    };

    // 立即抓一次
    run();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codesKey, poll]);

  return { status, loading, error, refresh: poll };
}
