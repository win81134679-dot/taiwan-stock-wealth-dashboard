// 今日盤中 NAV 曲線合成:用各持股「今日分鐘收盤序列」(Yahoo intraday,
// 已前向填補、時間軸對齊)乘上股數再加總現金,還原今天整天的總資產走勢。
// 不依賴「開著網頁慢慢採樣」,開盤後任何時間打開都能看到一整天的形狀。

import { Holding } from './types';

export interface IntradayNav {
  series: number[]; // 今日逐分鐘總資產淨值(含現金)
  base: number;     // 昨收基準淨值(今日損益起算點;曲線終點 − base = 今日損益)
}

// 以「目前股數」回推整日,屬近似:盤中若加減碼,早盤段會以現股數計。
export function buildIntradayNav(
  holdings: Record<string, Holding>,
  cash: number
): IntradayNav {
  const positions = Object.values(holdings).filter(
    (h) => h.shares > 0 && Array.isArray(h.intraday) && h.intraday.length > 0
  );

  // 昨收基準:現金 + Σ 股數 × 昨收(無昨收則退回成本)
  const base =
    cash + positions.reduce((sum, h) => sum + h.shares * (h.prevClose || h.cost), 0);

  if (positions.length === 0) return { series: [], base };

  // 同一交易時段各序列長度通常相等;以最短長度自尾端對齊,確保「現在」這個點對齊。
  const minLen = Math.min(...positions.map((h) => h.intraday.length));
  if (minLen < 2) return { series: [], base };

  const series: number[] = [];
  for (let k = 0; k < minLen; k++) {
    let nav = cash;
    for (const h of positions) {
      nav += h.shares * h.intraday[h.intraday.length - minLen + k];
    }
    series.push(nav);
  }

  return { series, base };
}
