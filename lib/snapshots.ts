// 每日淨值快照(localStorage)— 解決純前端如何畫長期走勢與 30 日績效
// 機制:每次抓到真實報價算出淨值後,以台北時區「當日日期」為 key 記錄當日最新淨值。
// 同一天重複更新、跨天新增一筆。沒開網頁的日子就沒有資料點(純前端先天限制)。

export interface NavSnapshot {
  date: string; // 'YYYY-MM-DD'(台北時區)
  value: number;
}

const STORAGE_KEY = 'tw-stock-nav-snapshots-v1';
const MAX_SNAPSHOTS = 120; // 保留約 4 個月,足夠 30 日與季線

// 台北時區當日日期字串
export function taipeiToday(): string {
  // en-CA 格式即 YYYY-MM-DD
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });
}

// 由 epoch 秒數換算台北時區日期字串(判斷報價屬於哪個交易日)
export function taipeiDateFromEpoch(sec: number): string {
  return new Date(sec * 1000).toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });
}

export function loadSnapshots(): NavSnapshot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is NavSnapshot =>
        s && typeof s.date === 'string' && typeof s.value === 'number'
    );
  } catch {
    return [];
  }
}

function saveSnapshots(snapshots: NavSnapshot[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
  } catch {
    // 忽略寫入失敗(如隱私模式)
  }
}

// 純函式:以日期 upsert 快照(雲端與本機共用,不碰 localStorage)
export function upsertSnapshot(
  snapshots: NavSnapshot[],
  date: string,
  value: number
): NavSnapshot[] {
  if (!Number.isFinite(value) || value <= 0) return snapshots;

  const next = [...snapshots];
  const last = next[next.length - 1];

  if (last && last.date === date) {
    next[next.length - 1] = { date, value }; // 更新當日最新
  } else {
    next.push({ date, value });
  }

  return next.slice(-MAX_SNAPSHOTS);
}

// 記錄當日淨值到 localStorage,回傳更新後的快照陣列
export function recordSnapshot(value: number): NavSnapshot[] {
  if (!Number.isFinite(value) || value <= 0) return loadSnapshots();

  const updated = upsertSnapshot(loadSnapshots(), taipeiToday(), value);
  saveSnapshots(updated);
  return updated;
}

// 30 日績效:回傳最近 N 個「日對日變化%」(漲為正、跌為負)
export interface DailyChange {
  date: string;
  changePct: number;
}

export function getDailyChanges(snapshots: NavSnapshot[], limit = 30): DailyChange[] {
  const changes: DailyChange[] = [];
  for (let i = 1; i < snapshots.length; i++) {
    const prev = snapshots[i - 1].value;
    const curr = snapshots[i].value;
    if (prev > 0) {
      changes.push({
        date: snapshots[i].date,
        changePct: (curr / prev - 1) * 100,
      });
    }
  }
  return changes.slice(-limit);
}
