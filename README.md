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
