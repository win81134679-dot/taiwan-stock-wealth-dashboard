// Upstash Redis client + 雲端 portfolio 讀寫(伺服器端,單一使用者單一 key)
// 環境變數 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN 由 Vercel 整合自動注入。

import { Redis } from '@upstash/redis';
import { Holding } from './types';
import { NavSnapshot, upsertSnapshot, taipeiToday } from './snapshots';

const PORTFOLIO_KEY = 'portfolio:default';

export interface CloudPortfolio {
  holdings: Record<string, Holding>;
  cash: number;
  realized: number;
  feeDiscount: number;
  navSnapshots: NavSnapshot[];
  updatedAt: string;
}

export function emptyPortfolio(): CloudPortfolio {
  return {
    holdings: {},
    cash: 0,
    realized: 0,
    feeDiscount: 0.6,
    navSnapshots: [],
    updatedAt: new Date().toISOString(),
  };
}

// 是否已設定 Upstash env(未設定時 API 會回明確錯誤,不致整站崩潰)
export function isRedisConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

let cachedClient: Redis | null = null;

function getClient(): Redis {
  if (!cachedClient) {
    cachedClient = Redis.fromEnv();
  }
  return cachedClient;
}

export async function getPortfolio(): Promise<CloudPortfolio> {
  const client = getClient();
  const data = await client.get<CloudPortfolio>(PORTFOLIO_KEY);
  if (!data) return emptyPortfolio();
  // 補齊缺漏欄位(向後相容)
  return {
    holdings: data.holdings ?? {},
    cash: data.cash ?? 0,
    realized: data.realized ?? 0,
    feeDiscount: data.feeDiscount ?? 0.6,
    navSnapshots: data.navSnapshots ?? [],
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
}

export async function savePortfolio(
  data: Omit<CloudPortfolio, 'updatedAt'>
): Promise<CloudPortfolio> {
  const client = getClient();
  const toSave: CloudPortfolio = { ...data, updatedAt: new Date().toISOString() };
  await client.set(PORTFOLIO_KEY, toSave);
  return toSave;
}

// 寫入當日淨值快照(Cron 用):讀現有 → upsert 台北今日 → 寫回
export async function appendSnapshot(value: number): Promise<{ date: string; snapshots: NavSnapshot[] }> {
  const portfolio = await getPortfolio();
  const date = taipeiToday();
  const snapshots = upsertSnapshot(portfolio.navSnapshots, date, value);
  await savePortfolio({ ...portfolio, navSnapshots: snapshots });
  return { date, snapshots };
}
