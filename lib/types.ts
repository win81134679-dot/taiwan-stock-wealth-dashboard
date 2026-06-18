// 持倉:持久化欄位(code/name/sector/shares/cost)由使用者手動記帳,
// 即時欄位(price/prevClose/intraday)由 Yahoo API 每次抓取填入,不持久化。
export interface Holding {
  code: string;
  name: string;
  sector: string;
  shares: number;
  cost: number;
  // 即時欄位(API 填入)
  price: number;
  prevClose: number;
  intraday: number[];
}

export interface TradeModalState {
  open: boolean;
  code: string;
  action: 'buy' | 'sell';
  qty: string;
  price: string;
  // 新增持股流程:輸入代號查詢真實報價
  lookupCode: string;
  lookupName: string;
  lookupPending: boolean;
  lookupError: string;
}

export interface TimeRange {
  key: '1D' | '1W' | '1M' | '1Y';
  label: string;
}

export interface NewsItem {
  tag: string;
  text: string;
  link?: string;
}

export interface SectorAllocation {
  name: string;
  value: number;
  color: string;
}

export const SECTOR_COLORS: Record<string, string> = {
  '半導體': '#e6c478',
  '電子': '#6f93c0',
  '金融': '#5aa6ab',
  '電信': '#929cc4',
  '航運': '#b594ba',
  '光學': '#82a890',
  'ETF': '#c98f6f',
  '鋼鐵': '#8a8f99',
  '塑化': '#9b86b5',
  '食品': '#7fae8a',
  '汽車': '#b58a6f',
  '零售': '#6faeb0',
  '其他': '#7c8699',
};

export const COLOR = {
  UP: '#f0635a',
  DOWN: '#22c98d',
  FLAT: '#aab6cc',
  BRASS: '#e6c478',
  TRACK: 'rgba(255,255,255,0.08)',
} as const;
