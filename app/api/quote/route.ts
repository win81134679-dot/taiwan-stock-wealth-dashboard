import { NextRequest, NextResponse } from 'next/server';
import { fetchQuoteAuto, RawQuote, QuoteError } from '@/lib/yahoo-server';

export const dynamic = 'force-dynamic';

// GET /api/quote?codes=2330,2454.TW,6488.TWO
// 並行抓多檔真實報價,單檔失敗不影響其他
export async function GET(req: NextRequest) {
  const codesParam = req.nextUrl.searchParams.get('codes');
  if (!codesParam) {
    return NextResponse.json({ error: 'missing codes parameter' }, { status: 400 });
  }

  const codes = codesParam
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 50); // 上限保護

  if (codes.length === 0) {
    return NextResponse.json({ quotes: [], errors: [] });
  }

  const settled = await Promise.allSettled(codes.map((c) => fetchQuoteAuto(c)));

  const quotes: RawQuote[] = [];
  const errors: QuoteError[] = [];

  settled.forEach((result, i) => {
    if (result.status === 'fulfilled' && result.value) {
      quotes.push(result.value);
    } else {
      errors.push({ code: codes[i], error: 'quote unavailable' });
    }
  });

  return NextResponse.json(
    { quotes, errors },
    { headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20' } }
  );
}
