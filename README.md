# FENIX CITY V2 — FULL

Полная модульная версия FENIX CITY: React/Vite + FastAPI + SQLAlchemy.

## Что готово

- регистрация и вход;
- серверный профиль игрока;
- ₽ и FENIX Coins (FC);
- XP, уровни и репутация;
- работа и восстановление энергии;
- ежедневные/недельные/долгосрочные задания;
- автоматическая система достижений;
- магазин и серверный инвентарь;
- экипировка рамок/эффектов/титулов/VIP;
- автомобили и гараж;
- недвижимость и сбор дохода;
- компании и сбор дохода бизнеса;
- серверный рынок и обновление котировок;
- сделки рынка за игровые ₽;
- рейтинг игроков;
- история экономических операций;
- VIP-уровни;
- FENIX Store с серверными donation orders;
- адаптивный интерфейс PC/mobile;
- Render-ready FastAPI entrypoint.

## Локальный запуск

```cmd
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cd frontend
npm install
npm run build
cd ..
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

## Render

Build Command:

```text
pip install -r requirements.txt && cd frontend && npm install && npm run build
```

Start Command:

```text
uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```

## Проверка API

- `/api/health`
- `/docs`

## Важное про донат

FENIX Store создаёт серверный заказ со статусом `pending`. FC не начисляются клиентом и не считаются оплаченными без подтверждения платежа. Подключение конкретного платёжного провайдера и его webhook выполняется отдельным адаптером.

Для постоянной базы на Render рекомендуется задать `DATABASE_URL` PostgreSQL. Без неё используется SQLite.

## Проверки перед упаковкой

- Python `compileall` — пройден.
- Все относительные JS/JSX/CSS импорты — проверены, отсутствующих импортов нет.
- FastAPI запущен локально и проверены основные API-потоки: health, register, me, tasks, achievements, shop, inventory, donations, vehicles, properties, companies, market, VIP, leaderboard, transactions, work, market tick.
- Архив ZIP протестирован через `unzip -t`.
- `node_modules`, `__pycache__` и локальная БД в архив не включаются.

Полный production payment provider не включён намеренно: нельзя выдавать реальные FC без подтверждённого платежа.
