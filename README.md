<div align="center">

# 📈 MarketPulse

### Know what changed. Know why it matters.

**A smart market watchlist built to surface meaningful stock movements instead of market noise.**

**Personal Baseline → Meaningful Change Detection → Explainable Importance → Clear Attention**

[![status](https://img.shields.io/badge/status-deployed-22C55E?style=flat-square)](https://marketpulse-f33j.onrender.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=flat-square)](https://jwt.io/)
[![Groww](https://img.shields.io/badge/Market%20Data-Groww-22D3C5?style=flat-square)](https://groww.in/)
[![tests](https://img.shields.io/badge/tests-backend-verified-22D3C5?style=flat-square)](https://github.com/Jnana1964/Marketpulse)

### Live: [marketpulse-f33j.onrender.com](https://marketpulse-f33j.onrender.com)

</div>

---

## 🚀 What this is, honestly

MarketPulse is a **smart market watchlist focused on one question**:

> **What changed since I last looked, why might it matter, and what should I review now?**

Most watchlists are optimized around displaying prices.

MarketPulse is designed around **attention**.

It maintains a personal baseline for the stocks a user tracks and compares the current market state against the user's previous observation.

That produces three useful outcomes:

- **Since your last check** — what actually changed.
- **Needs your attention** — which stocks deserve review.
- **What stayed quiet** — an explicit state when nothing meaningful happened.

MarketPulse is deliberately **not a trading platform, portfolio tracker, or black-box AI recommendation system**.

The core intelligence is deterministic and explainable.

---

## 🎯 The problem

A traditional watchlist answers:

> **"What is the current price?"**

But a user who checks the market a few times a day usually needs a different answer:

> **"What changed since I last looked?"**

And then:

> **"Why does that change matter?"**

MarketPulse is built specifically around that gap.

---

## 💡 The core idea

```text
                    USER CHECK
                        │
                        ▼
              Read personal baseline
                        │
                        ▼
                Fetch market data
                        │
                        ▼
            Compare current vs previous
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
       Price         Volatility      Range
       Move          / Gap           Position
          └─────────────┼─────────────┘
                        ▼
              Importance Score
                     0–100
                        │
                        ▼
              Attention Level
                        │
                        ▼
             Plain-language reason
                        │
                        ▼
             Store new snapshot
✨ Key Features
🔐 Authentication
Email/password authentication
JWT-based sessions
bcrypt password hashing
Protected frontend and backend routes
⭐ Smart Watchlist
Personal watchlist
Supported NSE stock universe
Add and remove stocks
User-specific tracking state
📊 Live Market Data
Groww REST API integration
Live quote data
OHLC data
Historical candle data
Real candlestick visualization
🔎 Meaningful Change Detection

MarketPulse evaluates:

Price movement since the user's last check
Intraday volatility
Distance from daily high/low
Gap from open
Time since last check
Data freshness
🎯 Explainable Importance Score
Score	Attention
0–29	Stable
30–59	Worth Reviewing
60–79	Important
80–100	High Priority

The score is composed from several measurable market signals rather than a black-box prediction.

🕒 Personal Snapshot History

The application stores the user's previous observation of a stock.

This is what enables:

"Since you last checked."

🧠 Explainable Insights

Every meaningful change is accompanied by a reason derived from the same signals used by the scoring engine.

🟢 Data Freshness

MarketPulse explicitly distinguishes:

LIVE
DELAYED
STALE
DEMO DATA

The application does not intentionally present simulated data as live data.

🖥️ Screenshots
Landing Page
<p align="center"> <img src="screenshots/landing.png" alt="MarketPulse Landing Page" width="950"> </p>
Dashboard
<p align="center"> <img src="screenshots/dashboard.png" alt="MarketPulse Dashboard" width="950"> </p>
Stock Details
<p align="center"> <img src="screenshots/stock-details.png" alt="MarketPulse Stock Details" width="950"> </p>
Smart Watchlist
<p align="center"> <img src="screenshots/watchlist.png" alt="MarketPulse Smart Watchlist" width="950"> </p>
What's Changed
<p align="center"> <img src="screenshots/changes.png" alt="MarketPulse What's Changed" width="950"> </p>
Stock Search
<p align="center"> <img src="screenshots/search.png" alt="MarketPulse Stock Search" width="950"> </p>
Authentication
<table align="center"> <tr> <td align="center"> <img src="screenshots/login.png" width="450"> <br> <strong>Login</strong> </td> <td align="center"> <img src="screenshots/signup.png" width="450"> <br> <strong>Signup</strong> </td> </tr> </table>
Settings
<p align="center"> <img src="screenshots/settings.png" alt="MarketPulse Settings" width="950"> </p>
🏗️ Architecture
┌──────────────────────────────────────────────┐
│              MarketPulse Frontend            │
│            React + Vite + Axios              │
└──────────────────────┬───────────────────────┘
                       │
                       │ HTTPS REST API
                       ▼
┌──────────────────────────────────────────────┐
│             MarketPulse Backend              │
│              Node.js + Express               │
└───────────────┬───────────────┬──────────────┘
                │               │
                ▼               ▼
        ┌──────────────┐   ┌─────────────────┐
        │    MySQL     │   │ Market Data     │
        │   Database   │   │    Service      │
        └──────────────┘   └────────┬────────┘
                                    │
                       ┌────────────┴────────────┐
                       ▼                         ▼
                 ┌───────────┐            ┌────────────┐
                 │ Groww API │            │ Demo Data  │
                 │ Live Data │            │ Fallback   │
                 └───────────┘            └────────────┘
Important architecture decisions

The frontend never talks directly to Groww.

All market-data requests pass through the backend, keeping credentials server-side.

The backend normalizes provider responses into a common internal market-data shape so the rest of the application does not depend directly on the external provider implementation.

🗄️ Database Design
users
  │
  ├── watchlists
  │       │
  │       └── watchlist_items
  │                 │
  │                 ├── market_snapshots
  │                 │
  │                 └── change_events
  │
  ├── user_sessions
  ├── user_settings
  └── notifications
Key tables

market_snapshots

Stores the market state observed by each user for each tracked stock.

change_events

Stores meaningful changes detected by the change engine and powers the Changes and History experiences.

The complete DDL is maintained in:

database/schema.sql
🧠 The Meaningful Change Engine

The core logic lives in:

backend/src/services/changeDetectionService.js

For every tracked stock:

1. Read user's last market check
          ↓
2. Read previous user snapshot
          ↓
3. Fetch current market data
          ↓
4. Compare current vs previous state
          ↓
5. Calculate importance score
          ↓
6. Generate deterministic explanation
          ↓
7. Store snapshot and change event
          ↓
8. Advance last_market_check_at

The final step intentionally happens last.

This prevents the current observation from becoming the baseline against which it compares itself.

📐 Importance Scoring
Factor	Max Points
Price movement since last check	40
Intraday volatility	20
Near daily high/low	20
Time since last check	10
Data freshness	10
Total	100

Attention levels:

0–29    Stable
30–59   Worth Reviewing
60–79   Important
80–100  High Priority

The API also exposes the score breakdown so the decision can be inspected and explained.

🔌 Groww Integration

MarketPulse uses the Groww Trading API through the backend.

The implementation supports:

/live-data/quote
/live-data/ltp
/live-data/ohlc
/historical/candle/range

The backend keeps the Groww access token private.

The browser receives normalized market information rather than the provider credential.

🟢 Live Data vs Demo Data

MarketPulse supports:

MARKET_DATA_MODE=live

and:

MARKET_DATA_MODE=demo

When valid live credentials are available, the backend requests live market data.

When live credentials are unavailable or a live request fails, the system can fall back to deterministic demo data.

Demo responses are explicitly marked as:

source: demo
isLive: false

and the interface displays:

DEMO DATA

rather than pretending the data is live.

🛠️ Tech Stack
Frontend
React
Vite
JavaScript
React Router DOM
Tailwind CSS
Axios
Recharts
Lucide React
Backend
Node.js
Express.js
MySQL
mysql2
JWT
bcryptjs
dotenv
CORS
Market Data
Groww REST API
Deterministic demo fallback
Deployment
Render Static Site — Frontend
Render Web Service — Backend
MySQL — Database
📁 Project Structure
Marketpulse/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── jobs/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   │
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── utils/
│   │
│   ├── package.json
│   └── vite.config.js
│
├── database/
│   └── schema.sql
│
├── screenshots/
│   ├── landing.png
│   ├── dashboard.png
│   ├── stock-details.png
│   ├── watchlist.png
│   ├── changes.png
│   ├── search.png
│   ├── login.png
│   ├── signup.png
│   └── settings.png
│
├── .gitignore
└── README.md
🚀 Local Setup
1. Clone
git clone https://github.com/Jnana1964/Marketpulse.git
cd Marketpulse
2. Database
mysql -u root -p < database/schema.sql
3. Backend
cd backend
npm install
npm run dev

Backend:

http://localhost:5000
4. Frontend

Open another terminal:

cd frontend
npm install
npm run dev

Frontend:

http://localhost:5173
🔐 Environment Variables
Backend

Create:

backend/.env

Example:

PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=markpulse
DB_USER=root
DB_PASSWORD=your_password

JWT_SECRET=your_secret
JWT_EXPIRES_IN=7d

MARKET_DATA_MODE=live
GROWW_API_AUTH_TOKEN=your_groww_token

CORS_ALLOWED_ORIGIN=http://localhost:5173

ENABLE_BACKGROUND_JOB=false
Frontend

Production frontend configuration:

VITE_API_URL=https://marketpulse-api-8rfn.onrender.com

Never commit .env files or API credentials to GitHub.

🌐 Production
Frontend

Live Application

https://marketpulse-f33j.onrender.com

Backend

Live API

https://marketpulse-api-8rfn.onrender.com

Deployment Architecture
GitHub
   │
   ├──────────────► Render Static Site
   │                   │
   │                   ▼
   │             React Frontend
   │
   └──────────────► Render Web Service
                       │
                       ▼
                 Node + Express
                       │
              ┌────────┴────────┐
              ▼                 ▼
            MySQL            Groww API
🔌 API Endpoints
Authentication
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me
Watchlists
GET    /api/watchlists
POST   /api/watchlists
GET    /api/watchlists/:id
PUT    /api/watchlists/:id
DELETE /api/watchlists/:id

POST   /api/watchlists/:id/items
DELETE /api/watchlists/:id/items/:itemId
Market
GET /api/market/test
GET /api/market/quote/:symbol
GET /api/market/watchlist/:watchlistId
GET /api/market/stock/:symbol
GET /api/market/history/:symbol?range=1D|1W|1M|3M
Insights
GET /api/insights/dashboard
GET /api/insights/stock/:symbol
GET /api/insights/changes?priority=&time=
GET /api/insights/history
GET /api/insights/history/:snapshotTime
Search
GET /api/stocks/search?q=
Settings
GET /api/settings
PUT /api/settings
🧪 Validation

Frontend production build:

cd frontend
npm run build

Backend tests:

cd backend
npm test
🤔 Key Engineering Decisions
Why a personal baseline?

Because a meaningful change depends on when that particular user last looked.

Why deterministic explanations?

Because every explanation can be traced back to measurable market signals.

Why snapshots?

Because the product's core question is:

"What changed since I last checked?"

Why backend-only Groww access?

To keep provider credentials away from the browser.

Why not build a trading platform?

Because MarketPulse is intentionally focused on market awareness and attention, not order execution.

⚠️ Limitations
Live market data depends on a valid, unexpired Groww access token.
Groww authentication tokens expire and require renewal according to the provider's authentication flow.
Stock search is limited to the backend-configured supported NSE universe.
Historical candle retrieval depends on the Groww endpoint used by the current implementation.
Market-hours detection is an approximation and does not model every exchange holiday.
The current cache is in-memory and intended for the current single-instance architecture.
🔮 Future Improvements
Automatic Groww token refresh
Broader instrument discovery
Multiple watchlists in the frontend
Shared distributed cache
High-priority push/email notifications
More advanced historical analysis
🚫 What MarketPulse Is Not

MarketPulse is intentionally not:

A trading platform
A buy/sell application
A portfolio manager
A crypto exchange
A social trading platform
An AI chatbot

It solves one focused problem:

Help users understand what changed since they last checked.

👩‍💻 Author
Jnana Keerthana

GitHub:
https://github.com/Jnana1964

Project Repository:
https://github.com/Jnana1964/Marketpulse

<div align="center">
MarketPulse

Know what changed. Know why it matters.

🌐 Live App ·
⚙️ Backend API ·
💻 GitHub

</div>
