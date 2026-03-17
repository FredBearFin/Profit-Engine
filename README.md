# Profit Engine

Free profit calculator for resellers and flippers. Enter your cost, platform, and sale price — instantly see your net profit, margin, ROI, and break-even price.

**Live app:** https://profitengine.netlify.app

---

## Supported Platforms

| Platform | Fee Structure |
|---|---|
| eBay | 13.25% + $0.30/order |
| Poshmark | 20% (or $2.95 flat under $15) |
| Mercari | 10% + 2.9% + $0.50 payment processing |
| Depop | 10% + 2.9% + $0.30 payment processing |
| Facebook Marketplace | 5% (or $0.40 flat under $8) |
| Etsy | 6.5% + 3% + $0.25 payment + $0.20 listing |
| StockX | 9% seller fee (new sellers) |
| Amazon FBA | ~15% + $4 fulfillment |
| Whatnot | 8% seller fee |
| Custom | Set your own fee |

---

## What It Calculates

- **Net Profit** — what you actually take home after all costs
- **Profit Margin** — net profit as a % of sale price
- **ROI** — return on investment as a % of your total cost
- **Break-even Price** — the minimum sale price to not lose money

Also accounts for: outbound shipping, packaging supplies, return rate risk, and your time cost per item.

---

## Features

- **Full Calculator** — detailed per-product breakdown with all cost inputs
- **Quick Flip mode** — instant go/no-go for thrift store finds
- **Platform Comparison** — see profit across all platforms at once
- **Deal History** — log deals, tag them Sold/Listed/Passed, track win rate
- **Strategy Panel** — set price by target margin, analyze competitor pricing
- **Copy Result** — share a clean profit summary to clipboard

---

## Built With

- [React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Firebase](https://firebase.google.com) (Auth + Firestore)

---

## Local Development

```bash
git clone https://github.com/FredBearFin/Profit-Engine.git
cd Profit-Engine
npm install
cp .env.example .env   # fill in your Firebase credentials
npm start
```
