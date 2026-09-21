from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel


# ============================================================
# FENIX CITY
# Backend + React static server
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"
DIST_DIR = FRONTEND_DIR / "dist"
ASSETS_DIR = DIST_DIR / "assets"

app = FastAPI(
    title="FENIX CITY API",
    description="Backend API for FENIX CITY",
    version="1.0.0",
)

# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# HELPERS
# ============================================================

def frontend_ready() -> bool:
    return (DIST_DIR / "index.html").is_file()


def json_error(message: str, status_code: int = 404) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "detail": message,
        },
    )


# ============================================================
# STATIC FRONTEND
# ============================================================

if ASSETS_DIR.is_dir():
    app.mount(
        "/assets",
        StaticFiles(directory=str(ASSETS_DIR)),
        name="assets",
    )


# ============================================================
# ROOT
# ============================================================

@app.get("/", include_in_schema=False)
async def root():
    """
    Главная страница React-приложения.
    """

    index_file = DIST_DIR / "index.html"

    if not index_file.is_file():
        return JSONResponse(
            status_code=503,
            content={
                "status": "frontend_not_built",
                "message": "FENIX CITY frontend/dist/index.html not found",
                "frontend_dir": str(FRONTEND_DIR),
                "dist_dir": str(DIST_DIR),
                "hint": "Run: cd frontend && npm install && npm run build",
            },
        )

    return FileResponse(
        path=str(index_file),
        media_type="text/html",
    )


# ============================================================
# HEALTH
# ============================================================

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": "FENIX CITY",
        "version": "1.0.0",
        "frontend_built": frontend_ready(),
    }


# ============================================================
# BASIC API
# ============================================================

@app.get("/api")
async def api_root():
    return {
        "service": "FENIX CITY API",
        "version": "1.0.0",
        "status": "online",
        "frontend_built": frontend_ready(),
    }


# ============================================================
# MODELS
# ============================================================

class RegisterRequest(BaseModel):
    nickname: str


class ActionRequest(BaseModel):
    action: str


# ============================================================
# DEMO DATA
# ============================================================

PLAYERS: dict[str, dict[str, Any]] = {}

COMPANIES = [
    {
        "id": 1,
        "name": "FENIX MOTORS",
        "type": "Автосалон",
        "district": "Центр",
        "income": 12500,
        "employees": 24,
        "icon": "car",
    },
    {
        "id": 2,
        "name": "FENIX BANK",
        "type": "Банк",
        "district": "Деловой центр",
        "income": 28700,
        "employees": 61,
        "icon": "bank",
    },
    {
        "id": 3,
        "name": "FENIX LOGISTICS",
        "type": "Логистика",
        "district": "Промзона",
        "income": 18300,
        "employees": 42,
        "icon": "factory",
    },
    {
        "id": 4,
        "name": "FENIX MARKET",
        "type": "Торговый центр",
        "district": "Центр",
        "income": 9600,
        "employees": 37,
        "icon": "shopping",
    },
]

DISTRICTS = [
    {
        "id": 1,
        "name": "Центр",
        "description": "Главный район города",
        "population": 124000,
        "level": 5,
    },
    {
        "id": 2,
        "name": "Деловой центр",
        "description": "Финансовое сердце FENIX CITY",
        "population": 87000,
        "level": 5,
    },
    {
        "id": 3,
        "name": "Промзона",
        "description": "Производство и логистика",
        "population": 54000,
        "level": 3,
    },
    {
        "id": 4,
        "name": "Пригород",
        "description": "Жилой район города",
        "population": 73000,
        "level": 2,
    },
]

EVENTS = [
    {
        "id": 1,
        "title": "Городской фестиваль",
        "description": "Активность жителей повышена",
        "type": "city",
        "active": True,
    },
    {
        "id": 2,
        "title": "Рост рынка",
        "description": "Доходность бизнеса временно увеличена",
        "type": "market",
        "active": True,
    },
]

PROPERTIES = [
    {
        "id": 1,
        "name": "Стартовая квартира",
        "type": "Квартира",
        "district": "Пригород",
        "price": 25000,
        "income": 300,
        "level": 1,
    },
    {
        "id": 2,
        "name": "Апартаменты FENIX",
        "type": "Апартаменты",
        "district": "Центр",
        "price": 95000,
        "income": 1100,
        "level": 3,
    },
    {
        "id": 3,
        "name": "Пентхаус",
        "type": "Премиум",
        "district": "Деловой центр",
        "price": 350000,
        "income": 4200,
        "level": 5,
    },
]

VEHICLES = [
    {
        "id": 1,
        "name": "Fenix Compact",
        "type": "Автомобиль",
        "price": 18000,
        "speed": 55,
        "class": "C",
    },
    {
        "id": 2,
        "name": "Fenix Sport",
        "type": "Спорткар",
        "price": 85000,
        "speed": 92,
        "class": "A",
    },
    {
        "id": 3,
        "name": "Fenix Executive",
        "type": "Премиум",
        "price": 180000,
        "speed": 88,
        "class": "S",
    },
]

TASKS = [
    {
        "id": 1,
        "title": "Начало пути",
        "description": "Зарегистрируйся в FENIX CITY",
        "reward": 500,
        "type": "register",
    },
    {
        "id": 2,
        "title": "Первый заработок",
        "description": "Выполни рабочее действие",
        "reward": 1000,
        "type": "work",
    },
    {
        "id": 3,
        "title": "Городской житель",
        "description": "Посети город",
        "reward": 250,
        "type": "city",
    },
]


# ============================================================
# PLAYER HELPERS
# ============================================================

def create_player(player_id: str, nickname: str) -> dict[str, Any]:
    return {
        "id": player_id,
        "nickname": nickname,
        "level": 1,
        "xp": 0,
        "money": 10000,
        "bank": 0,
        "energy": 100,
        "health": 100,
        "rating": 0,
        "job": "Безработный",
        "company": None,
        "district": "Пригород",
        "status": "Гражданин",
        "properties": [],
        "vehicles": [],
        "businesses": [],
        "completed_tasks": [],
        "created_at": None,
    }


# ============================================================
# REGISTER
# ============================================================

@app.post("/api/register")
async def register(data: RegisterRequest):
    nickname = data.nickname.strip()

    if len(nickname) < 2:
        raise HTTPException(
            status_code=400,
            detail="Никнейм должен содержать минимум 2 символа",
        )

    player_id = str(abs(hash(nickname.lower())))

    if player_id not in PLAYERS:
        PLAYERS[player_id] = create_player(
            player_id=player_id,
            nickname=nickname,
        )

    return {
        "success": True,
        "player": PLAYERS[player_id],
    }


# ============================================================
# GET PLAYER
# ============================================================

@app.get("/api/player/{player_id}/full")
async def get_player(player_id: str):
    player = PLAYERS.get(str(player_id))

    if not player:
        raise HTTPException(
            status_code=404,
            detail="Игрок не найден",
        )

    return {
        "player": player,
    }


# ============================================================
# PLAYER ACTION
# ============================================================

@app.post("/api/player/{player_id}/action")
async def player_action(
    player_id: str,
    data: ActionRequest,
):
    player = PLAYERS.get(str(player_id))

    if not player:
        raise HTTPException(
            status_code=404,
            detail="Игрок не найден",
        )

    action = data.action.lower().strip()

    rewards = {
        "work": 1000,
        "job": 1000,
        "city": 250,
        "business": 500,
        "market": 100,
        "drive": 150,
    }

    reward = rewards.get(action, 100)

    if player["energy"] <= 0:
        raise HTTPException(
            status_code=400,
            detail="Недостаточно энергии",
        )

    player["money"] += reward
    player["rating"] += reward // 10
    player["xp"] += reward // 5
    player["energy"] = max(
        0,
        player["energy"] - 10,
    )

    return {
        "success": True,
        "action": action,
        "reward": reward,
        "player": player,
    }


# ============================================================
# REST
# ============================================================

@app.post("/api/player/{player_id}/rest")
async def rest_player(player_id: str):
    player = PLAYERS.get(str(player_id))

    if not player:
        raise HTTPException(
            status_code=404,
            detail="Игрок не найден",
        )

    player["energy"] = 100
    player["health"] = 100

    return {
        "success": True,
        "player": player,
    }


# ============================================================
# COMPANIES
# ============================================================

@app.get("/api/companies")
async def get_companies():
    return {
        "companies": COMPANIES,
    }


# ============================================================
# DISTRICTS
# ============================================================

@app.get("/api/districts")
async def get_districts():
    return {
        "districts": DISTRICTS,
    }


# ============================================================
# EVENTS
# ============================================================

@app.get("/api/events")
async def get_events():
    return {
        "events": EVENTS,
    }


# ============================================================
# LEADERBOARD
# ============================================================

@app.get("/api/leaderboard")
async def get_leaderboard():
    players = list(PLAYERS.values())

    players.sort(
        key=lambda player: (
            player.get("rating", 0),
            player.get("money", 0),
        ),
        reverse=True,
    )

    result = []

    for index, player in enumerate(players[:50], start=1):
        result.append(
            {
                "rank": index,
                "id": player["id"],
                "nickname": player["nickname"],
                "level": player["level"],
                "rating": player["rating"],
                "money": player["money"],
            }
        )

    return {
        "leaderboard": result,
    }


# ============================================================
# PROPERTIES
# ============================================================

@app.get("/api/properties")
async def get_properties():
    return {
        "properties": PROPERTIES,
    }


# ============================================================
# BUY PROPERTY
# ============================================================

@app.post("/api/player/{player_id}/property/{property_id}/buy")
async def buy_property(
    player_id: str,
    property_id: int,
):
    player = PLAYERS.get(str(player_id))

    if not player:
        raise HTTPException(
            status_code=404,
            detail="Игрок не найден",
        )

    property_data = next(
        (
            item
            for item in PROPERTIES
            if item["id"] == property_id
        ),
        None,
    )

    if not property_data:
        raise HTTPException(
            status_code=404,
            detail="Недвижимость не найдена",
        )

    if property_id in player["properties"]:
        raise HTTPException(
            status_code=400,
            detail="Эта недвижимость уже куплена",
        )

    if player["money"] < property_data["price"]:
        raise HTTPException(
            status_code=400,
            detail="Недостаточно денег",
        )

    player["money"] -= property_data["price"]
    player["properties"].append(property_id)

    return {
        "success": True,
        "property": property_data,
        "player": player,
    }


# ============================================================
# VEHICLES
# ============================================================

@app.get("/api/vehicles")
async def get_vehicles():
    return {
        "vehicles": VEHICLES,
    }


# ============================================================
# BUY VEHICLE
# ============================================================

@app.post("/api/player/{player_id}/vehicle/{vehicle_id}/buy")
async def buy_vehicle(
    player_id: str,
    vehicle_id: int,
):
    player = PLAYERS.get(str(player_id))

    if not player:
        raise HTTPException(
            status_code=404,
            detail="Игрок не найден",
        )

    vehicle = next(
        (
            item
            for item in VEHICLES
            if item["id"] == vehicle_id
        ),
        None,
    )

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Автомобиль не найден",
        )

    if vehicle_id in player["vehicles"]:
        raise HTTPException(
            status_code=400,
            detail="Этот автомобиль уже куплен",
        )

    if player["money"] < vehicle["price"]:
        raise HTTPException(
            status_code=400,
            detail="Недостаточно денег",
        )

    player["money"] -= vehicle["price"]
    player["vehicles"].append(vehicle_id)

    return {
        "success": True,
        "vehicle": vehicle,
        "player": player,
    }


# ============================================================
# TASKS
# ============================================================

@app.get("/api/tasks")
async def get_tasks():
    return {
        "tasks": TASKS,
    }


# ============================================================
# MARKET
# ============================================================

@app.post("/api/market/tick")
async def market_tick():
    return {
        "success": True,
        "message": "Рынок обновлён",
        "market": {
            "status": "active",
            "trend": "up",
        },
    }


# ============================================================
# FAVICON
# ============================================================

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    favicon_file = DIST_DIR / "favicon.ico"

    if favicon_file.is_file():
        return FileResponse(
            path=str(favicon_file),
            media_type="image/x-icon",
        )

    return JSONResponse(
        status_code=204,
        content=None,
    )


# ============================================================
# SPA FALLBACK
# ============================================================

@app.get("/{path:path}", include_in_schema=False)
async def spa_fallback(path: str):
    """
    Всё, что не является API или существующим статическим файлом,
    отправляем в React index.html.

    Это позволяет работать маршрутам:
      /city
      /work
      /business
      /garage
      /market
      /ranking
      /profile
    """

    # API не должен попадать в SPA fallback
    if path.startswith("api/"):
        return json_error(
            "API endpoint not found",
            404,
        )

    # Не отдаём исходники React.
    # Если браузер запрашивает /src/main.jsx,
    # это означает, что используется НЕСОБРАННЫЙ index.html.
    if path.startswith("src/"):
        return json_error(
            "Frontend source requested. Use frontend/dist after npm run build.",
            404,
        )

    requested_file = DIST_DIR / path

    # Защита от выхода за пределы dist
    try:
        requested_file.resolve().relative_to(
            DIST_DIR.resolve()
        )
    except ValueError:
        return json_error(
            "Invalid path",
            400,
        )

    # Если это настоящий файл из dist — отдаём его.
    if requested_file.is_file():
        return FileResponse(
            path=str(requested_file)
        )

    # Иначе React SPA
    index_file = DIST_DIR / "index.html"

    if index_file.is_file():
        return FileResponse(
            path=str(index_file),
            media_type="text/html",
        )

    return JSONResponse(
        status_code=503,
        content={
            "status": "frontend_not_built",
            "message": "frontend/dist/index.html not found",
            "hint": "Run: cd frontend && npm install && npm run build",
        },
    )


# ============================================================
# STARTUP INFO
# ============================================================

@app.on_event("startup")
async def startup_event():
    print("=" * 60)
    print("FENIX CITY")
    print("=" * 60)
    print(f"BASE_DIR:      {BASE_DIR}")
    print(f"FRONTEND_DIR:  {FRONTEND_DIR}")
    print(f"DIST_DIR:      {DIST_DIR}")
    print(f"ASSETS_DIR:    {ASSETS_DIR}")
    print(f"FRONTEND READY: {frontend_ready()}")
    print("=" * 60)