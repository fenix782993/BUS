# FENIX CITY V2 — FULL MODULAR

Полная модульная версия: React 19 + Vite + FastAPI + SQLAlchemy.

## Frontend modules
- pages: dashboard, city, work, business, garage, market, ranking, missions, achievements, shop, donations, inventory, VIP, profile, settings
- api modules
- reusable components
- hooks
- utilities
- navigation/data
- responsive dark/orange design

## Backend
- auth
- player economy
- XP/levels
- missions/rewards
- achievements
- inventory/shop
- vehicles/properties
- leaderboard
- donation order ledger
- VIP catalog

## Run
`pip install -r requirements.txt`
`cd frontend && npm install && npm run build`
`cd .. && uvicorn backend.main:app --host 0.0.0.0 --port 8000`

## Render
Build: `pip install -r requirements.txt && cd frontend && npm install && npm run build`
Start: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

FENIX Coins не начисляются от одного только клика по покупке: создаётся pending order. Реальный платёжный провайдер подключается через backend/services/payments.py и webhook после верификации оплаты.
