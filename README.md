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

### 🌐 Live Application

**[marketpulse-f33j.onrender.com](https://marketpulse-f33j.onrender.com)**

### ⚙️ Backend API

**[marketpulse-api-8rfn.onrender.com](https://marketpulse-api-8rfn.onrender.com)**

</div>

---

# 🚀 What This Is, Honestly

MarketPulse is a **smart market watchlist focused on one question**:

> ## What changed since I last looked, why might it matter, and what should I review now?

Most watchlists are optimized around displaying prices.

MarketPulse is designed around **attention**.

Instead of simply showing a stock's latest price, MarketPulse maintains a **personal baseline** for the stocks a user tracks and compares the current market state against the user's previous observation.

That produces three useful outcomes:

- **Since your last check** — what actually changed.
- **Needs your attention** — which stocks deserve review.
- **What stayed quiet** — an explicit state when nothing meaningful happened.

MarketPulse is deliberately **not a trading platform, portfolio tracker, or black-box AI recommendation system**.

The core intelligence is **deterministic and explainable**.

---

# 🎯 The Problem

A traditional watchlist answers:

> ## "What is the current price?"

But a user who checks the market a few times a day usually needs a different answer:

> ## "What changed since I last looked?"

And then:

> ## "Why does that change matter?"

Financial dashboards often create information overload.

Users may see:

- Current prices
- Percentage changes
- Charts
- Highs and lows
- Volume
- Multiple indicators

But they still need to manually figure out:

> **What deserves my attention right now?**

MarketPulse is built specifically around that gap.

---

# 💡 The Core Idea

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

The product flow is intentionally simple:

Observe → Compare → Score → Explain → Prioritize

✨ Key Features
🔐 Authentication
Email/password authentication
JWT-based sessions
bcrypt password hashing
Protected frontend routes
Protected backend routes
Secure authenticated API requests
⭐ Smart Watchlist

Users can:

Create and manage a personal watchlist
Track supported NSE stocks
Add stocks
Remove stocks
Maintain user-specific tracking state

Every user's market baseline is personal.

📊 Live Market Data

MarketPulse integrates market data through the backend.

Supported market information includes:

Live quote data
Last traded price
OHLC data
Historical candle data
Intraday market information
Historical market ranges
🕯️ Real Candlestick Visualization

The stock details experience supports historical market visualization using:

Open
High
Low
Close

The application visualizes price movement using candlestick-style market charts, making it easier to understand:

Bullish movement
Bearish movement
Intraday price movement
Historical price direction
Market volatility

Available ranges include:

1D
1W
1M
3M
🔎 Meaningful Change Detection

MarketPulse does not treat every small market movement as important.

The application evaluates:

Price movement since the user's last check
Intraday volatility
Distance from daily high/low
Gap from open
Time since last check
Data freshness

The goal is to reduce noise.

🎯 Explainable Importance Score

Each tracked stock receives an importance score.

Score	Attention
0–29	🟢 Stable
30–59	🟡 Worth Reviewing
60–79	🟠 Important
80–100	🔴 High Priority

The score is composed from several measurable market signals rather than a black-box prediction.

Every important result can be explained.

🕒 Personal Snapshot History

The application stores the user's previous observation of a stock.

This enables one of the core MarketPulse experiences:

"Since you last checked."

Instead of comparing only against yesterday's closing price, MarketPulse can compare the current market state against the user's previous observation.

This makes the experience personal and context-aware.

🧠 Explainable Insights

Every meaningful change is accompanied by a reason derived from the same signals used by the scoring engine.

Examples include:

Trading near today's high
Trading near today's low
Larger than usual intraday range
Significant movement since the previous check
Meaningful gap from the market open
High importance due to multiple signals

The system is intentionally explainable.

No black-box recommendations.

🟢 Data Freshness

MarketPulse explicitly distinguishes between market data states.

Possible states include:

LIVE
DELAYED
STALE
DEMO DATA

The application does not intentionally present simulated data as live market data.

When demo data is used, the interface explicitly identifies it.

🖥️ Product Experience

MarketPulse includes the following major experiences.

🏠 Landing Page

The landing page introduces the product's central idea:

Know what changed. Know why it matters.

It communicates the difference between:

Traditional price-focused watchlists
Attention-focused market awareness
📊 Dashboard

The dashboard answers three important questions:

1. What am I tracking?

A quick overview of the user's watchlist.

2. What changed?

Meaningful market changes since the user's previous observation.

3. What should I review?

Stocks prioritized using the importance scoring engine.

The dashboard focuses on clarity instead of information overload.

⭐ Smart Watchlist

Users can manage tracked stocks and see:

Current price
Percentage movement
Attention status
Meaningful changes
Market state
🔔 What's Changed

This page focuses specifically on:

What changed since the user last checked?

It surfaces meaningful events instead of displaying every small movement.

🔎 Stock Search

Users can search supported NSE stocks and add them to their watchlist.

📈 Stock Details

The stock details page provides a deeper market view.

It includes:

Current price
Daily change
Candlestick visualization
Historical market data
Open
High
Low
Previous close
Intraday range
Gap from open
Volume
Importance score
Attention level
Meaningful change explanation
"Since you last checked" comparison
🕒 History

The application stores market observations and meaningful events.

This makes it possible to understand how a tracked stock changed over time.

⚙️ Settings

Users can manage application-level preferences and tracking behavior.

🖼️ Screenshots
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
<table align="center"> <tr> <td align="center"> <img src="screenshots/login.png" width="450"> <br>

<strong>Login</strong>

</td> <td align="center"> <img src="screenshots/signup.png" width="450"> <br>

<strong>Signup</strong>

</td> </tr> </table>
Settings
<p align="center"> <img src="screenshots/settings.png" alt="MarketPulse Settings" width="950"> </p>
🏗️ Architecture
┌──────────────────────────────────────────────┐
│              MarketPulse Frontend            │
│                                              │
│          React + Vite + Axios                │
└──────────────────────┬───────────────────────┘
                       │
                       │ HTTPS REST API
                       ▼
┌──────────────────────────────────────────────┐
│              MarketPulse Backend             │
│                                              │
│             Node.js + Express                │
└───────────────┬────────────────┬─────────────┘
                │                │
                ▼                ▼

        ┌──────────────┐   ┌─────────────────┐
        │    MySQL     │   │   Market Data   │
        │   Database   │   │     Service     │
        └──────────────┘   └────────┬────────┘
                                    │
                         ┌──────────┴───────────┐
                         ▼                      ▼

                   ┌───────────┐          ┌────────────┐
                   │ Groww API │          │ Demo Data  │
                   │ Live Data │          │ Fallback   │
                   └───────────┘          └────────────┘
🏗️ Important Architecture Decisions
Frontend Never Talks Directly to Groww

The frontend communicates only with the MarketPulse backend.

Browser
   │
   ▼
MarketPulse Backend
   │
   ▼
Market Data Provider

This ensures:

Provider credentials remain server-side
API logic is centralized
External responses can be normalized
The frontend remains independent from provider implementation details
Backend Normalization

The backend normalizes provider responses into a common internal market-data structure.

This prevents the rest of the application from being tightly coupled to an external market data provider.

Personal Baseline

The system stores observations per user.

This means:

User A checks TCS at 10:00 AM
User B checks TCS at 1:00 PM

The baseline is different for each user.

Therefore:

Meaningful change is personal.

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
  │
  ├── user_settings
  │
  └── notifications
📦 Key Tables
market_snapshots

Stores the market state observed by each user for each tracked stock.

This supports:

Previous observations
Personal baseline comparison
Historical tracking
"Since you last checked"
change_events

Stores meaningful changes detected by the change engine.

This powers:

What's Changed
Dashboard insights
History
Attention prioritization
Database Schema

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

This prevents the current observation from immediately becoming the baseline against which it compares itself.

📐 Importance Scoring

The importance score is calculated from measurable market signals.

Factor	Maximum Points
Price movement since last check	40
Intraday volatility	20
Near daily high/low	20
Time since last check	10
Data freshness	10
Total	100
🎯 Attention Levels
0–29     Stable

30–59    Worth Reviewing

60–79    Important

80–100   High Priority

The API also exposes score information so the result can be inspected and explained.

🔌 Groww Integration

MarketPulse integrates Groww market data through the backend.

Supported endpoints include:

/live-data/quote

/live-data/ltp

/live-data/ohlc

/historical/candle/range

The Groww access token remains on the backend.

The browser does not receive provider credentials.

🟢 Live Data vs Demo Data

MarketPulse supports two market data modes.

Live Mode
MARKET_DATA_MODE=live

When valid credentials are available, the backend requests live market data.

Demo Mode
MARKET_DATA_MODE=demo

When live credentials are unavailable or a live request fails, the application can use deterministic demo data.

Demo responses are explicitly marked:

source: demo

isLive: false

The UI displays:

DEMO DATA

The system does not intentionally pretend demo data is live.

🛠️ Tech Stack
Frontend
React
React 19
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
│   │
│   ├── src/
│   │   │
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── jobs/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   │
│   ├── package.json
│   │
│   └── .env.example
│
├── frontend/
│   │
│   ├── public/
│   │
│   ├── src/
│   │   │
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── utils/
│   │
│   ├── package.json
│   │
│   └── vite.config.js
│
├── database/
│   │
│   └── schema.sql
│
├── screenshots/
│   │
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
│
└── README.md
🚀 Local Setup
1️⃣ Clone the Repository
git clone https://github.com/Jnana1964/Marketpulse.git
cd Marketpulse
2️⃣ Database Setup

Create and configure MySQL.

Run:

mysql -u root -p < database/schema.sql

This creates the required database structure.

3️⃣ Backend Setup

Open a terminal.

cd backend

Install dependencies:

npm install

Start the development server:

npm run dev

Backend:

http://localhost:5000
4️⃣ Frontend Setup

Open another terminal.

cd frontend

Install dependencies:

npm install

Start the frontend:

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
🌐 Frontend Environment Variables

Production frontend configuration:

VITE_API_URL=https://marketpulse-api-8rfn.onrender.com

For local development, configure the frontend API URL according to your backend environment.

⚠️ Security

Never commit:

.env

or:

API credentials
Database passwords
JWT secrets
Groww access tokens

to GitHub.

Always use environment variables.

🌐 Production Deployment
Frontend
Live Application

🌐 https://marketpulse-f33j.onrender.com

Backend
Live API

⚙️ https://marketpulse-api-8rfn.onrender.com

🚀 Deployment Architecture
GitHub
   │
   ├────────────────────► Render Static Site
   │                         │
   │                         ▼
   │                   React Frontend
   │
   │
   └────────────────────► Render Web Service
                             │
                             ▼
                       Node + Express
                             │
                   ┌─────────┴─────────┐
                   ▼                   ▼

                 MySQL              Groww API
🔌 API Endpoints
🔐 Authentication
POST /api/auth/signup
POST /api/auth/login
GET /api/auth/me
⭐ Watchlists
GET /api/watchlists
POST /api/watchlists
GET /api/watchlists/:id
PUT /api/watchlists/:id
DELETE /api/watchlists/:id
📌 Watchlist Items
POST /api/watchlists/:id/items
DELETE /api/watchlists/:id/items/:itemId
📊 Market
GET /api/market/test
GET /api/market/quote/:symbol
GET /api/market/watchlist/:watchlistId
GET /api/market/stock/:symbol
GET /api/market/history/:symbol?range=1D|1W|1M|3M
🧠 Insights
GET /api/insights/dashboard
GET /api/insights/stock/:symbol
GET /api/insights/changes?priority=&time=
GET /api/insights/history
GET /api/insights/history/:snapshotTime
🔎 Stock Search
GET /api/stocks/search?q=
⚙️ Settings
GET /api/settings
PUT /api/settings
🧪 Validation
Frontend Production Build
cd frontend
npm run build
Backend Tests
cd backend
npm test
🤔 Key Engineering Decisions
Why a Personal Baseline?

Because a meaningful change depends on when that particular user last looked.

A 2% price movement may be meaningful to one user and irrelevant to another depending on their previous observation.

Why Deterministic Explanations?

Because every explanation should be traceable to measurable market signals.

MarketPulse prioritizes:

Transparency
Explainability
Predictability

over black-box recommendations.

Why Snapshots?

Because the product's core question is:

"What changed since I last checked?"

Snapshots make that comparison possible.

Why Backend-Only Groww Access?

To keep provider credentials away from the browser.

The backend acts as the secure integration layer between:

Frontend
   ↓
Backend
   ↓
Market Data Provider
Why Not Build a Trading Platform?

Because MarketPulse is intentionally focused on:

Market awareness and attention.

Not:

Order execution
Buying stocks
Selling stocks
Portfolio management
⚠️ Limitations

Current limitations include:

Live market data depends on a valid, unexpired Groww access token.
Groww authentication tokens expire and require renewal according to the provider's authentication flow.
Stock search is limited to the backend-configured supported NSE universe.
Historical candle retrieval depends on the Groww endpoint used by the current implementation.
Market-hours detection is an approximation and does not model every exchange holiday.
The current cache is in-memory and intended for the current single-instance architecture.
🔮 Future Improvements

Potential improvements include:

Automatic Groww token refresh
Broader instrument discovery
Multiple watchlists in the frontend
Shared distributed cache
High-priority push notifications
Email notifications
More advanced historical analysis
Additional technical indicators
Improved historical comparisons
Better market-hours handling
Scalable multi-instance caching
🚫 What MarketPulse Is Not

MarketPulse is intentionally not:

❌ A trading platform

❌ A buy/sell application

❌ A portfolio manager

❌ A crypto exchange

❌ A social trading platform

❌ An AI chatbot

It solves one focused problem:

Help users understand what changed since they last checked.
💎 What Makes MarketPulse Different?

Most stock applications answer:

What is the price now?

MarketPulse asks:

What changed since you last checked?

That difference drives the entire architecture.

Traditional Market App

Price
  ↓
Charts
  ↓
Numbers
  ↓
User decides what matters

MarketPulse:

Personal Baseline
        ↓
Current Market Data
        ↓
Meaningful Comparison
        ↓
Importance Score
        ↓
Explainable Reason
        ↓
Clear Attention

The goal is simple:

Less market noise. More meaningful attention.
👩‍💻 Author
Jnana Keerthana

GitHub:

https://github.com/Jnana1964

Project Repository:

https://github.com/Jnana1964/Marketpulse

<div align="center">
📈 MarketPulse
Know what changed. Know why it matters.

A smart market watchlist built around attention, context, and explainability.

🌐 Live App

⚙️ Backend API

💻 GitHub Repository

Personal Baseline → Meaningful Change Detection → Explainable Importance → Clear Attention
</div> ```
