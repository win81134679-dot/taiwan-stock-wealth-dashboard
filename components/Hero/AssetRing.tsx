'use client';

import { useEffect, useRef } from 'react';
import { COLOR } from '@/lib/types';
import { formatCurrency, formatPercent, formatSignedCurrency, getColor } from '@/lib/calculator';

interface AssetRingProps {
  totalValue: number;
  todayPnl: number;
  todayPct: number;
  cumulativeReturn: number;
  costBasis: number;
}

export default function AssetRing({ totalValue, todayPnl, todayPct, cumulativeReturn, costBasis }: AssetRingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    // 以實際渲染尺寸繪製,支援響應式(手機較小)
    const size = canvas.clientWidth || 332;
    const w = size;
    const h = size;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    if (!startTimeRef.current) {
      startTimeRef.current = performance.now();
    }

    const elapsed = (performance.now() - startTimeRef.current) / 1300;
    const progress = Math.min(1, 1 - Math.pow(1 - elapsed, 3));

    const cx = w / 2;
    const cy = h / 2;
    const R = w / 2 - 16;

    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const big = i % 6 === 0;
      const r1 = R + 8;
      const r2 = R + (big ? 14 : 11);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.strokeStyle = big ? 'rgba(216,180,110,0.4)' : 'rgba(255,255,255,0.09)';
      ctx.stroke();
    }

    const drawArc = (r: number, frac: number, color: string, width: number) => {
      ctx.lineWidth = width;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = COLOR.TRACK;
      ctx.stroke();

      if (frac > 0.001) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
        ctx.strokeStyle = color;
        ctx.stroke();
      }
    };

    const retFrac = Math.max(0, Math.min(1, cumulativeReturn / 30)) * progress;
    drawArc(R, retFrac, COLOR.BRASS, 5);

    const R2 = R - 15;
    // 內環(今日損益率):漲跌 10% 為滿圈
    const dayFrac = Math.max(0, Math.min(1, Math.abs(todayPct) / 10)) * progress;
    const dayColor = todayPnl >= 0 ? COLOR.UP : COLOR.DOWN;
    drawArc(R2, dayFrac, dayColor, 3);

    if (elapsed < 1) {
      requestAnimationFrame(() => {
        const event = new Event('redraw');
        canvas.dispatchEvent(event);
      });
    }
  }, [totalValue, todayPnl, todayPct, cumulativeReturn]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleRedraw = () => {
      startTimeRef.current = 0;
    };

    canvas.addEventListener('redraw', handleRedraw);
    return () => canvas.removeEventListener('redraw', handleRedraw);
  }, []);

  const todayColor = getColor(todayPnl, COLOR.UP, COLOR.DOWN, COLOR.FLAT);
  const todayBorder = todayPnl >= 0 ? 'rgba(214,95,87,0.32)' : 'rgba(63,174,132,0.32)';

  return (
    <div className="rounded-3xl border border-[rgba(216,180,110,0.22)] bg-gradient-to-b from-[rgba(216,180,110,0.10)] via-transparent to-transparent p-5 sm:p-8 shadow-[inset_0_1px_0_rgba(244,227,184,0.18),_0_22px_54px_rgba(0,0,0,0.38)]">
      <div className="relative w-full max-w-[300px] sm:max-w-[332px] aspect-square mx-auto">
        <canvas ref={canvasRef} className="w-full h-full block" />

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4">
          <div className="text-[13px] sm:text-sm tracking-[0.22em] text-[#aab6cc] mb-2 sm:mb-3">總資產淨值 ・ TWD</div>
          <div className="font-serif font-semibold text-[clamp(2rem,9vw,44px)] leading-none text-[#f0f4fa] tabular-nums tracking-tight">
            {formatCurrency(totalValue)}
          </div>
          <div
            className="flex items-center gap-2 mt-4 px-3.5 py-1 rounded-full border"
            style={{ borderColor: todayBorder }}
          >
            <span className="font-mono font-medium text-[15px] tabular-nums" style={{ color: todayColor }}>
              {formatSignedCurrency(todayPnl)}
            </span>
            <span className="font-mono font-medium text-[15px] tabular-nums" style={{ color: todayColor }}>
              {formatPercent(todayPct)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-9 mt-5">
        <div className="text-center">
          <div className="text-[13px] tracking-[0.14em] text-[#aab6cc] mb-1.5">累積報酬</div>
          <div className="font-mono font-medium text-[15px] text-[#e3c178] tabular-nums">{formatPercent(cumulativeReturn)}</div>
        </div>
        <div className="w-px bg-[rgba(255,255,255,0.08)]"></div>
        <div className="text-center">
          <div className="text-[13px] tracking-[0.14em] text-[#aab6cc] mb-1.5">投入成本</div>
          <div className="font-mono font-medium text-[15px] text-[#aab4c6] tabular-nums">{formatCurrency(costBasis)}</div>
        </div>
      </div>
    </div>
  );
}
