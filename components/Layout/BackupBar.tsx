'use client';

import { useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { formatCurrency } from '@/lib/calculator';

export default function BackupBar() {
  const cash = useStore((s) => s.cash);
  const setCash = useStore((s) => s.setCash);
  const resetAll = useStore((s) => s.resetAll);
  const importData = useStore((s) => s.importData);
  const fileRef = useRef<HTMLInputElement>(null);
  const [editingCash, setEditingCash] = useState(false);
  const [cashInput, setCashInput] = useState('');

  const handleExport = () => {
    const state = useStore.getState();
    const data = {
      holdings: state.holdings,
      cash: state.cash,
      realized: state.realized,
      snapshots: state.snapshots,
      feeDiscount: state.feeDiscount,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tw-stock-portfolio-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileRef.current?.click();

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        importData(data);
        alert('匯入成功');
      } catch {
        alert('匯入失敗:檔案格式不正確');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    if (confirm('確定要清空所有持倉、現金與淨值紀錄?此操作無法復原(建議先匯出備份)')) {
      resetAll();
    }
  };

  const commitCash = () => {
    const value = parseFloat(cashInput.replace(/,/g, ''));
    if (!Number.isNaN(value)) setCash(value);
    setEditingCash(false);
  };

  const btn =
    'px-3 py-1.5 rounded-full border border-[rgba(255,255,255,0.1)] bg-transparent text-[#aab6cc] text-[12.5px] cursor-pointer hover:bg-[rgba(255,255,255,0.04)] transition-colors';

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 mb-5 sm:-mt-4">
      <div className="flex items-center gap-2 mr-auto">
        <span className="text-[12.5px] text-[#8d99af]">現金部位</span>
        {editingCash ? (
          <input
            autoFocus
            value={cashInput}
            onChange={(e) => setCashInput(e.target.value)}
            onBlur={commitCash}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitCash();
            }}
            placeholder="輸入現金金額"
            className="w-32 px-3 py-1.5 rounded-full border border-[rgba(216,180,110,0.3)] bg-[rgba(7,12,22,0.8)] text-[#e7ecf4] font-mono text-[12.5px] focus:outline-none"
          />
        ) : (
          <button
            onClick={() => {
              setCashInput(String(Math.round(cash)));
              setEditingCash(true);
            }}
            className="px-3 py-1.5 rounded-full border border-[rgba(216,180,110,0.25)] bg-[rgba(216,180,110,0.06)] text-[#edd49c] font-mono text-[12.5px] cursor-pointer hover:bg-[rgba(216,180,110,0.12)] transition-colors"
          >
            {formatCurrency(cash)} ✎
          </button>
        )}
      </div>

      <button onClick={handleExport} className={btn}>
        匯出備份
      </button>
      <button onClick={handleImportClick} className={btn}>
        匯入
      </button>
      <button onClick={handleReset} className={btn}>
        清空重置
      </button>
      <input ref={fileRef} type="file" accept="application/json" onChange={handleImportFile} className="hidden" />
    </div>
  );
}
