export interface Stock {
  code: string;
  name: string;
  sector: string;
  price: number;
  prev: number;
  cost: number;
  shares: number;
  history: number[];
}

export interface Portfolio {
  stocks: Record<string, Stock>;
  cash: number;
  realized: number;
  assetHistory: number[];
  daily30: number[];
}

export interface TradeModalState {
  open: boolean;
  code: string;
  action: 'buy' | 'sell';
  qty: string;
  price: string;
}

export interface TimeRange {
  key: '1D' | '1W' | '1M' | '1Y';
  label: string;
}

export interface NewsItem {
  tag: string;
  text: string;
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
};

export const COLOR = {
  UP: '#f0635a',
  DOWN: '#22c98d',
  FLAT: '#aab6cc',
  BRASS: '#e6c478',
  TRACK: 'rgba(255,255,255,0.08)',
} as const;
