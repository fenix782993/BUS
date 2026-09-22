# FENIX CITY 2.5 REAL FULL

FENIX CITY — responsive virtual city/economy game with real server-side gameplay.

## Included

- Live city chat with 2-second polling
- Notifications and unread state
- Player-to-player RUB / FC transfers
- Families with leader/officer/member roles
- Family chat with live polling
- Family leave and leader succession
- Playable family battle foundation: challenge, score actions, 100-point finish and rating reward
- Vehicle auction: listings, instant buy and bidding
- Avatar image upload
- Manual RUB donation queue
- Payment screenshot upload
- DEV donation review / approve / reject
- FC credited only by server after approval
- Donation requisites from `DONATION_REQUISITES`
- Timed work shifts with automatic completion, rewards, XP and energy regeneration
- Garage, tuning, properties, companies, market, missions, shop, VIP and progression
- Mobile navigation and responsive layouts
- Smooth transitions, live states and motion polish

## Render

Build command:

```text
pip install -r requirements.txt && cd frontend && npm install && npm run build
```

Start command:

```text
uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```

## Donation setup

In Render Environment Variables set:

```text
DONATION_REQUISITES=YOUR_PAYMENT_REQUISITES
```

Do not place payment requisites in frontend source.

## Developer account

```text
Nickname: FENIX
Password: webFenix12
```

Change credentials before any public production release.
