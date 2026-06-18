import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Holding, TradeModalState } from './types';
import { calculateTradeCost } from './calculator';
import { getStockMeta } from './stock-names';
import { ClientQuote } from './yahoo-client';
import { recordSnapshot, NavSnapshot, loadSnapshots } from './snapshots';

interface StoreState {
  holdings: Record<string, Holding>;
  cash: number;
  realized: number;
  snapshots: NavSnapshot[];
  intradayNav: number[];

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

  getPortfolioValue: () => number;
  getPortfolioCost: () => number;
}

interface PersistedState {
  holdings: Record<string, Holding>;
  cash: number;
  realized: number;
  snapshots: NavSnapshot[];
  feeDiscount: number;
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
      intradayNav: [],
      timeRange: '1D',
      feeDiscount: 0.6,
      modal: { ...EMPTY_MODAL },
      lastUpdated: 0,

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
      setFeeDiscount: (discount) => set({ feeDiscount: discount }),
      setCash: (cash) => set({ cash: Math.max(0, cash) }),

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
          return { holdings: newHoldings, lastUpdated: Date.now() };
        });
      },

      recordNav: () => {
        const value = get().getPortfolioValue();
        if (value <= 0) return;
        const snapshots = recordSnapshot(value);
        set((state) => {
          const intraday = [...state.intradayNav, value].slice(-200);
          return { snapshots, intradayNav: intraday };
        });
      },

      resetAll: () => {
        set({
          holdings: {},
          cash: 0,
          realized: 0,
          snapshots: [],
          intradayNav: [],
          modal: { ...EMPTY_MODAL },
        });
      },

      importData: (data) => {
        set({
          holdings: data.holdings ?? {},
          cash: data.cash ?? 0,
          realized: data.realized ?? 0,
          snapshots: data.snapshots ?? [],
          feeDiscount: data.feeDiscount ?? 0.6,
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
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.snapshots = loadSnapshots();
        }
      },
    }
  )
);
