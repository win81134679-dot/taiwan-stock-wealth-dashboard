import { NextRequest, NextResponse } from 'next/server';
import { getPortfolio, appendSnapshot, isRedisConfigured } from '@/lib/redis';
import { fetchQuoteAuto } from '@/lib/yahoo-server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// 每日 14:00 台北(UTC 06:00,週一至週五)由 Vercel Cron 觸發。
// 讀雲端持倉 → 抓收盤價 → 算淨值 → 寫入當日快照。
// 也可手動 GET 觸發(用於測試)。
export async function GET(req: NextRequest) {
  // 若設定了 CRON_SECRET,驗證來源(Cron 觸發或帶 secret 才允許)
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    const isCron = req.headers.get('x-vercel-cron-schedule');
    if (!isCron && auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }
  }

  if (!isRedisConfigured()) {
    return NextResponse.json({ ok: false, error: 'redis not configured' }, { status: 200 });
  }

  try {
    const portfolio = await getPortfolio();
    const codes = Object.keys(portfolio.holdings);

    // 抓每檔收盤價(抓不到的用 cost 或 prevClose fallback,不寫壞資料)
    let stockValue = 0;
    const priced: Record<string, number> = {};

    await Promise.all(
      codes.map(async (code) => {
        const holding = portfolio.holdings[code];
        const quote = await fetchQuoteAuto(code);
        const price = quote?.price ?? holding.cost;
        priced[code] = price;
        stockValue += holding.shares * price;
      })
    );

    const nav = portfolio.cash + stockValue;
    const { date, snapshots } = await appendSnapshot(nav);

    return NextResponse.json({
      ok: true,
      date,
      nav,
      holdingsCount: codes.length,
      snapshotCount: snapshots.length,
      priced,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'snapshot failed' },
      { status: 500 }
    );
  }
}
