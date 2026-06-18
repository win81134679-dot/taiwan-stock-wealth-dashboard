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
    const w = 74;
    const h = 74;
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
      className="rounded-[22px] border p-5 flex items-center gap-5"
      style={{
        borderColor: cardBorder,
        background: cardBg,
      }}
    >
      <div className="relative w-[74px] h-[74px] flex-shrink-0">
        <canvas ref={canvasRef} width={74} height={74} className="w-full h-full block" />
        <div
          className="absolute inset-0 flex items-center justify-center font-mono font-medium text-sm tabular-nums"
          style={{ color: badgeColor }}
        >
          {badge}
        </div>
      </div>

      <div>
        <div className="text-sm tracking-[0.1em] text-[#aab6cc] mb-2">{label}</div>
        <div className="font-mono font-medium text-2xl tabular-nums" style={{ color: valueColor }}>
          {value}
        </div>
      </div>
    </div>
  );
}
