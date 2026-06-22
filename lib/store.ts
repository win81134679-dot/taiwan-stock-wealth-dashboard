import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Holding, TradeModalState } from './types';
import { calculateTradeCost } from './calculator';
import { getStockMeta } from './stock-names';
import { ClientQuote } from './yahoo-client';
import { recordSnapshot, NavSnapshot, loadSnapshots, taipeiDateFromEpoch } from './snapshots';
import { loadCloudPortfolio, saveCloudPortfolio } from './portfolio-client';

interface StoreState {
  holdings: Record<string, Holding>;
  cash: number;
  realized: number;
  snapshots: NavSnapshot[];
  quotesDate: string; // 最新報價所屬的台北交易日(今日走勢據此判斷新舊)

  timeRange: '1D' | '1W' | '1M' | '1Y';
  feeDiscount: number;
  modal: TradeModalState;
  lastUpdated: number;

  setTimeRange: (range: '1D' | '1W' | '1M' | '1Y') => void;
  setFeeDiscount: (discount: number) => void;
  setCash: (cash: number) => void;

  openModal: (code: string, action: 'buy' | 'sell') => void;
  openNewHolding: () => void;
  closeModal: () => void;
  setModalAction: (action: 'buy' | 'sell') => void;
  setModalCode: (code: string) => void;
  setModalQty: (qty: string) => void;
  setModalPrice: (price: string) => void;
  setLookupCode: (code: string) => void;
  applyLookup: (quote: ClientQuote) => void;
  setLookupPending: (pending: boolean) => void;
  setLookupError: (error: string) => void;
  confirmTrade: () => void;
  closePosition: (code: string) => void;

  applyQuotes: (quotes: ClientQuote[]) => void;
  recordNav: () => void;
  resetAll: () => void;
  importData: (data: Partial<PersistedState>) => void;

  cloudEnabled: boolean;
  loadFromCloud: () => Promise<void>;
  syncToCloud: () => Promise<void>;

  getPortfolioValue: () => number;
  getPortfolioCost: () => number;
}

interface PersistedState {
  holdings: Record<string, Holding>;
  cash: number;
  realized: number;
  snapshots: NavSnapshot[];
  feeDiscount: number;
  quotesDate: string;
}

const EMPTY_MODAL: TradeModalState = {
  open: false,
  code: '',
  action: 'buy',
  qty: '',
  price: '',
  lookupCode: '',
  lookupName: '',
  lookupPending: false,
  lookupError: '',
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      holdings: {},
      cash: 0,
      realized: 0,
      snapshots: [],
      quotesDate: '',
      timeRange: '1D',
      feeDiscount: 0.6,
      modal: { ...EMPTY_MODAL },
      lastUpdated: 0,
      cloudEnabled: false,

      getPortfolioValue: () => {
        const state = get();
        let value = state.cash;
        Object.values(state.holdings).forEach((h) => {
          value += h.shares * (h.price || h.cost);
        });
        return value;
      },

      getPortfolioCost: () => {
        const state = get();
        let cost = state.cash;
        Object.values(state.holdings).forEach((h) => {
          cost += h.shares * h.cost;
        });
        return cost;
      },

      setTimeRange: (range) => set({ timeRange: range }),
      setFeeDiscount: (discount) => {
        set({ feeDiscount: discount });
        get().syncToCloud();
      },
      setCash: (cash) => {
        set({ cash: Math.max(0, cash) });
        get().syncToCloud();
      },

      openModal: (code, action) => {
        const h = get().holdings[code];
        set({
          modal: {
            ...EMPTY_MODAL,
            open: true,
            code,
            action,
            price: h ? (h.price || h.cost).toFixed(2) : '',
          },
        });
      },

      openNewHolding: () => {
        set({ modal: { ...EMPTY_MODAL, open: true, action: 'buy' } });
      },

      closeModal: () => set((state) => ({ modal: { ...state.modal, open: false } })),
      setModalAction: (action) => set((state) => ({ modal: { ...state.modal, action } })),
      setModalCode: (code) => {
        const h = get().holdings[code];
        set((state) => ({
          modal: { ...state.modal, code, price: h ? (h.price || h.cost).toFixed(2) : state.modal.price },
        }));
      },
      setModalQty: (qty) => set((state) => ({ modal: { ...state.modal, qty } })),
      setModalPrice: (price) => set((state) => ({ modal: { ...state.modal, price } })),

      setLookupCode: (code) =>
        set((state) => ({ modal: { ...state.modal, lookupCode: code, lookupError: '' } })),
      setLookupPending: (pending) =>
        set((state) => ({ modal: { ...state.modal, lookupPending: pending } })),
      setLookupError: (error) =>
        set((state) => ({ modal: { ...state.modal, lookupError: error, lookupPending: false } })),

      applyLookup: (quote) => {
        const meta = getStockMeta(quote.code);
        set((state) => ({
          modal: {
            ...state.modal,
            code: quote.code,
            lookupName: meta.name,
            lookupPending: false,
            lookupError: '',
            price: quote.price.toFixed(2),
          },
          // 預先把報價寫入 holdings 的即時欄位(若已存在)
          holdings: state.holdings[quote.code]
            ? {
                ...state.holdings,
                [quote.code]: {
                  ...state.holdings[quote.code],
                  price: quote.price,
                  prevClose: quote.prevClose,
                  intraday: quote.intraday,
                },
              }
            : state.holdings,
        }));
      },

      confirmTrade: () => {
        const state = get();
        const { modal, holdings, cash, realized, feeDiscount } = state;
        const code = modal.code;
        if (!code) return;

        const cost = calculateTradeCost(modal.action, modal.qty, modal.price, feeDiscount);
        if (cost.qty <= 0 || cost.price <= 0) return;

        const existing = holdings[code];
        const meta = getStockMeta(code);

        // 記帳語意:買股「登記持倉」不動現金;賣股計入已實現損益但不加現金。
        // 現金部位由使用者透過上方「現金部位 ✎」手動維護。
        if (modal.action === 'buy') {
          const prevShares = existing?.shares ?? 0;
          const prevCost = existing?.cost ?? 0;
          const newShares = prevShares + cost.qty;
          // 加權平均成本含手續費攤入
          const newAvgCost = (prevShares * prevCost + cost.qty * cost.price + cost.fee) / newShares;

          set({
            holdings: {
              ...holdings,
              [code]: {
                code,
                name: existing?.name || modal.lookupName || meta.name,
                sector: existing?.sector || meta.sector,
                shares: newShares,
                cost: newAvgCost,
                price: existing?.price || cost.price,
                prevClose: existing?.prevClose || cost.price,
                intraday: existing?.intraday || [cost.price],
              },
            },
            modal: { ...modal, open: false },
          });
          get().syncToCloud();
        } else {
          if (!existing) {
            set({ modal: { ...modal, open: false } });
            return;
          }
          const sellQty = Math.min(cost.qty, existing.shares);
          if (sellQty <= 0) {
            set({ modal: { ...modal, open: false } });
            return;
          }
          const amount = sellQty * cost.price;
          const fee = Math.max(20, Math.round(amount * 0.001425 * feeDiscount));
          const tax = Math.round(amount * 0.003);
          // 已實現損益 = 賣出價差 − 手續費 − 證交稅(獨立追蹤,不動現金部位)
          const newRealized = realized + sellQty * (cost.price - existing.cost) - fee - tax;
          const remainShares = existing.shares - sellQty;

          const newHoldings = { ...holdings };
          if (remainShares <= 0) {
            delete newHoldings[code];
          } else {
            newHoldings[code] = { ...existing, shares: remainShares };
          }

          set({
            holdings: newHoldings,
            realized: newRealized,
            modal: { ...modal, open: false },
          });
          get().syncToCloud();
        }
      },

      closePosition: (code) => {
        const state = get();
        const h = state.holdings[code];
        if (!h || h.shares <= 0) return;

        const price = h.price || h.cost;
        const amount = h.shares * price;
        const fee = Math.max(20, Math.round(amount * 0.001425 * state.feeDiscount));
        const tax = Math.round(amount * 0.003);
        // 平倉計入已實現損益,不動現金部位(與賣出語意一致)
        const newRealized = state.realized + h.shares * (price - h.cost) - fee - tax;

        const newHoldings = { ...state.holdings };
        delete newHoldings[code];

        set({
          holdings: newHoldings,
          realized: newRealized,
        });
        get().syncToCloud();
      },

      applyQuotes: (quotes) => {
        set((state) => {
          const newHoldings = { ...state.holdings };
          quotes.forEach((q) => {
            const h = newHoldings[q.code];
            if (h) {
              newHoldings[q.code] = {
                ...h,
                price: q.price,
                prevClose: q.prevClose,
                intraday: q.intraday,
              };
            }
          });
          // 取最新一筆報價成交時間,換算成台北交易日:今日走勢只在此日==今天時顯示
          const latest = quotes.reduce((max, q) => (q.lastTime > max ? q.lastTime : max), 0);
          const quotesDate = latest > 0 ? taipeiDateFromEpoch(latest) : state.quotesDate;
          return { holdings: newHoldings, lastUpdated: Date.now(), quotesDate };
        });
      },

      recordNav: () => {
        const state = get();
        // 每檔持倉都需有真實報價(price>0)才記錄;只要有一檔還在用成本價/未取價,
        // 就跳過這次,避免淨值在「成本價 ↔ 市價」間暴跳而畫不出平滑曲線。
        const holdings = Object.values(state.holdings);
        if (holdings.some((h) => !(h.price > 0))) return;

        const value = state.getPortfolioValue();
        if (value <= 0) return;

        // 記錄當日「每日淨值快照」(供 1W/1M/1Y 長期走勢);今日盤中曲線改由
        // lib/intraday.ts 直接用各持股分鐘序列合成,不再於此累積。
        set({ snapshots: recordSnapshot(value) });
      },

      resetAll: () => {
        set({
          holdings: {},
          cash: 0,
          realized: 0,
          snapshots: [],
          modal: { ...EMPTY_MODAL },
        });
        get().syncToCloud();
      },

      importData: (data) => {
        set({
          holdings: data.holdings ?? {},
          cash: data.cash ?? 0,
          realized: data.realized ?? 0,
          snapshots: data.snapshots ?? [],
          feeDiscount: data.feeDiscount ?? 0.6,
        });
        get().syncToCloud();
      },

      // 啟動時拉雲端持倉(雲端為權威來源,覆蓋本機)
      loadFromCloud: async () => {
        const { portfolio, cloud } = await loadCloudPortfolio();
        if (!cloud || !portfolio) {
          set({ cloudEnabled: false });
          return;
        }
        set({
          holdings: portfolio.holdings ?? {},
          cash: portfolio.cash ?? 0,
          realized: portfolio.realized ?? 0,
          feeDiscount: portfolio.feeDiscount ?? 0.6,
          snapshots: portfolio.navSnapshots ?? [],
          cloudEnabled: true,
          lastUpdated: Date.now(),
        });
      },

      // 交易/現金變動後寫回雲端(最後寫入勝出)
      syncToCloud: async () => {
        if (!get().cloudEnabled) return;
        const state = get();
        await saveCloudPortfolio({
          holdings: state.holdings,
          cash: state.cash,
          realized: state.realized,
          feeDiscount: state.feeDiscount,
          navSnapshots: state.snapshots,
        });
      },
    }),
    {
      name: 'tw-stock-portfolio-v2', // 新 key:自動忽略舊模擬版假資料
      partialize: (state) => ({
        holdings: state.holdings,
        cash: state.cash,
        realized: state.realized,
        snapshots: state.snapshots,
        feeDiscount: state.feeDiscount,
        quotesDate: state.quotesDate,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.snapshots = loadSnapshots();
        }
      },
    }
  )
);
