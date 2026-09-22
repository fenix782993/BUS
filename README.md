# FENIX CITY V3.0 — FULL GAME

Полноценная браузерная city/economy игра: React + Vite + FastAPI + SQLite/PostgreSQL.

## Уже внутри
- живая экономика RUB / FC
- уровни, XP, энергия, репутация
- работа с таймерами и автоматической выплатой
- городские активности с cooldown
- ежедневная награда
- районы с динамической активностью
- уличные гонки с реальным расчётом характеристик машины
- износ и пробег автомобилей
- гараж, покупка, выбор, тюнинг и аукцион
- рынок с покупкой/продажей
- недвижимость и сбор дохода
- бизнесы и пассивный доход
- миссии и достижения
- магазин, инвентарь, VIP
- глобальный чат, переводы RUB/FC и уведомления
- семьи, роли, семейный чат и битвы
- профиль, аватар и DEV-роль
- ручные донаты: RUB → скриншот → очередь DEV → approve/reject → серверное начисление FC
- адаптивный интерфейс PC + mobile
- тёмный FENIX UI с анимациями и живыми состояниями

## Render
Build Command:
```text
pip install -r requirements.txt && cd frontend && npm install && npm run build
```

Start Command:
```text
uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```

Environment:
```text
DONATION_REQUISITES=YOUR_PAYMENT_REQUISITES
```

## DEV
При первом запуске создаётся DEV:
```text
Nickname: FENIX
Password: webFenix12
```
Перед публичным запуском пароль нужно заменить и усилить авторизацию.

## Проверка
```text
/api/health
/api/docs
```

## Важно
Frontend build не следует считать проверенным локально, если `npm install` в среде разработки не завершился. Render выполнит чистую установку зависимостей перед Vite build.
