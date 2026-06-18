// 客戶端封裝:呼叫自家 /api/quote、/api/news(避開 CORS)

export interface ClientQuote {
  code: string;
  symbol: string;
  name: string;
  price: number;
  prevClose: number;
  currency: string;
  marketState: string;
  intraday: number[];
}

export interface ClientNews {
  title: string;
  link: string;
}

export async function fetchQuotes(codes: string[]): Promise<ClientQuote[]> {
  if (codes.length === 0) return [];
  const param = codes.join(',');
  const res = await fetch(`/api/quote?codes=${encodeURIComponent(param)}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`quote api ${res.status}`);
  }
  const data = (await res.json()) as { quotes?: ClientQuote[] };
  return data.quotes ?? [];
}

export async function fetchSingleQuote(code: string): Promise<ClientQuote | null> {
  const quotes = await fetchQuotes([code]);
  return quotes[0] ?? null;
}

export async function fetchNews(): Promise<ClientNews[]> {
  const res = await fetch('/api/news', { cache: 'no-store' });
  if (!res.ok) return [];
  const data = (await res.json()) as { news?: ClientNews[] };
  return data.news ?? [];
}
