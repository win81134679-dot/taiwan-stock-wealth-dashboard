'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { calculateTradeCost, formatCurrency } from '@/lib/calculator';

export default function TradeModal() {
  const {
    modal,
    stocks,
    feeDiscount,
    closeModal,
    setModalAction,
    setModalCode,
    setModalQty,
    setModalPrice,
    setFeeDiscount,
    confirmTrade,
  } = useStore();

  const tradeList = useMemo(() => {
    return Object.values(stocks).map((stock) => ({
      code: stock.code,
      label: `${stock.code} ${stock.name}${stock.shares > 0 ? `  ・ 持有 ${formatCurrency(stock.shares)} 股` : '  ・ 未持有'}`,
    }));
  }, [stocks]);

  const cost = useMemo(() => {
    return calculateTradeCost(modal.action, modal.qty, modal.price, feeDiscount);
  }, [modal.action, modal.qty, modal.price, feeDiscount]);

  const discountOptions = [
    { label: '5折', value: 0.5 },
    { label: '6折', value: 0.6 },
    { label: '原價', value: 1 },
  ];

  const discountLabel = feeDiscount === 1 ? '原價' : Math.round(feeDiscount * 10) + '折';
  const isBuy = modal.action === 'buy';

  if (!modal.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(5,9,16,0.68)] backdrop-blur-sm">
      <div className="w-[432px] rounded-3xl border border-[rgba(216,180,110,0.22)] bg-gradient-to-b from-[#111d31] to-[#0b1322] shadow-[0_36px_90px_rgba(0,0,0,0.62)] p-7">
        <div className="flex justify-between items-center mb-6">
          <span className="font-serif text-lg text-[#eef2f8] tracking-wide">交易 ・ 委託試算</span>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-full border border-[rgba(255,255,255,0.12)] bg-transparent text-[#aab6cc] cursor-pointer hover:bg-[rgba(255,255,255,0.05)] transition-colors text-[13px]"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <div className="text-xs text-[#aab6cc] mb-2">標的</div>
          <select
            value={modal.code}
            onChange={(e) => setModalCode(e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(7,12,22,0.8)] text-[#e7ecf4] text-sm cursor-pointer hover:border-[rgba(255,255,255,0.15)] transition-colors"
          >
            {tradeList.map((item) => (
              <option key={item.code} value={item.code} className="bg-[#0b1322]">
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2.5 mb-4">
          <button
            onClick={() => setModalAction('buy')}
            className={`flex-1 py-3 rounded-xl cursor-pointer text-sm transition-colors ${
              isBuy
                ? 'border border-[rgba(214,95,87,0.5)] bg-[rgba(214,95,87,0.16)] text-[#e2938c]'
                : 'border border-[rgba(255,255,255,0.1)] bg-transparent text-[#aab6cc]'
            }`}
          >
            買進 ・ 加倉
          </button>
          <button
            onClick={() => setModalAction('sell')}
            className={`flex-1 py-3 rounded-xl cursor-pointer text-sm transition-colors ${
              !isBuy
                ? 'border border-[rgba(63,174,132,0.5)] bg-[rgba(63,174,132,0.16)] text-[#6fc0a0]'
                : 'border border-[rgba(255,255,255,0.1)] bg-transparent text-[#aab6cc]'
            }`}
          >
            賣出 ・ 減倉
          </button>
        </div>

        <div className="flex gap-3 mb-5">
          <div className="flex-1">
            <div className="text-xs text-[#aab6cc] mb-2">股數</div>
            <input
              type="number"
              value={modal.qty}
              onChange={(e) => setModalQty(e.target.value)}
              placeholder="0"
              className="w-full px-3.5 py-3 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(7,12,22,0.8)] text-[#e7ecf4] font-mono text-[15px] focus:outline-none focus:border-[rgba(216,180,110,0.3)]"
            />
          </div>
          <div className="flex-1">
            <div className="text-xs text-[#aab6cc] mb-2">成交價</div>
            <input
              type="number"
              value={modal.price}
              onChange={(e) => setModalPrice(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(7,12,22,0.8)] text-[#e7ecf4] font-mono text-[15px] focus:outline-none focus:border-[rgba(216,180,110,0.3)]"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-[rgba(7,12,22,0.55)] border border-[rgba(255,255,255,0.06)] px-4 py-4 flex flex-col gap-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-[#aab6cc]">成交金額</span>
            <span className="font-mono font-medium text-sm text-[#dbe2ee] tabular-nums">{formatCurrency(cost.amount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-[#aab6cc]">
              手續費 <span className="text-[11px] text-[#8d99af]">0.1425% × {discountLabel}</span>
            </span>
            <span className="font-mono font-medium text-sm text-[#cf9089] tabular-nums">− {formatCurrency(cost.fee)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-[#aab6cc]">
              證交稅 <span className="text-[11px] text-[#8d99af]">{isBuy ? '—' : '0.3%'}</span>
            </span>
            <span className="font-mono font-medium text-sm text-[#cf9089] tabular-nums">− {formatCurrency(cost.tax)}</span>
          </div>
          <div className="h-px bg-[rgba(255,255,255,0.08)] my-0.5"></div>
          <div className="flex justify-between items-center">
            <span className="text-[13.5px] text-[#cdd6e6]">{isBuy ? '應付金額' : '實收金額'}</span>
            <span className="font-mono font-semibold text-lg text-[#f0dcae] tabular-nums">{formatCurrency(cost.net)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs text-[#aab6cc]">手續費折數</span>
          <div className="flex gap-1 p-1 rounded-full border border-[rgba(255,255,255,0.08)]">
            {discountOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFeeDiscount(option.value)}
                className={`text-xs px-3 py-1 rounded-full border-none cursor-pointer transition-colors ${
                  feeDiscount === option.value
                    ? 'bg-[rgba(216,180,110,0.18)] text-[#edd49c]'
                    : 'bg-transparent text-[#aab6cc]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={closeModal}
            className="flex-1 py-3 rounded-2xl border border-[rgba(255,255,255,0.12)] bg-transparent text-[#aab4c6] text-[15px] cursor-pointer hover:bg-[rgba(255,255,255,0.03)] transition-colors"
          >
            取消
          </button>
          <button
            onClick={confirmTrade}
            className="flex-[1.5] py-3 rounded-2xl border-none text-[#0b1322] font-semibold text-[15px] cursor-pointer hover:opacity-90 transition-opacity"
            style={{ background: isBuy ? '#cf7b73' : '#54b48f' }}
          >
            {isBuy ? '確認買進' : '確認賣出'}
          </button>
        </div>
      </div>
    </div>
  );
}
