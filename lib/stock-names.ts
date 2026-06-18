// 常見台股代號 → 中文名 + 產業對照
// Yahoo longName 對台股多為英文,用此表補中文名與產業分類。
// 找不到時 fallback 用代號,使用者新增持股時也可自訂名稱。

export interface StockMeta {
  name: string;
  sector: string;
}

export const STOCK_META: Record<string, StockMeta> = {
  '2330': { name: '台積電', sector: '半導體' },
  '2454': { name: '聯發科', sector: '半導體' },
  '2303': { name: '聯電', sector: '半導體' },
  '2308': { name: '台達電', sector: '電子' },
  '2317': { name: '鴻海', sector: '電子' },
  '2357': { name: '華碩', sector: '電子' },
  '2382': { name: '廣達', sector: '電子' },
  '2412': { name: '中華電', sector: '電信' },
  '3045': { name: '台灣大', sector: '電信' },
  '4904': { name: '遠傳', sector: '電信' },
  '2881': { name: '富邦金', sector: '金融' },
  '2882': { name: '國泰金', sector: '金融' },
  '2891': { name: '中信金', sector: '金融' },
  '2886': { name: '兆豐金', sector: '金融' },
  '2884': { name: '玉山金', sector: '金融' },
  '2885': { name: '元大金', sector: '金融' },
  '2603': { name: '長榮', sector: '航運' },
  '2609': { name: '陽明', sector: '航運' },
  '2615': { name: '萬海', sector: '航運' },
  '3008': { name: '大立光', sector: '光學' },
  '3406': { name: '玉晶光', sector: '光學' },
  '6488': { name: '環球晶', sector: '半導體' },
  '3034': { name: '聯詠', sector: '半導體' },
  '2379': { name: '瑞昱', sector: '半導體' },
  '3711': { name: '日月光投控', sector: '半導體' },
  '2002': { name: '中鋼', sector: '鋼鐵' },
  '1301': { name: '台塑', sector: '塑化' },
  '1303': { name: '南亞', sector: '塑化' },
  '1216': { name: '統一', sector: '食品' },
  '2207': { name: '和泰車', sector: '汽車' },
  '2912': { name: '統一超', sector: '零售' },
  '0050': { name: '元大台灣50', sector: 'ETF' },
  '0056': { name: '元大高股息', sector: 'ETF' },
  '00878': { name: '國泰永續高股息', sector: 'ETF' },
  '006208': { name: '富邦台50', sector: 'ETF' },
};

export function getStockMeta(code: string): StockMeta {
  const meta = STOCK_META[code];
  if (meta) return meta;
  return { name: code, sector: '其他' };
}
