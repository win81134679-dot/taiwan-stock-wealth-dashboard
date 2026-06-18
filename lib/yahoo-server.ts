// 伺服器端 Yahoo Finance v8 chart 端點封裝
// 僅在 API route 使用(避開 CORS、隱藏 UA、雙主機容錯)

const HOSTS = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'];
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

export interface RawQuote {
  code: string;        // 原始輸入代號(如 '2330.TW')
  symbol: string;      // Yahoo 回傳的 symbol
  name: string;        // 股票名稱
  price: number;       // 即時價
  prevClose: number;   // 昨收
  currency: string;
  marketState: string; // REGULAR / CLOSED / PRE / POST 等
  intraday: number[];  // 當日分鐘級收盤序列(去除 null)
}

export interface QuoteError {
  code: string;
  error: string;
}

interface YahooChartMeta {
  symbol: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  currency?: string;
  marketState?: string;
  longName?: string;
  shortName?: string;
  instrumentType?: string;
}

async function fetchChartFromHost(host: string, symbol: string): Promise<unknown> {
  const url = `https://${host}/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?interval=1m&range=1d`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    // Next.js 端短快取,降低 Yahoo 壓力
    next: { revalidate: 10 },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

function parseChart(code: string, json: unknown): RawQuote | null {
  const result = (json as { chart?: { result?: unknown[] } })?.chart?.result?.[0] as
    | {
        meta?: YahooChartMeta;
        timestamp?: number[];
        indicators?: { quote?: { close?: (number | null)[] }[] };
      }
    | undefined;

  const meta = result?.meta;
  if (!meta || typeof meta.regularMarketPrice !== 'number') {
    return null;
  }

  const closes = result?.indicators?.quote?.[0]?.close ?? [];
  const intraday = closes.filter((v): v is number => typeof v === 'number');

  return {
    code,
    symbol: meta.symbol,
    name: meta.longName || meta.shortName || meta.symbol,
    price: meta.regularMarketPrice,
    prevClose: meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice,
    currency: meta.currency ?? 'TWD',
    marketState: meta.marketState ?? 'CLOSED',
    intraday: intraday.length > 0 ? intraday : [meta.regularMarketPrice],
  };
}

// 抓單一代號,host 容錯
export async function fetchQuote(symbol: string): Promise<RawQuote | null> {
  for (const host of HOSTS) {
    try {
      const json = await fetchChartFromHost(host, symbol);
      const parsed = parseChart(symbol, json);
      if (parsed) return parsed;
    } catch {
      // 換下一台主機
    }
  }
  return null;
}

// 自動判斷上市/上櫃:給裸代號(如 '2330'),先試 .TW 再試 .TWO
export async function fetchQuoteAuto(rawCode: string): Promise<RawQuote | null> {
  const trimmed = rawCode.trim().toUpperCase();
  // 已含後綴則直接抓
  if (trimmed.includes('.')) {
    return fetchQuote(trimmed);
  }
  const tw = await fetchQuote(`${trimmed}.TW`);
  if (tw) return { ...tw, code: trimmed };
  const two = await fetchQuote(`${trimmed}.TWO`);
  if (two) return { ...two, code: trimmed };
  return null;
}
