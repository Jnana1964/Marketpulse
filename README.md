# 📈 MarketPulse

### Know what changed. Know why it matters.

<p align="center">
  <strong>A smart market watchlist that helps you focus on meaningful stock movements instead of market noise.</strong>
</p>

<p align="center">
  Built for the <strong>CODE 2026 by Groww Engineering Challenge</strong>
</p>

<p align="center">

[![Live Frontend](https://img.shields.io/badge/Live%20App-MarketPulse-22D3C5?style=for-the-badge&logo=vercel&logoColor=white)](https://marketpulse-f33j.onrender.com)
[![Backend API](https://img.shields.io/badge/API-Live-22D3C5?style=for-the-badge&logo=render&logoColor=white)](https://marketpulse-api-8rfn.onrender.com)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/Jnana1964/Marketpulse)

</p>

---

## 🚀 Live Demo

### 🌐 Frontend
**https://marketpulse-f33j.onrender.com**

### ⚙️ Backend API
**https://marketpulse-api-8rfn.onrender.com**

> The frontend communicates with the backend through HTTPS REST APIs.
> Market-data credentials remain server-side and are never exposed to the browser.

---

# 🧭 What is MarketPulse?

Most stock watchlists answer:

> "What is the current price?"

MarketPulse focuses on the question that matters more:

> **"What changed since I last looked, why might it matter, and what should I review now?"**

MarketPulse maintains a personal baseline for every stock in a user's watchlist and compares the current market state against the user's previous observation.

Instead of overwhelming the user with a wall of tickers, MarketPulse surfaces:

- **Since your last check** — what actually changed.
- **Needs your attention** — the stocks whose movements deserve review.
- **What stayed quiet** — an explicit "nothing meaningful changed" state.

The core idea is simple:

### Less noise. More context. Better attention.

---

# 🎯 The Problem

Traditional watchlists are optimized around displaying prices.

But a user checking the market several times throughout the day doesn't necessarily need another table of numbers.

They need to know:

1. What changed?
2. How significant was the change?
3. Why does it matter?
4. What should I look at now?

MarketPulse is designed around those questions.

---

# 💡 The Solution

MarketPulse compares the current market state with the user's **own last observation**, rather than relying only on the stock's previous closing price.

This enables the product to surface meaningful changes based on:

- Price movement
- Intraday volatility
- Distance from daily high/low
- Gap from open
- Time since last check
- Data freshness

Every detected movement receives an explainable importance score and a human-readable reason.

The system is deliberately **deterministic and explainable**, rather than an opaque "AI-powered" recommendation engine.

---

# ✨ Key Features

### 🔐 Authentication
- Email/password authentication
- JWT-based sessions
- bcrypt password hashing
- Protected routes

### ⭐ Smart Watchlist
- Personal watchlist
- Supported NSE instrument universe
- Add/remove stocks
- User-specific state

### 📊 Market Intelligence
- Live Groww market-data integration
- Real stock prices
- OHLC market data
- Real candlestick charts
- Data freshness indicators

### 🔎 Meaningful Change Detection
Detects:

- Price movement
- Intraday volatility
- Daily high/low proximity
- Gap from open
- Stale data

### 🎯 Explainable Importance Score

Each market movement receives a score from:

**0–100**

| Score | Attention Level |
|---:|---|
| 0–29 | Stable |
| 30–59 | Worth Reviewing |
| 60–79 | Important |
| 80–100 | High Priority |

The score is based on multiple measurable factors rather than a black-box prediction.

### 🕒 Personal Snapshot History

MarketPulse stores the user's previous observations so the application can answer:

> **"What changed since I last checked?"**

### 🧠 Explainable Insights

Every insight can be traced back to the market-data conditions that generated it.

No fabricated explanations.

### 🟢 Data Freshness

The UI explicitly distinguishes:

- LIVE
- DELAYED
- STALE
- DEMO DATA

MarketPulse never pretends demo or stale data is live.

---

# 🖥️ Product Screenshots

> Screenshots below show the deployed desktop-first MarketPulse interface.

## Landing Page

![MarketPulse Landing Page](screenshots/landing.png)

## Dashboard

![MarketPulse Dashboard](screenshots/dashboard.png)

## Stock Details

![MarketPulse Stock Details](screenshots/stock-details.png)

## Smart Watchlist

![MarketPulse Smart Watchlist](screenshots/watchlist.png)

## What's Changed

![MarketPulse What's Changed](screenshots/changes.png)

## Stock Search

![MarketPulse Stock Search](screenshots/search.png)

## Login

![MarketPulse Login](screenshots/login.png)

## Signup

![MarketPulse Signup](screenshots/signup.png)

## Settings

![MarketPulse Settings](screenshots/settings.png)

---

# 🏗️ Architecture

```text
                         ┌──────────────────────────┐
                         │      MarketPulse UI      │
                         │      React + Vite        │
                         └────────────┬─────────────┘
                                      │
                                      │ HTTPS REST API
                                      ▼
                         ┌──────────────────────────┐
                         │     Express Backend      │
                         │        Node.js           │
                         └────────────┬─────────────┘
                                      │
                   ┌──────────────────┼──────────────────┐
                   │                  │                  │
                   ▼                  ▼                  ▼
             ┌───────────┐     ┌────────────┐     ┌─────────────┐
             │   MySQL   │     │ Market     │     │ Change      │
             │ Database  │     │ Data       │     │ Detection   │
             │           │     │ Service    │     │ Engine      │
             └───────────┘     └─────┬──────┘     └─────────────┘
                                     │
                            ┌────────┴────────┐
                            │                 │
                            ▼                 ▼
                       Groww API       Deterministic
                       Live Data       Demo Fallback
