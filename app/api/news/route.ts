import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const RSS_URL = 'https://tw.stock.yahoo.com/rss';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

export interface NewsItem {
  title: string;
  link: string;
}

function decodeEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

function parseRss(xml: string, limit = 12): NewsItem[] {
  const items: NewsItem[] = [];
  const itemBlocks = xml.match(/<item\b[^>]*>([\s\S]*?)<\/item>/g) ?? [];

  for (const block of itemBlocks) {
    const titleMatch = block.match(/<title\b[^>]*>([\s\S]*?)<\/title>/);
    const linkMatch = block.match(/<link\b[^>]*>([\s\S]*?)<\/link>/);
    if (!titleMatch) continue;

    const title = decodeEntities(titleMatch[1]);
    const link = linkMatch ? decodeEntities(linkMatch[1]) : '';
    if (title) {
      items.push({ title, link });
    }
    if (items.length >= limit) break;
  }

  return items;
}

export async function GET() {
  try {
    const res = await fetch(RSS_URL, {
      headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/xml, text/xml' },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json({ news: [], error: `HTTP ${res.status}` }, { status: 200 });
    }

    const xml = await res.text();
    const news = parseRss(xml);

    return NextResponse.json(
      { news },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    );
  } catch {
    return NextResponse.json({ news: [], error: 'fetch failed' }, { status: 200 });
  }
}
