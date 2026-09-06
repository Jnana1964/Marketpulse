# MarkPulse

**Know what changed. Know what matters.**

A smart market watchlist built for the CODE 2026 by Groww engineering challenge.

---

## Problem

Every stock watchlist answers the same question: *"What is the current price?"*

None of them answer the question that actually matters to someone checking in a
few times a day: **"What changed since I last looked, why might it matter, and
what should I look at now?"**

## Solution

MarkPulse tracks a personal baseline for every stock in your watchlist — the
market state *you* last observed, not just the stock's daily previous close —
and compares your current view against it every time you check in. Instead of
a wall of tickers, you get:

- **Since your last check** — a plain-English summary of what actually moved.
- **Needs your attention** — the handful of stocks whose change is significant
  enough to be worth reviewing, ranked by an explainable importance score.
- **What stayed quiet** — an explicit, first-class "nothing happened" state,
  because most of the time, most stocks don't do anything interesting.

MarkPulse is deliberately **not** a trading platform, a portfolio tracker, or
an "AI-powered" black box. The intelligence is a deterministic, explainable
rules engine — every insight can be traced back to the exact market data and
threshold that produced it.

## Key Features

- Email/password authentication (bcrypt + JWT), protected routes
- Personal watchlists with a supported NSE instrument universe
- Market data via a real Groww API integration, with an honest, clearly
  labeled fallback to deterministic demo data when no credentials are present
- Per-user snapshot history — the mechanism behind "since you last checked"
- A meaningful-change engine: price movement, daily high/low proximity,
  intraday volatility, gap-from-open, and stale-data detection
- A 0–100 importance score with a plain-language attention level
  (Stable / Worth reviewing / Important / High priority)
- Data-freshness labeling (LIVE / DELAYED / STALE / DEMO DATA) — MarkPulse
  never claims data is live when it isn't
- Full change history and a per-check comparison view
- Responsive, dark, calm UI — sidebar on desktop, drawer on mobile

## Architecture

```
React (Vite, JS) ──▶ Express API ──▶ Market Data Service ──▶ Groww API
                                            │
                                            └──▶ Demo Data (deterministic fallback)
```

- The frontend never talks to Groww directly — every market-data call goes
  through the backend, so credentials never reach the browser.
- `growwService.js` is the *only* module that calls Groww's REST API. Every
  other layer (controllers, the change engine) works against the normalized
  internal shape (`{ symbol, exchange, price, open, high, low, previousClose,
  volume, timestamp, source, isLive }`), so a future provider change touches
  one file.
- `marketDataService.js` sits above `growwService` and handles caching,
  live/demo mode selection, and the LIVE/DELAYED/STALE/DEMO status a client
  actually sees.

### Database design

```
users ──< watchlists ──< watchlist_items ──< market_snapshots
  │                                       └──< change_events
  └──< user_sessions            watchlist_items ──< change_events
  └──< user_settings
  └──< notifications
```

Full DDL (tables, foreign keys, indexes) is in `database/schema.sql`.

- **`market_snapshots`** — one row per user, per stock, per "check". This is
  what makes "since you last checked" possible: a stock's price is compared
  against the user's *own* previous observation, never only against the
  day's previous close.
- **`user_sessions.last_market_check_at`** — the anchor for "since your last
  check", updated only *after* a comparison has been computed and returned.
- **`change_events`** — a persisted, queryable log of every meaningful change
  detected, powering the Changes and History pages.

## The Meaningful Change Engine

`backend/src/services/changeDetectionService.js` is the core of the product.
For every watchlist item, on every dashboard load or stock-detail view, in
this exact order:

1. Read the user's `last_market_check_at` (before anything is written).
2. Read the item's previous snapshot (the user's last observation of it).
3. Fetch the current market data (live Groww or demo).
4. Compare current vs. previous — price movement %, daily high/low
   proximity, intraday volatility ((high−low)/previousClose), gap from
   open, and data staleness.
5. Score importance (see below) and generate a deterministic, templated
   explanation — never a canned "+X%", always a reason.
6. Store the new snapshot and any new change events.
7. **Only then** advance `last_market_check_at`.

Step 7 happening last is deliberate: if it advanced first, the very
comparison being computed would be comparing the new snapshot against
itself. A first-time view of a stock is handled explicitly too — MarkPulse
says "first time tracking X", never a fabricated "+0.00% since last check".

### Importance scoring (0–100)

| Factor | Max points |
|---|---|
| Price movement since last check | 40 |
| Intraday volatility | 20 |
| Near daily high/low | 20 |
| Time since last check | 10 |
| Data freshness | 10 |

Scores map to attention levels: **0–29 Stable**, **30–59 Worth reviewing**,
**60–79 Important**, **80–100 High priority**. The `change_sensitivity`
setting (Low/Medium/High) scales how easily a move earns points — see
`importanceService.js`.

Every score is broken down (`importanceBreakdown` in the API response) so it
can be explained in an interview, not just trusted.

## Key Engineering Decisions

- **Groww's real REST API, not invented endpoints.** Groww's only official
  SDK (`growwapi`) is Python; there's no Node SDK. Rather than assume method
  names, the actual REST contract was pulled from Groww's own docs
  (`https://groww.in/trade-api/docs/curl`) — base URL `api.groww.in/v1`,
  `Authorization: Bearer <token>` + `X-API-VERSION: 1.0`, and the
  `/live-data/quote`, `/live-data/ltp`, `/live-data/ohlc`, and
  `/historical/candle/range` endpoints. `growwService.js` calls exactly
  those, with axios.
- **Demo data is deterministic, never random.** No `Math.random()`, no
  hardcoded "price goes up by X" script. Demo prices are a pure function of
  `(symbol, wall-clock time)` built from a couple of fixed-period sine waves
  with a per-symbol phase — same input always produces the same price, but
  prices still move plausibly between checks, which is what's needed to
  demo "since you last checked" honestly. Every demo response is tagged
  `source: 'demo'`, `isLive: false`, and the UI renders an explicit
  "DEMO DATA" label — it is never presented as live.
- **No live instrument search.** Groww's API doesn't expose one (only
  exact-symbol lookups). `/api/stocks/search` searches a fixed,
  backend-configured universe of 12 large-cap NSE stocks instead of
  pretending to hit a live search endpoint that doesn't exist.
- **Controlled, user-triggered snapshots over a fast poller.** A snapshot is
  written when a user actually loads the dashboard or a stock's detail page
  — not on a tight interval — which is what "since you last checked" means
  by definition, and avoids unbounded database growth. An optional
  background job (`jobs/marketSnapshotJob.js`) exists and can pre-warm
  snapshots for users with auto-refresh on, but it's **off by default**
  (`ENABLE_BACKGROUND_JOB=false`) and, importantly, never advances
  `last_market_check_at` itself — only a real user check does that,
  otherwise a background poll could silently hide changes the user hasn't
  actually seen yet.
- **A short in-memory cache (20s), not Redis.** One process, one cache Map
  keyed by `exchange_symbol`. Redis would be solving a scaling problem this
  app doesn't have yet.
- **Deterministic, template-based insights, not an LLM.** Every "why it
  matters" sentence is built from the same computed flags the importance
  score uses, so it's cheap, fast, and — critically — always explainable:
  there's no black box between the data and the sentence on screen.
- **JWT-derived identity everywhere.** `requireAuth` middleware verifies the
  token and attaches `req.user`; every controller uses `req.user.id`, never
  a client-supplied id, for every DB query.

## Tech Stack

- **Frontend:** React 19, Vite, JavaScript, React Router DOM, Tailwind CSS 4,
  lucide-react, axios, Recharts
- **Backend:** Node.js, Express, MySQL (`mysql2`), JWT (`jsonwebtoken`),
  `bcryptjs`, `dotenv`, `cors`
- **Market data:** Groww REST API (`https://api.groww.in/v1`), with a
  deterministic demo-mode fallback

## Setup

### 1. Database

```bash
mysql -u root -p < database/schema.sql
```

(Or point `database/schema.sql` at whatever MySQL user/host you use —
it creates the `markpulse` database and every table.)

### 2. Backend

```bash
cd backend
cp .env.example .env   # fill in DB credentials; leave GROWW_API_AUTH_TOKEN
                        # blank to run in demo mode
npm install
npm run dev             # http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev              # http://localhost:5173, proxies /api to :5000
```

Sign up, and a "My Watchlist" is created automatically. Add a few of the
supported NSE symbols (RELIANCE, TCS, INFY, HDFCBANK, ICICIBANK, ITC, SBIN,
TATAMOTORS, WIPRO, HINDUNILVR, BHARTIARTL, ASIANPAINT) from **My Watchlist →
Add Stock**, then watch the Dashboard, Changes, and History pages populate as
you check back in.

### Environment variables (`backend/.env`)

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 5000) |
| `CORS_ALLOWED_ORIGIN` | Frontend origin(s), comma-separated |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | MySQL connection |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Auth token signing |
| `MARKET_DATA_MODE` | `live` or `demo` |
| `GROWW_API_AUTH_TOKEN` | Daily access token from Groww's Trading APIs settings (blank = demo mode regardless of `MARKET_DATA_MODE`) |
| `ENABLE_BACKGROUND_JOB` | `true` to enable the optional background snapshot job (default `false`) |

### Groww API configuration

MarkPulse expects a Groww **access token** (`GROWW_API_AUTH_TOKEN`), the kind
generated manually from a Groww account's Trading APIs settings page. It
expires daily at 6:00 AM IST — MarkPulse does not attempt silent renewal;
when it's missing or a call fails for any reason (auth, rate limit, network,
malformed response), the app falls back to demo data and labels it
accordingly rather than erroring out or, worse, pretending nothing's wrong.
`GET /api/market/test` (no auth required) is a quick way to confirm which
mode is active and see a live sample quote.

## API Endpoints

```
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/auth/me

GET    /api/watchlists
POST   /api/watchlists
GET    /api/watchlists/:id
PUT    /api/watchlists/:id
DELETE /api/watchlists/:id
POST   /api/watchlists/:id/items
DELETE /api/watchlists/:id/items/:itemId

GET    /api/market/test
GET    /api/market/quote/:symbol
GET    /api/market/watchlist/:watchlistId
GET    /api/market/stock/:symbol
GET    /api/market/history/:symbol?range=1D|1W|1M|3M

GET    /api/insights/dashboard
GET    /api/insights/stock/:symbol
GET    /api/insights/changes?priority=&time=
GET    /api/insights/history
GET    /api/insights/history/:snapshotTime

GET    /api/stocks/search?q=

GET    /api/settings
PUT    /api/settings
```

(`/api/insights/history*` is an addition beyond the original endpoint list,
added to power the History page's "compare two checks" view — it reads
existing `market_snapshots` rows rather than a new table.)

## Trade-offs

- **Polling, not WebSockets.** A dashboard that refreshes every 30–60s (with
  `usePageVisibility` pausing it in background tabs) is simpler, easier to
  reason about, and sufficient for a personal watchlist — a WebSocket
  streaming layer would be solving a problem this product doesn't have.
- **Snapshots on user interaction, not a fast background poller.** See
  "Key Engineering Decisions" above — this is both the simpler
  implementation and the more correct one for what "since you last checked"
  actually means.
- **A rules-based importance score, not ML.** Deterministic and fully
  explainable beats a model that would need training data MarkPulse doesn't
  have, for a problem that doesn't need it.
- **Backend-only Groww access.** The frontend never sees API credentials or
  calls Groww directly — every request is proxied and normalized by the
  backend.

## Limitations

- Market data availability depends on having a valid, unexpired Groww access
  token; without one, MarkPulse runs entirely on deterministic demo data
  (clearly labeled as such throughout the UI).
- Groww's public API does not expose an instrument-search endpoint, so stock
  search is limited to a fixed, backend-configured universe of 12 NSE
  large-caps rather than the full exchange.
- The historical-candle endpoint MarkPulse uses
  (`/historical/candle/range`) is marked deprecated in Groww's own docs; its
  documented replacement's REST contract isn't published outside Groww's
  Python SDK, so this endpoint — the only one with a verifiable
  request/response shape — is used deliberately, with this limitation
  documented rather than hidden.
- Market-hours detection (`MARKET_OPEN` / `PRE_MARKET` / `POST_MARKET` /
  `MARKET_CLOSED`) is a clock-based approximation of NSE/BSE cash-segment
  hours; it does not account for exchange holidays.
- Single-process in-memory cache: fine for one backend instance, would need
  a shared cache (e.g. Redis) if ever horizontally scaled.

## Future Improvements

- Push/email notifications for high-priority changes (deliberately out of
  scope for this build — see the "DO NOT BUILD" list in the product spec)
- Automatic Groww token refresh via the API-key + checksum flow (currently
  a manually generated daily token is expected)
- Multiple watchlists per user in the UI (the backend and schema already
  support it; the frontend currently always uses the first/default one)
- A broader, dynamically fetched instrument universe if Groww exposes an
  instrument-master endpoint in the future

---

*Market information is provided for informational purposes only and does
not constitute investment advice.*
