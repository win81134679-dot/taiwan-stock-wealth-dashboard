import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Portfolio, Stock, TradeModalState } from './types';
import { DEFAULT_STOCKS, initializeStock, updateStockPrice, generate30DayPerformance } from './simulator';
import { calculateTradeCost } from './calculator';

interface StoreState extends Portfolio {
  timeRange: '1D' | '1W' | '1M' | '1Y';
  feeDiscount: number;
  modal: TradeModalState;
  sessionPoints: number;

  setTimeRange: (range: '1D' | '1W' | '1M' | '1Y') => void;
  setFeeDiscount: (discount: number) => void;
  openModal: (code: string, action: 'buy' | 'sell') => void;
  closeModal: () => void;
  setModalAction: (action: 'buy' | 'sell') => void;
  setModalCode: (code: string) => void;
  setModalQty: (qty: string) => void;
  setModalPrice: (price: string) => void;
  confirmTrade: () => void;
  closePosition: (code: string) => void;
  tickPrices: () => void;
  resetPortfolio: () => void;
  getPortfolioValue: () => number;
  getPortfolioCost: () => number;
}

const DEFAULT_CASH = 1180000;
const DEFAULT_REALIZED = 486000;
const SESSION_POINTS = 80;

function createInitialStocks(): Record<string, Stock> {
  const stocks: Record<string, Stock> = {};
  DEFAULT_STOCKS.forEach((base) => {
    stocks[base.code] = initializeStock(base);
  });
  return stocks;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      stocks: createInitialStocks(),
      cash: DEFAULT_CASH,
      realized: DEFAULT_REALIZED,
      assetHistory: [],
      daily30: generate30DayPerformance(),
      timeRange: '1D',
      feeDiscount: 0.6,
      modal: {
        open: false,
        code: '2330',
        action: 'buy',
        qty: '',
        price: '',
      },
      sessionPoints: SESSION_POINTS,

      getPortfolioValue: () => {
        const state = get();
        let value = state.cash;
        Object.values(state.stocks).forEach((stock) => {
          value += stock.shares * stock.price;
        });
        return value;
      },

      getPortfolioCost: () => {
        const state = get();
        let cost = state.cash;
        Object.values(state.stocks).forEach((stock) => {
          cost += stock.shares * stock.cost;
        });
        return cost;
      },

      setTimeRange: (range) => set({ timeRange: range }),

      setFeeDiscount: (discount) => set({ feeDiscount: discount }),

      openModal: (code, action) => {
        const state = get();
        const stock = state.stocks[code];
        set({
          modal: {
            open: true,
            code,
            action,
            qty: '',
            price: stock.price.toFixed(2),
          },
        });
      },

      closeModal: () => {
        set((state) => ({
          modal: { ...state.modal, open: false },
        }));
      },

      setModalAction: (action) => {
        set((state) => ({
          modal: { ...state.modal, action },
        }));
      },

      setModalCode: (code) => {
        const state = get();
        const stock = state.stocks[code];
        set({
          modal: {
            ...state.modal,
            code,
            price: stock.price.toFixed(2),
          },
        });
      },

      setModalQty: (qty) => {
        set((state) => ({
          modal: { ...state.modal, qty },
        }));
      },

      setModalPrice: (price) => {
        set((state) => ({
          modal: { ...state.modal, price },
        }));
      },

      confirmTrade: () => {
        const state = get();
        const { modal, stocks, cash, realized, feeDiscount } = state;
        const stock = stocks[modal.code];

        const cost = calculateTradeCost(modal.action, modal.qty, modal.price, feeDiscount);
        if (cost.qty <= 0 || cost.price <= 0) return;

        if (modal.action === 'buy') {
          const newShares = stock.shares + cost.qty;
          const newCost = (stock.shares * stock.cost + cost.qty * cost.price + cost.fee) / newShares;

          set({
            stocks: {
              ...stocks,
              [modal.code]: {
                ...stock,
                shares: newShares,
                cost: newCost,
              },
            },
            cash: cash - cost.net,
            modal: { ...modal, open: false },
          });
        } else {
          const sellQty = Math.min(cost.qty, stock.shares);
          if (sellQty <= 0) {
            set({ modal: { ...modal, open: false } });
            return;
          }

          const amount = sellQty * cost.price;
          const fee = Math.max(20, Math.round(amount * 0.001425 * feeDiscount));
          const tax = Math.round(amount * 0.003);
          const newRealized = realized + sellQty * (cost.price - stock.cost) - fee - tax;

          set({
            stocks: {
              ...stocks,
              [modal.code]: {
                ...stock,
                shares: stock.shares - sellQty,
              },
            },
            cash: cash + amount - fee - tax,
            realized: newRealized,
            modal: { ...modal, open: false },
          });
        }
      },

      closePosition: (code) => {
        const state = get();
        const stock = state.stocks[code];
        if (stock.shares <= 0) return;

        const amount = stock.shares * stock.price;
        const fee = Math.max(20, Math.round(amount * 0.001425 * state.feeDiscount));
        const tax = Math.round(amount * 0.003);
        const newRealized = state.realized + stock.shares * (stock.price - stock.cost) - fee - tax;

        set({
          stocks: {
            ...state.stocks,
            [code]: {
              ...stock,
              shares: 0,
            },
          },
          cash: state.cash + amount - fee - tax,
          realized: newRealized,
        });
      },

      tickPrices: () => {
        set((state) => {
          if (state.modal.open) return state;

          const newStocks: Record<string, Stock> = {};
          Object.entries(state.stocks).forEach(([code, stock]) => {
            newStocks[code] = updateStockPrice(stock);
          });

          const portfolioValue = state.cash + Object.values(newStocks).reduce(
            (sum, stock) => sum + stock.shares * stock.price,
            0
          );

          let newHistory = [...state.assetHistory];
          if (newHistory.length === 0) {
            newHistory = [portfolioValue, portfolioValue];
          } else if (newHistory.length < state.sessionPoints) {
            newHistory.push(portfolioValue);
          } else {
            newHistory[newHistory.length - 1] = portfolioValue;
          }

          return {
            stocks: newStocks,
            assetHistory: newHistory,
          };
        });
      },

      resetPortfolio: () => {
        set({
          stocks: createInitialStocks(),
          cash: DEFAULT_CASH,
          realized: DEFAULT_REALIZED,
          assetHistory: [],
          daily30: generate30DayPerformance(),
        });
      },
    }),
    {
      name: 'taiwan-stock-portfolio',
      partialize: (state) => ({
        stocks: state.stocks,
        cash: state.cash,
        realized: state.realized,
        assetHistory: state.assetHistory,
        daily30: state.daily30,
        feeDiscount: state.feeDiscount,
      }),
    }
  )
);
