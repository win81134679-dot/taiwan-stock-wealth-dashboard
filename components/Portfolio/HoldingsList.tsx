'use client';

import { useMemo, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { COLOR } from '@/lib/types';
import { formatCurrency, formatPercent, formatSignedCurrency, getColor, hexToRgba } from '@/lib/calculator';

function SparklineCanvas({ history, code }: { history: number[]; code: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !history || history.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = 62;
    const h = 30;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    const pad = 3;
    let min = Infinity;
    let max = -Infinity;
    history.forEach((v) => {
      if (v < min) min = v;
      if (v > max) max = v;
    });
    if (min === max) {
      min -= 1;
      max += 1;
    }

    const X = (i: number) => pad + (w - 2 * pad) * (i / (history.length - 1));
    const Y = (v: number) => pad + (h - 2 * pad) * (1 - (v - min) / (max - min));

    const color = history[history.length - 1] >= history[0] ? COLOR.UP : COLOR.DOWN;

    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, hexToRgba(color, 0.22));
    gradient.addColorStop(1, hexToRgba(color, 0));

    ctx.beginPath();
    ctx.moveTo(X(0), Y(history[0]));
    for (let i = 1; i < history.length; i++) {
      ctx.lineTo(X(i), Y(history[i]));
    }
    ctx.lineTo(X(history.length - 1), h - pad);
    ctx.lineTo(X(0), h - pad);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(X(0), Y(history[0]));
    for (let i = 1; i < history.length; i++) {
      ctx.lineTo(X(i), Y(history[i]));
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.lineJoin = 'round';
    ctx.stroke();

    const ex = X(history.length - 1);
    const ey = Y(history[history.length - 1]);
    ctx.beginPath();
    ctx.arc(ex, ey, 1.9, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }, [history, code]);

  return <canvas ref={canvasRef} width={62} height={30} className="w-[62px] h-[30px] flex-shrink-0 block" />;
}

function RingCanvas({ fraction, code }: { fraction: number; code: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = 42;
    const h = 42;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const R = w / 2 - 6;

    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = COLOR.TRACK;
    ctx.stroke();

    if (fraction > 0.001) {
      ctx.beginPath();
      ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fraction);
      ctx.strokeStyle = COLOR.BRASS;
      ctx.stroke();
    }
  }, [fraction, code]);

  return <canvas ref={canvasRef} width={42} height={42} className="w-[42px] h-[42px] block" />;
}

export default function HoldingsList() {
  const stocks = useStore((s) => s.holdings);
  const openNewHolding = useStore((s) => s.openNewHolding);
  const openModal = useStore((s) => s.openModal);
  const closePosition = useStore((s) => s.closePosition);
  const getPortfolioValue = useStore((s) => s.getPortfolioValue);

  const holdings = useMemo(() => {
    const totalValue = getPortfolioValue();

    return Object.values(stocks)
      .filter((s) => s.shares > 0)
      .map((stock) => {
        const livePrice = stock.price || stock.cost;
        const prev = stock.prevClose || stock.cost;
        const change = livePrice - prev;
        const changePct = prev > 0 ? (change / prev) * 100 : 0;
        const value = stock.shares * livePrice;
        const pnl = stock.shares * (livePrice - stock.cost);
        const weight = totalValue > 0 ? (value / totalValue) * 100 : 0;
        const weightFrac = Math.min(1, weight / 60);

        return {
          code: stock.code,
          name: stock.name,
          price: livePrice.toFixed(2),
          changePct: formatPercent(changePct),
          changeColor: getColor(change, COLOR.UP, COLOR.DOWN, COLOR.FLAT),
          value: formatCurrency(value),
          pnl: formatSignedCurrency(pnl),
          pnlColor: getColor(pnl, COLOR.UP, COLOR.DOWN, COLOR.FLAT),
          weight: Math.round(weight).toString(),
          weightFrac,
          history: stock.intraday && stock.intraday.length > 1 ? stock.intraday : [stock.cost, livePrice],
        };
      })
      .sort((a, b) => parseFloat(b.weight) - parseFloat(a.weight));
  }, [stocks, getPortfolioValue]);

  return (
    <div className="rounded-3xl border border-[rgba(255,255,255,0.06)] bg-gradient-to-b from-[rgba(255,255,255,0.022)] to-transparent p-7">
      <div className="flex justify-between items-center mb-4">
        <span className="font-serif text-lg text-[#e8edf4] tracking-wide">持倉明細</span>
        <div className="flex items-center gap-3">
          <span className="text-[13.5px] text-[#a8b4ca]">依權重</span>
          <button
            onClick={openNewHolding}
            className="flex items-center gap-1 px-4 py-1.5 rounded-full border border-[rgba(216,180,110,0.42)] bg-[rgba(216,180,110,0.1)] text-[#edd49c] text-[13px] cursor-pointer hover:bg-[rgba(216,180,110,0.15)] transition-colors"
          >
            ＋ 交易
          </button>
        </div>
      </div>

      {holdings.length === 0 && (
        <div className="py-14 flex flex-col items-center justify-center text-center gap-3">
          <div className="text-[15px] text-[#aab6cc]">尚無持股</div>
          <div className="text-[13px] text-[#8d99af]">點擊右上「＋ 交易」輸入股票代號,開始記錄你的真實持倉</div>
          <button
            onClick={openNewHolding}
            className="mt-2 px-5 py-2 rounded-full border border-[rgba(216,180,110,0.42)] bg-[rgba(216,180,110,0.1)] text-[#edd49c] text-[13px] cursor-pointer hover:bg-[rgba(216,180,110,0.15)] transition-colors"
          >
            ＋ 新增第一筆持股
          </button>
        </div>
      )}

      <div className="flex flex-col">
        {holdings.map((holding) => (
          <div
            key={holding.code}
            className="flex items-center gap-4 px-0.5 py-3 border-b border-[rgba(255,255,255,0.05)]"
          >
            <div className="relative w-[42px] h-[42px] flex-shrink-0">
              <RingCanvas fraction={holding.weightFrac} code={holding.code} />
              <div className="absolute inset-0 flex items-center justify-center font-mono font-medium text-xs text-[#9aa6ba]">
                {holding.weight}
              </div>
            </div>

            <div className="w-24 flex-shrink-0">
              <div className="font-mono font-medium text-base text-[#e7ecf4]">{holding.code}</div>
              <div className="text-[13px] text-[#aab6cc] mt-0.5">{holding.name}</div>
            </div>

            <SparklineCanvas history={holding.history} code={holding.code} />

            <div className="flex-1 text-right">
              <div className="font-mono font-medium text-base text-[#dbe2ee] tabular-nums">{holding.price}</div>
              <div
                className="font-mono font-medium text-[13.5px] tabular-nums mt-0.5"
                style={{ color: holding.changeColor }}
              >
                {holding.changePct}
              </div>
            </div>

            <div className="w-24 text-right">
              <div className="font-mono font-medium text-[15px] text-[#c2cce0] tabular-nums">{holding.value}</div>
              <div
                className="font-mono font-medium text-xs tabular-nums mt-0.5"
                style={{ color: holding.pnlColor }}
              >
                {holding.pnl}
              </div>
            </div>

            <div className="flex gap-1.5 flex-shrink-0">
              <button
                onClick={() => openModal(holding.code, 'buy')}
                title="加倉"
                className="w-7 h-7 rounded-full border border-[rgba(214,95,87,0.32)] bg-transparent text-[#d6837c] text-sm cursor-pointer hover:bg-[rgba(214,95,87,0.1)] transition-colors"
              >
                ＋
              </button>
              <button
                onClick={() => openModal(holding.code, 'sell')}
                title="減倉"
                className="w-7 h-7 rounded-full border border-[rgba(63,174,132,0.32)] bg-transparent text-[#6fc0a0] text-[17px] cursor-pointer hover:bg-[rgba(63,174,132,0.1)] transition-colors leading-none pb-1"
              >
                －
              </button>
              <button
                onClick={() => closePosition(holding.code)}
                title="平倉"
                className="w-7 h-7 rounded-full border border-[rgba(255,255,255,0.13)] bg-transparent text-[#aab6cc] text-xs cursor-pointer hover:bg-[rgba(255,255,255,0.05)] transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
