export interface TradeCost {
  qty: number;
  price: number;
  amount: number;
  fee: number;
  tax: number;
  net: number;
}

export function calculateTradeCost(
  action: 'buy' | 'sell',
  qty: string,
  price: string,
  feeDiscount: number
): TradeCost {
  const qtyNum = Math.max(0, parseInt(qty) || 0);
  const priceNum = Math.max(0, parseFloat(price) || 0);
  const amount = qtyNum * priceNum;

  const fee = amount > 0 ? Math.max(20, Math.round(amount * 0.001425 * feeDiscount)) : 0;
  const tax = action === 'sell' ? Math.round(amount * 0.003) : 0;
  const net = action === 'buy' ? amount + fee : amount - fee - tax;

  return {
    qty: qtyNum,
    price: priceNum,
    amount,
    fee,
    tax,
    net,
  };
}

export function formatCurrency(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export function formatPercent(n: number): string {
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
}

export function formatSignedCurrency(n: number): string {
  return (n >= 0 ? '+' : '-') + formatCurrency(Math.abs(n));
}

export function getColor(n: number, upColor: string, downColor: string, flatColor: string): string {
  return n > 0 ? upColor : n < 0 ? downColor : flatColor;
}

export function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace('#', '');
  const full = cleaned.length === 3
    ? cleaned.split('').map((c) => c + c).join('')
    : cleaned;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
