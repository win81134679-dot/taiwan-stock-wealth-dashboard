@AGENTS.md

# 台股資產儀表板 (Taiwan Stock Wealth Dashboard)

單人用、無登入的台股投資組合儀表板。手動記帳持倉 → 透過 Yahoo Finance 抓即時報價
→ 計算資產淨值 / 損益 / 配置，並以深色金融風 UI 呈現。可安裝為 PWA、部署於 Vercel。

> ⚠️ 本專案使用 **Next.js 16.2.9 + React 19**，屬非常新的版本，API 與慣例可能與你的
> 訓練資料不同。改 code 前請先查 `node_modules/next/dist/docs/`（詳見 AGENTS.md）。

---

## 開發指令

```bash
npm install      # 安裝相依
npm run dev      # 開發伺服器 (http://localhost:3000)
npm run build    # 生產建置
npm run start    # 啟動生產建置
npm run lint     # ESLint
```

需要 Node.js（建議 LTS）。本機可不設定任何環境變數即執行（自動退回純本機模式）。

---

## 技術棧

| 類別 | 技術 |
|------|------|
| 框架 | Next.js 16.2.9（App Router） + React 19 |
| 語言 | TypeScript 5 |
| 樣式 | Tailwind CSS v4（透過 PostCSS，無 tailwind.config，採 v4 設定方式） |
| 狀態 | Zustand 5 + `persist` middleware（→ localStorage） |
| 圖表 | Recharts 3 |
| 雲端儲存 | Upstash Redis（選用；未設定時自動降級為純本機） |
| 資料來源 | Yahoo Finance v8 chart API（報價）、Yahoo RSS（新聞） |
| 部署 | Vercel（含 Cron 定時任務） |

---

## 架構與資料流（三層）

```
瀏覽器 (Client)
  Zustand store (lib/store.ts)
    ├─ persist → localStorage（離線可用）
    └─ useQuotes hook → 定時輪詢報價
        │ 呼叫自家 API(避開 CORS)
        ▼
Next.js API Routes (app/api/*)
  /api/quote      → Yahoo 即時報價(並行多檔, 單檔失敗不影響其他)
  /api/news       → Yahoo RSS 財經新聞
  /api/portfolio  → 讀寫雲端持倉 (GET / PUT)
  /api/cron/...   → 每日收盤淨值快照(Vercel Cron 觸發)
  /api/og         → 動態 OG 分享圖
        │
        ▼
外部服務：Yahoo Finance / Upstash Redis
```

**雲端為權威來源**：若有設定 Redis，啟動時 `loadFromCloud()` 用雲端資料覆蓋本機；
每次交易/現金變動後 `syncToCloud()` 寫回（last-write-wins）。未設定 Redis 則純跑
localStorage，跨裝置不同步。

---

## 狀態管理 — `lib/store.ts`（核心）

中央 Zustand store，持有：`holdings`（持倉字典，key=代號）、`cash`、`realized`
（已實現損益）、`snapshots`（每日淨值）、`quotesDate`（最新報價所屬台北交易日）、
`feeDiscount`（手續費折數）、`modal`（交易彈窗狀態）。

- **持久化（partialize）**：`holdings / cash / realized / snapshots / feeDiscount /
  quotesDate` 會存進 localStorage（key：`tw-stock-portfolio-v2`）。
- **雲端同步**：`loadFromCloud` / `syncToCloud` 與 `/api/portfolio` 互動；
  持倉 / 現金 / 已實現 / 每日快照上雲，其餘為本機狀態。
- `getPortfolioValue()` = 現金 + Σ(股數 × (即時價 ?? 成本))；
  `getPortfolioCost()` = 現金 + Σ(股數 × 成本)。

### ⚠️ 記帳語意（最重要、最反直覺）

現金、持倉、已實現損益是**三個獨立帳本**，交易時不互相連動：

- **買進** → 只「登記持倉」（更新股數/加權平均成本），**不扣現金**。
- **賣出 / 平倉** → 計入「已實現損益」，**不加現金**。
- **現金部位**完全由使用者在 UI 上方「現金部位 ✎」**手動維護**。

（與一般券商 App「買進自動扣款」不同，新進維護者務必先理解此點，見
`lib/store.ts` 的 `confirmTrade` / `closePosition` 註解。）

---

## 即時報價與淨值曲線

### 輪詢 — `lib/hooks/useQuotes.ts`
依台北時區判斷盤別（週一~五 09:00–13:30 為盤中）：
- 盤中：每 **30 秒**抓一次；收盤後：每 **5 分鐘**抓一次。
- 每次成功取得報價 → `applyQuotes()` 更新即時價與 `quotesDate` → `recordNav()`
  寫入當日「每日淨值快照」（僅在全持股都有真實報價時記錄）。

### 今日盤中走勢（1D）— `lib/intraday.ts`
1D 曲線**不靠採樣累積**，而是用各持股「今日每分鐘收盤序列」（Yahoo `intraday`，
已前向填補、時間軸對齊）乘股數再加總現金，直接合成今日真實 NAV 曲線：
- `buildIntradayNav(holdings, cash)` → `{ series, base }`；`base` 以**昨收**計，
  故「曲線終點 − base = 今日損益」，與資產環的今日數字一致。
- 開盤後任何時間打開都能看到一整天形狀，不受「網頁開多久」影響。
- **08:30 清空 / 防殘留**：`NetWorthTrend` 只在「台北時間 ≥ 08:30 **且**
  `quotesDate == 今日`」時顯示，否則清空並提示「尚未開盤」。`quotesDate` 由
  `applyQuotes` 取 Yahoo 最新成交時間換算，確保跨夜 / 盤前 / 假日不殘留昨日線。
- 近似說明：以「目前股數」回推整日，盤中加減碼時早盤段會以現股數計。

### 每日快照 — `lib/snapshots.ts`（1W / 1M / 1Y）
純前端無法畫「沒開網頁那天」的點，故雙軌互補：
- **前端**：每次算出淨值，以台北當日日期 upsert 進 localStorage（同日覆蓋、跨日新增，
  最多 120 筆 ≈ 4 個月）。
- **雲端 Cron**：`vercel.json` 設定每週一~五 UTC 06:00（= 台北 14:00 收盤後）觸發
  `/api/cron/snapshot`，伺服器端抓收盤價算淨值寫進 Redis，沒開網頁也能補點。

走勢圖 `NetWorthTrend`：`1D` 用 `buildIntradayNav` 合成今日曲線；
`1W/1M/1Y` 用每日 `snapshots` 切片。

---

## 財務計算 — `lib/calculator.ts`

- 手續費 = 成交額 × 0.1425% × 折數，**最低 20 元**。
- 證交稅 = 賣出時成交額 × 0.3%（買進不收）。
- 加權平均成本：買進時把當次手續費攤入成本。
- 折數預設 0.6（6 折），可於交易彈窗切換 5 折 / 6 折 / 原價。

---

## 目錄結構

```
app/
  page.tsx              主頁面：組裝各區塊、計算統計卡片數據
  layout.tsx            HTML 殼層、SEO / PWA metadata
  globals.css           Tailwind 全域樣式
  api/
    quote/route.ts          即時報價(並行抓多檔, Promise.allSettled)
    news/route.ts           Yahoo RSS 新聞(手寫 regex 解析 XML)
    portfolio/route.ts      雲端持倉 GET / PUT
    cron/snapshot/route.ts  每日收盤淨值快照
    og/route.tsx            動態 OG 分享圖
lib/
  types.ts              Holding 型別、產業配色、漲跌色常數
  store.ts              ★ Zustand 中央狀態 + 所有交易邏輯
  calculator.ts         手續費 / 稅 / 格式化純函式
  yahoo-server.ts       伺服器端 Yahoo 封裝(雙主機容錯、.TW/.TWO 自動判斷)
  yahoo-client.ts       客戶端呼叫自家 API
  redis.ts              Upstash 讀寫(相容 KV_* 與 UPSTASH_* 兩種環境變數)
  snapshots.ts          每日淨值快照(localStorage + 純函式 upsert)
  portfolio-client.ts   客戶端同步雲端持倉
  stock-names.ts        常見台股代號 → 中文名 + 產業對照表
  register-sw.ts        註冊 Service Worker
  hooks/useQuotes.ts    ★ 報價輪詢 hook + 盤別判斷 + recordNav 觸發
components/
  Hero/      AssetRing(canvas 資產環)、NetWorthTrend(淨值走勢圖)
  Layout/    Header、NewsTicker(新聞跑馬燈)、BackupBar(匯入匯出備份)
  Portfolio/ AllocationDonut(產業配置)、HoldingsList(持股清單)
  Stats/     StatCard(統計卡)、PerformanceDots(30 日績效點陣)
  Trade/     TradeModal(交易/委託試算彈窗, 含代號查詢)
  PWA/       InstallPrompt(安裝提示)
public/      manifest.json、sw.js、圖示、SVG
scripts/     generate-icons.mjs(用 canvas 產生 PWA 圖示)
```

---

## API Routes

| 路徑 | 方法 | 說明 |
|------|------|------|
| `/api/quote?codes=2330,0050` | GET | 並行抓多檔即時報價，單檔失敗不影響其他（上限 50 檔） |
| `/api/news` | GET | Yahoo 財經 RSS，回傳最多 12 則 |
| `/api/portfolio` | GET / PUT | 讀 / 寫雲端持倉（需 Redis） |
| `/api/cron/snapshot` | GET | 每日收盤淨值快照；可手動 GET 測試（若設 `CRON_SECRET` 需帶 Bearer） |
| `/api/og` | GET | 動態產生 OG 分享圖 |

---

## 環境變數（皆選用，全部不設也能跑）

| 變數 | 用途 |
|------|------|
| `UPSTASH_REDIS_REST_URL` 或 `KV_REST_API_URL` | Redis 端點（二擇一） |
| `UPSTASH_REDIS_REST_TOKEN` 或 `KV_REST_API_TOKEN` | Redis token（二擇一） |
| `CRON_SECRET` | 保護 cron 端點（選用） |

---

## 慣例

- **紅漲綠跌**：符合台股習慣（`COLOR.UP = 紅`、`COLOR.DOWN = 綠`，定義於 `lib/types.ts`）。
- 客戶端**一律透過自家 API** 取外部資料（避開 CORS、隱藏 UA）。
- 即時欄位（price / prevClose / intraday）由 API 每次填入；持久化欄位
  （code / name / sector / shares / cost）由使用者記帳。
- 主要 UI 文案為繁體中文，字體採 serif 標題 + IBM Plex Mono 數字。

---

## 已知限制

- **單一使用者**：Redis key 寫死 `portfolio:default`，無帳號系統，所有人共用同一份雲端資料。
- 現金需手動維護（見上方「記帳語意」），易被誤解。
- 新聞以 regex 解析 RSS，Yahoo 改格式即可能失效。
- 純前端的 `1D` 盤中曲線只在開著網頁時累積；長期走勢靠每日快照 + 雲端 Cron 補點。
