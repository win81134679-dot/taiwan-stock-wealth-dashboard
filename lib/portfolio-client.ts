// 客戶端:與 /api/portfolio 同步雲端持倉

import { Holding } from './types';
import { NavSnapshot } from './snapshots';

export interface CloudPortfolioPayload {
  holdings: Record<string, Holding>;
  cash: number;
  realized: number;
  feeDiscount: number;
  navSnapshots: NavSnapshot[];
}

export interface LoadResult {
  portfolio: CloudPortfolioPayload | null;
  cloud: boolean;
}

export async function loadCloudPortfolio(): Promise<LoadResult> {
  try {
    const res = await fetch('/api/portfolio', { cache: 'no-store' });
    if (!res.ok) return { portfolio: null, cloud: false };
    const data = (await res.json()) as { portfolio?: CloudPortfolioPayload; cloud?: boolean };
    return { portfolio: data.portfolio ?? null, cloud: Boolean(data.cloud) };
  } catch {
    return { portfolio: null, cloud: false };
  }
}

export async function saveCloudPortfolio(payload: CloudPortfolioPayload): Promise<boolean> {
  try {
    const res = await fetch('/api/portfolio', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { ok?: boolean };
    return Boolean(data.ok);
  } catch {
    return false;
  }
}
