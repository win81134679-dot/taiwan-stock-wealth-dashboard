import { NextRequest, NextResponse } from 'next/server';
import { getPortfolio, savePortfolio, emptyPortfolio, isRedisConfigured, CloudPortfolio } from '@/lib/redis';

export const dynamic = 'force-dynamic';

// GET /api/portfolio → 讀雲端持倉(前端啟動時同步)
export async function GET() {
  if (!isRedisConfigured()) {
    // 未設定雲端資料庫:回空結構 + 標記,前端退回純本機模式
    return NextResponse.json({ portfolio: emptyPortfolio(), cloud: false });
  }
  try {
    const portfolio = await getPortfolio();
    return NextResponse.json({ portfolio, cloud: true });
  } catch {
    return NextResponse.json({ portfolio: emptyPortfolio(), cloud: false, error: 'read failed' });
  }
}

// PUT /api/portfolio → 寫入雲端(交易/現金變動後同步)
export async function PUT(req: NextRequest) {
  if (!isRedisConfigured()) {
    return NextResponse.json({ ok: false, cloud: false, error: 'redis not configured' }, { status: 200 });
  }
  try {
    const body = (await req.json()) as Partial<CloudPortfolio>;
    const saved = await savePortfolio({
      holdings: body.holdings ?? {},
      cash: body.cash ?? 0,
      realized: body.realized ?? 0,
      feeDiscount: body.feeDiscount ?? 0.6,
      navSnapshots: body.navSnapshots ?? [],
    });
    return NextResponse.json({ ok: true, cloud: true, portfolio: saved });
  } catch {
    return NextResponse.json({ ok: false, error: 'write failed' }, { status: 500 });
  }
}
