'use client';

import { useEffect, useRef } from 'react';
import { COLOR } from '@/lib/types';

interface StatCardProps {
  label: string;
  value: string;
  valueColor: string;
  badge: string;
  badgeColor: string;
  ringFraction: number;
  ringColor: string;
  cardBg: string;
  cardBorder: string;
}

export default function StatCard({
  label,
  value,
  valueColor,
  badge,
  badgeColor,
  ringFraction,
  ringColor,
  cardBg,
  cardBorder,
}: StatCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    // 以實際渲染尺寸繪製,支援響應式(手機較小)
    const size = canvas.clientWidth || 74;
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
    const R = w / 2 - 6;

    ctx.clearRect(0, 0, w, h);

    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = COLOR.TRACK;
    ctx.stroke();

    const frac = ringFraction * progress;
    if (frac > 0.001) {
      ctx.beginPath();
      ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
      ctx.strokeStyle = ringColor;
      ctx.stroke();
    }

    if (elapsed < 1) {
      requestAnimationFrame(() => {
        const event = new Event('redraw');
        canvas.dispatchEvent(event);
      });
    }
  }, [ringFraction, ringColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleRedraw = () => {
      startTimeRef.current = 0;
    };

    canvas.addEventListener('redraw', handleRedraw);
    return () => canvas.removeEventListener('redraw', handleRedraw);
  }, []);

  return (
    <div
      className="rounded-[22px] border p-3.5 sm:p-5 flex items-center gap-3 sm:gap-5"
      style={{
        borderColor: cardBorder,
        background: cardBg,
      }}
    >
      <div className="relative w-14 h-14 sm:w-[74px] sm:h-[74px] flex-shrink-0">
        <canvas ref={canvasRef} className="w-full h-full block" />
        <div
          className="absolute inset-0 flex items-center justify-center font-mono font-medium text-xs sm:text-sm tabular-nums"
          style={{ color: badgeColor }}
        >
          {badge}
        </div>
      </div>

      <div className="min-w-0">
        <div className="text-[13px] sm:text-sm tracking-[0.1em] text-[#aab6cc] mb-1.5 sm:mb-2 truncate">{label}</div>
        <div className="font-mono font-medium text-xl sm:text-2xl tabular-nums" style={{ color: valueColor }}>
          {value}
        </div>
      </div>
    </div>
  );
}
