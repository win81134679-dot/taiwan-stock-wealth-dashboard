import { Stock } from './types';

export const DEFAULT_STOCKS: Omit<Stock, 'price' | 'history'>[] = [
  { code: '2330', name: '台積電', sector: '半導體', prev: 1010, cost: 1010, shares: 5000 },
  { code: '2454', name: '聯發科', sector: '半導體', prev: 1285, cost: 1285, shares: 600 },
  { code: '2317', name: '鴻海', sector: '電子', prev: 205, cost: 205, shares: 4000 },
  { code: '2308', name: '台達電', sector: '電子', prev: 415, cost: 415, shares: 1500 },
  { code: '3008', name: '大立光', sector: '光學', prev: 2480, cost: 2480, shares: 200 },
  { code: '2881', name: '富邦金', sector: '金融', prev: 92, cost: 92, shares: 5000 },
  { code: '2412', name: '中華電', sector: '電信', prev: 126, cost: 126, shares: 3000 },
  { code: '2603', name: '長榮', sector: '航運', prev: 205, cost: 205, shares: 2000 },
  { code: '2882', name: '國泰金', sector: '金融', prev: 65, cost: 65, shares: 0 },
  { code: '2303', name: '聯電', sector: '半導體', prev: 52, cost: 52, shares: 0 },
  { code: '3045', name: '台灣大', sector: '電信', prev: 105, cost: 105, shares: 0 },
  { code: '2357', name: '華碩', sector: '電子', prev: 608, cost: 608, shares: 0 },
];

export function initializeStock(base: Omit<Stock, 'price' | 'history'>): Stock {
  const drift = (Math.random() - 0.42) * 0.02;
  const price = base.prev * (1 + drift);

  const history: number[] = [];
  let p = base.prev * 0.985;
  for (let i = 0; i < 36; i++) {
    p *= 1 + (Math.random() - 0.5) * 0.01;
    history.push(p);
  }
  history.push(price);

  return {
    ...base,
    price,
    history,
  };
}

export function updateStockPrice(stock: Stock): Stock {
  const newPrice = Math.round(stock.price * (1 + (Math.random() - 0.5) * 0.0038) * 100) / 100;
  const newHistory = [...stock.history, newPrice];
  if (newHistory.length > 40) {
    newHistory.shift();
  }

  return {
    ...stock,
    price: newPrice,
    history: newHistory,
  };
}

export function generateSeries(n: number, endVal: number, vol: number, trend: number): number[] {
  const arr: number[] = [];
  let p = endVal * (1 - trend);
  for (let i = 0; i < n; i++) {
    p *= 1 + (Math.random() - 0.5) * vol + trend / n;
    arr.push(p);
  }
  arr[arr.length - 1] = endVal;
  return arr;
}

export function generate30DayPerformance(): number[] {
  const arr: number[] = [];
  for (let i = 0; i < 30; i++) {
    arr.push((Math.random() - 0.46) * 3.2);
  }
  return arr;
}
