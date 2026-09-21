import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  ArrowUpRight,
  Banknote,
  BarChart3,
  Bell,
  Building2,
  Car,
  ChevronRight,
  CircleDollarSign,
  Crown,
  Flame,
  Gauge,
  Globe2,
  Home,
  LayoutDashboard,
  Map,
  Menu,
  Moon,
  Package,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
  Trophy,
  User,
  Wallet,
  X,
  Zap,
} from "lucide-react";


const API =
  (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");


async function api(path, options = {}) {
  const response = await fetch(
    `${API}/api${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    }
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.detail ||
      data.message ||
      `Ошибка сервера: ${response.status}`
    );
  }

  return data;
}


const money = (value) =>
  new Intl.NumberFormat("ru-RU").format(
    Number(value || 0)
  );


const number = (value) =>
  new Intl.NumberFormat("ru-RU").format(
    Number(value || 0)
  );


const clamp = (
  value,
  min,
  max
) =>
  Math.min(
    Math.max(value, min),
    max
  );


function App() {
  const [playerId, setPlayerId] =
    useState(
      localStorage.getItem(
        "fenix_city_player"
      )
    );

  const [player, setPlayer] =
    useState(null);

  const [companies, setCompanies] =
    useState([]);

  const [districts, setDistricts] =
    useState([]);

  const [events, setEvents] =
    useState([]);

  const [leaderboard, setLeaderboard] =
    useState([]);

  const [properties, setProperties] =
    useState([]);

  const [vehicles, setVehicles] =
    useState([]);

  const [tasks, setTasks] =
    useState([]);

  const [page, setPage] =
    useState("dashboard");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [mobileMenu, setMobileMenu] =
    useState(false);

  const [nickname, setNickname] =
    useState("");

  const [search, setSearch] =
    useState("");


  const loadData = async () => {
    if (!playerId) return;

    setLoading(true);
    setError("");

    try {
      const [
        playerData,
        companiesData,
        districtsData,
        eventsData,
        leaderboardData,
        propertiesData,
        vehiclesData,
        tasksData,
      ] = await Promise.all([
        api(`/player/${playerId}/full`),
        api("/companies"),
        api("/districts"),
        api("/events"),
        api("/leaderboard"),
        api("/properties"),
        api("/vehicles"),
        api("/tasks"),
      ]);

      setPlayer(
        playerData.player ||
        playerData
      );

      setCompanies(
        companiesData.companies ||
        companiesData ||
        []
      );

      setDistricts(
        districtsData.districts ||
        districtsData ||
        []
      );

      setEvents(
        eventsData.events ||
        eventsData ||
        []
      );

      setLeaderboard(
        leaderboardData.players ||
        leaderboardData.leaderboard ||
        leaderboardData ||
        []
      );

      setProperties(
        propertiesData.properties ||
        propertiesData ||
        []
      );

      setVehicles(
        vehiclesData.vehicles ||
        vehiclesData ||
        []
      );

      setTasks(
        tasksData.tasks ||
        tasksData ||
        []
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
        "Не удалось загрузить город."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (playerId) {
      loadData();
    }
  }, [playerId]);


  const register = async () => {
    const cleanNickname =
      nickname.trim();

    if (!cleanNickname) {
      setError(
        "Введи никнейм."
      );
      return;
    }

    if (cleanNickname.length < 3) {
      setError(
        "Никнейм должен быть минимум 3 символа."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data =
        await api(
          "/register",
          {
            method: "POST",
            body: JSON.stringify({
              nickname:
                cleanNickname,
            }),
          }
        );

      const id =
        data.player?.id ||
        data.id ||
        data.player_id;

      if (!id) {
        throw new Error(
          "Сервер не вернул ID игрока."
        );
      }

      localStorage.setItem(
        "fenix_city_player",
        id
      );

      setPlayerId(id);
      setNickname("");
    } catch (err) {
      setError(
        err.message ||
        "Ошибка регистрации."
      );
    } finally {
      setLoading(false);
    }
  };


  const logout = () => {
    localStorage.removeItem(
      "fenix_city_player"
    );

    setPlayerId(null);
    setPlayer(null);
    setPage("dashboard");
  };


  const action = async () => {
    if (!player) return;

    if (
      Number(player.energy || 0) < 10
    ) {
      setError(
        "Недостаточно энергии."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api(
        `/player/${player.id}/action`,
        {
          method: "POST",
          body: JSON.stringify({
            action: "work",
          }),
        }
      );

      await loadData();
    } catch (err) {
      setError(
        err.message ||
        "Не удалось выполнить работу."
      );
    } finally {
      setLoading(false);
    }
  };


  const rest = async () => {
    if (!player) return;

    setLoading(true);
    setError("");

    try {
      await api(
        `/player/${player.id}/rest`,
        {
          method: "POST",
        }
      );

      await loadData();
    } catch (err) {
      setError(
        err.message ||
        "Не удалось восстановить энергию."
      );
    } finally {
      setLoading(false);
    }
  };


  const marketTick = async () => {
    setLoading(true);
    setError("");

    try {
      await api(
        "/market/tick",
        {
          method: "POST",
        }
      );

      await loadData();
    } catch (err) {
      setError(
        err.message ||
        "Рынок временно недоступен."
      );
    } finally {
      setLoading(false);
    }
  };


  const buyProperty = async (
    id
  ) => {
    if (!player) return;

    setLoading(true);
    setError("");

    try {
      await api(
        `/player/${player.id}/property/${id}/buy`,
        {
          method: "POST",
        }
      );

      await loadData();
    } catch (err) {
      setError(
        err.message ||
        "Не удалось купить недвижимость."
      );
    } finally {
      setLoading(false);
    }
  };


  const buyVehicle = async (
    id
  ) => {
    if (!player) return;

    setLoading(true);
    setError("");

    try {
      await api(
        `/player/${player.id}/vehicle/${id}/buy`,
        {
          method: "POST",
        }
      );

      await loadData();
    } catch (err) {
      setError(
        err.message ||
        "Не удалось купить транспорт."
      );
    } finally {
      setLoading(false);
    }
  };


  const levelProgress =
    useMemo(() => {
      if (!player) return 0;

      const rep =
        Number(
          player.reputation || 0
        );

      const level =
        Number(
          player.level || 1
        );

      const current =
        (level - 1) * 100;

      const next =
        level * 100;

      if (
        next <= current
      ) {
        return 100;
      }

      return clamp(
        ((rep - current) /
          (next - current)) *
          100,
        0,
        100
      );
    }, [player]);


  const filteredCompanies =
    companies.filter(
      (company) =>
        `${company.name || ""} ${
          company.sector || ""
        }`
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );


  const filteredProperties =
    properties.filter(
      (property) =>
        `${property.name || ""} ${
          property.district || ""
        }`
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );


  const filteredVehicles =
    vehicles.filter(
      (vehicle) =>
        `${vehicle.name || ""} ${
          vehicle.category || ""
        }`
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );


  if (!playerId) {
    return (
      <LoginScreen
        nickname={nickname}
        setNickname={setNickname}
        register={register}
        loading={loading}
        error={error}
      />
    );
  }


  if (!player) {
    return (
      <LoginScreen
        nickname={nickname}
        setNickname={setNickname}
        register={register}
        loading={loading}
        error={
          error ||
          "Загрузка FENIX CITY..."
        }
      />
    );
  }


  return (
    <div className="city-app">

      <TopBar
        player={player}
        loading={loading}
        search={search}
        setSearch={setSearch}
        onMenu={() =>
          setMobileMenu(true)
        }
        onRefresh={loadData}
      />

      <div className="app-layout">

        <Sidebar
          page={page}
          setPage={setPage}
          player={player}
          logout={logout}
        />

        {mobileMenu && (
          <MobileSidebar
            page={page}
            setPage={setPage}
            player={player}
            logout={logout}
            close={() =>
              setMobileMenu(false)
            }
          />
        )}

        <main className="main-content">

          {error && (
            <div className="error-banner">

              <div className="error-banner-left">
                <Bell size={18} />
                <span>{error}</span>
              </div>

              <button
                onClick={() =>
                  setError("")
                }
              >
                <X size={16} />
              </button>

            </div>
          )}

          {loading && (
            <div className="loading-line">
              <span />
            </div>
          )}

          {page === "dashboard" && (
            <Dashboard
              player={player}
              districts={districts}
              companies={companies}
              events={events}
              leaderboard={leaderboard}
              tasks={tasks}
              levelProgress={
                levelProgress
              }
              go={setPage}
              action={action}
              rest={rest}
            />
          )}

          {page === "city" && (
            <City
              districts={districts}
              player={player}
            />
          )}

          {page === "work" && (
            <Work
              player={player}
              action={action}
              rest={rest}
              levelProgress={
                levelProgress
              }
            />
          )}

          {page === "business" && (
            <Business
              properties={
                filteredProperties
              }
              companies={
                filteredCompanies
              }
              player={player}
              buyProperty={
                buyProperty
              }
            />
          )}

          {page === "garage" && (
            <Garage
              vehicles={
                filteredVehicles
              }
              player={player}
              buyVehicle={
                buyVehicle
              }
            />
          )}

          {page === "market" && (
            <Market
              companies={
                filteredCompanies
              }
              marketTick={
                marketTick
              }
            />
          )}

          {page === "ranking" && (
            <Ranking
              leaderboard={
                leaderboard
              }
              player={player}
            />
          )}

          {page === "profile" && (
            <Profile
              player={player}
              levelProgress={
                levelProgress
              }
              logout={logout}
            />
          )}

        </main>
      </div>

      <MobileNavigation
        page={page}
        setPage={setPage}
      />

    </div>
  );
}


/* ============================================================
   LOGIN
============================================================ */

function LoginScreen({
  nickname,
  setNickname,
  register,
  loading,
  error,
}) {
  return (
    <div className="login-screen">

      <div className="login-background">
        <div className="login-orb orb-one" />
        <div className="login-orb orb-two" />
        <div className="login-grid" />
      </div>

      <div className="login-card">

        <div className="login-logo">
          <div className="logo-mark">
            F
          </div>

          <div>
            <strong>FENIX</strong>
            <span>CITY</span>
          </div>
        </div>

        <div className="login-title">
          Твой город.
          <br />
          <span>Твоя история.</span>
        </div>

        <p className="login-description">
          Построй капитал, покупай
          недвижимость, развивайся,
          следи за рынком и становись
          одним из самых влиятельных
          жителей FENIX CITY.
        </p>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <div className="login-form">

          <label>
            ТВОЙ НИКНЕЙМ
          </label>

          <div className="input-wrap">

            <User size={18} />

            <input
              value={nickname}
              onChange={(e) =>
                setNickname(
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Enter"
                ) {
                  register();
                }
              }}
              placeholder="Например: Fenix"
              maxLength={24}
            />

          </div>

          <button
            className="primary-button login-button"
            onClick={register}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw
                  size={18}
                  className="spin"
                />
                СОЗДАЁМ ГОРОД...
              </>
            ) : (
              <>
                ВОЙТИ В FENIX CITY
                <ArrowUpRight
                  size={18}
                />
              </>
            )}
          </button>

        </div>

        <div className="login-features">

          <div>
            <Wallet size={17} />
            Экономика
          </div>

          <div>
            <Building2 size={17} />
            Бизнес
          </div>

          <div>
            <Car size={17} />
            Транспорт
          </div>

          <div>
            <Trophy size={17} />
            Рейтинг
          </div>

        </div>

      </div>
    </div>
  );
}


/* ============================================================
   TOP BAR
============================================================ */

function TopBar({
  player,
  loading,
  search,
  setSearch,
  onMenu,
  onRefresh,
}) {
  return (
    <header className="topbar">

      <div className="topbar-left">

        <button
          className="mobile-menu-button"
          onClick={onMenu}
        >
          <Menu size={21} />
        </button>

        <div className="brand">

          <div className="brand-symbol">
            F
          </div>

          <div className="brand-text">
            <strong>FENIX</strong>
            <span>CITY</span>
          </div>

        </div>

      </div>

      <div className="top-search">

        <Search size={17} />

        <input
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          placeholder="Поиск по городу..."
        />

      </div>

      <div className="topbar-right">

        <div className="live-status">
          <span />
          LIVE
        </div>

        <button
          className="icon-button"
          onClick={onRefresh}
        >
          <RefreshCw
            size={17}
            className={
              loading
                ? "spin"
                : ""
            }
          />
        </button>

        <div className="top-money">
          <CircleDollarSign
            size={17}
          />

          <strong>
            $
            {money(
              player.cash ??
              player.money
            )}
          </strong>
        </div>

        <div className="top-profile">

          <div className="avatar">
            {(
              player.nickname ||
              "F"
            )
              .slice(0, 1)
              .toUpperCase()}
          </div>

          <div className="top-profile-text">
            <strong>
              {player.nickname}
            </strong>

            <span>
              LVL {player.level}
            </span>
          </div>

        </div>

      </div>

    </header>
  );
}


/* ============================================================
   SIDEBAR
============================================================ */

function Sidebar({
  page,
  setPage,
  player,
  logout,
}) {
  const items = [
    [
      "dashboard",
      "Главная",
      LayoutDashboard,
    ],
    [
      "city",
      "Город",
      Map,
    ],
    [
      "work",
      "Работа",
      Zap,
    ],
    [
      "business",
      "Бизнес",
      Building2,
    ],
    [
      "garage",
      "Гараж",
      Car,
    ],
    [
      "market",
      "Рынок",
      BarChart3,
    ],
    [
      "ranking",
      "Рейтинг",
      Trophy,
    ],
  ];

  return (
    <aside className="sidebar">

      <div className="sidebar-section">

        <div className="sidebar-label">
          ГОРОД
        </div>

        {items.map(
          ([
            id,
            label,
            Icon,
          ]) => (
            <button
              key={id}
              className={`nav-item ${
                page === id
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setPage(id)
              }
            >
              <Icon size={18} />

              <span>
                {label}
              </span>

              {id === "market" && (
                <span className="nav-live">
                  LIVE
                </span>
              )}
            </button>
          )
        )}

      </div>

      <div className="sidebar-section">

        <div className="sidebar-label">
          АККАУНТ
        </div>

        <button
          className={`nav-item ${
            page === "profile"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setPage("profile")
          }
        >
          <User size={18} />
          <span>Профиль</span>
        </button>

        <button className="nav-item">
          <Settings size={18} />
          <span>Настройки</span>
        </button>

      </div>

      <div className="sidebar-bottom">

        <div className="sidebar-player">

          <div className="sidebar-avatar">
            {(
              player.nickname ||
              "F"
            )
              .slice(0, 1)
              .toUpperCase()}
          </div>

          <div>
            <strong>
              {player.nickname}
            </strong>

            <span>
              ID #{player.id}
            </span>
          </div>

        </div>

        <button
          className="logout-button"
          onClick={logout}
        >
          Выйти
        </button>

      </div>

    </aside>
  );
}


/* ============================================================
   MOBILE SIDEBAR
============================================================ */

function MobileSidebar({
  page,
  setPage,
  player,
  logout,
  close,
}) {
  const items = [
    [
      "dashboard",
      "Главная",
      LayoutDashboard,
    ],
    [
      "city",
      "Город",
      Map,
    ],
    [
      "work",
      "Работа",
      Zap,
    ],
    [
      "business",
      "Бизнес",
      Building2,
    ],
    [
      "garage",
      "Гараж",
      Car,
    ],
    [
      "market",
      "Рынок",
      BarChart3,
    ],
    [
      "ranking",
      "Рейтинг",
      Trophy,
    ],
    [
      "profile",
      "Профиль",
      User,
    ],
  ];

  const navigate = (
    id
  ) => {
    setPage(id);
    close();
  };

  return (
    <div className="mobile-sidebar-overlay">

      <div className="mobile-sidebar">

        <div className="mobile-sidebar-head">

          <div className="brand">
            <div className="brand-symbol">
              F
            </div>

            <div className="brand-text">
              <strong>
                FENIX
              </strong>
              <span>
                CITY
              </span>
            </div>
          </div>

          <button
            className="icon-button"
            onClick={close}
          >
            <X size={20} />
          </button>

        </div>

        <div className="mobile-sidebar-player">

          <div className="avatar">
            {(
              player.nickname ||
              "F"
            )
              .slice(0, 1)
              .toUpperCase()}
          </div>

          <div>
            <strong>
              {player.nickname}
            </strong>

            <span>
              Уровень {player.level}
            </span>
          </div>

        </div>

        <div className="mobile-sidebar-links">

          {items.map(
            ([
              id,
              label,
              Icon,
            ]) => (
              <button
                key={id}
                className={
                  page === id
                    ? "active"
                    : ""
                }
                onClick={() =>
                  navigate(id)
                }
              >
                <Icon size={19} />
                {label}
                <ChevronRight
                  size={16}
                />
              </button>
            )
          )}

        </div>

        <button
          className="mobile-logout"
          onClick={logout}
        >
          Выйти из города
        </button>

      </div>

    </div>
  );
}


/* ============================================================
   MOBILE NAV
============================================================ */

function MobileNavigation({
  page,
  setPage,
}) {
  const items = [
    [
      "dashboard",
      "Главная",
      LayoutDashboard,
    ],
    [
      "city",
      "Город",
      Map,
    ],
    [
      "work",
      "Работа",
      Zap,
    ],
    [
      "business",
      "Бизнес",
      Building2,
    ],
    [
      "profile",
      "Профиль",
      User,
    ],
  ];

  return (
    <nav className="mobile-navigation">

      {items.map(
        ([
          id,
          label,
          Icon,
        ]) => (
          <button
            key={id}
            className={
              page === id
                ? "active"
                : ""
            }
            onClick={() =>
              setPage(id)
            }
          >
            <Icon size={19} />
            <span>{label}</span>
          </button>
        )
      )}

    </nav>
  );
}


/* ============================================================
   HEADER
============================================================ */

function PageHeader({
  eyebrow,
  title,
  description,
  action,
}) {
  return (
    <div className="page-header">

      <div>

        {eyebrow && (
          <div className="eyebrow">
            {eyebrow}
          </div>
        )}

        <h1>{title}</h1>

        {description && (
          <p>
            {description}
          </p>
        )}

      </div>

      {action}

    </div>
  );
}


/* ============================================================
   DASHBOARD
============================================================ */

function Dashboard({
  player,
  districts,
  companies,
  events,
  leaderboard,
  tasks,
  levelProgress,
  go,
  action,
  rest,
}) {
  const event =
    events[0];

  const cash =
    player.cash ??
    player.money ??
    0;

  const reputation =
    player.reputation ??
    player.rating ??
    0;

  return (
    <>
      <section className="hero">

        <div className="hero-bg">
          <div className="hero-glow" />
          <div className="hero-lines" />
        </div>

        <div className="hero-content">

          <div className="hero-status">
            <span />
            FENIX CITY ONLINE
          </div>

          <h1>
            ТВОЙ ГОРОД.
            <br />
            <em>ТВОИ ПРАВИЛА.</em>
          </h1>

          <p>
            Развивай персонажа,
            зарабатывай, покупай
            активы и становись частью
            экономики FENIX CITY.
          </p>

          <div className="hero-actions">

            <button
              className="primary-button"
              onClick={() =>
                go("work")
              }
            >
              НАЧАТЬ ЗАРАБАТЫВАТЬ
              <ArrowUpRight
                size={18}
              />
            </button>

            <button
              className="secondary-button"
              onClick={() =>
                go("city")
              }
            >
              <Map size={17} />
              ИССЛЕДОВАТЬ ГОРОД
            </button>

          </div>

        </div>

        <div className="hero-card">

          <div className="hero-card-top">
            <span>
              ТВОЙ БАЛАНС
            </span>

            <Wallet size={17} />
          </div>

          <strong>
            ${money(cash)}
          </strong>

          <div className="hero-card-bottom">

            <span>
              УРОВЕНЬ {player.level}
            </span>

            <div className="mini-progress">
              <span
                style={{
                  width:
                    `${levelProgress}%`,
                }}
              />
            </div>

          </div>

        </div>

      </section>


      <section className="stats-grid">

        <StatCard
          icon={Banknote}
          label="Капитал"
          value={`$${money(cash)}`}
          accent="orange"
          note="текущий баланс"
        />

        <StatCard
          icon={Star}
          label="Репутация"
          value={number(
            reputation
          )}
          accent="purple"
          note="городской рейтинг"
        />

        <StatCard
          icon={Zap}
          label="Энергия"
          value={`${
            player.energy ?? 0
          }/100`}
          accent="blue"
          note="доступно сейчас"
        />

        <StatCard
          icon={Building2}
          label="Активы"
          value={
            Array.isArray(
              player.properties
            )
              ? player.properties.length
              : Number(
                  player.properties ||
                  0
                ) +
                Number(
                  player.vehicles ||
                  0
                )
          }
          accent="green"
          note="твоя собственность"
        />

      </section>


      <div className="content-grid">

        <section className="panel map-panel">

          <PanelHeader
            title="Карта города"
            subtitle="Районы FENIX CITY"
            icon={Map}
            action={
              <button
                className="text-button"
                onClick={() =>
                  go("city")
                }
              >
                Открыть карту
                <ChevronRight
                  size={15}
                />
              </button>
            }
          />

          <CityMap
            districts={districts}
          />

        </section>


        <section className="panel event-panel">

          <PanelHeader
            title="Событие города"
            subtitle="Прямо сейчас"
            icon={Flame}
          />

          {event ? (
            <div className="event-card">

              <div className="event-icon">
                <Flame size={25} />
              </div>

              <div className="event-content">

                <div className="event-tag">
                  ГОРОДСКОЕ СОБЫТИЕ
                </div>

                <h3>
                  {event.title}
                </h3>

                <p>
                  {event.description ||
                    event.text ||
                    "Активность города повышена."}
                </p>

                <div className="event-reward">
                  <CircleDollarSign
                    size={16}
                  />
                  Городское событие
                </div>

              </div>

            </div>
          ) : (
            <Empty
              text="Новых событий пока нет."
            />
          )}

        </section>

      </div>


      <div className="content-grid lower-grid">

        <section className="panel">

          <PanelHeader
            title="Рынок"
            subtitle="Компании города"
            icon={BarChart3}
            action={
              <button
                className="text-button"
                onClick={() =>
                  go("market")
                }
              >
                Весь рынок
                <ChevronRight
                  size={15}
                />
              </button>
            }
          />

          <div className="company-list">

            {companies
              .slice(0, 5)
              .map(
                (company) => (
                  <CompanyRow
                    key={company.id}
                    company={company}
                  />
                )
              )}

          </div>

        </section>


        <section className="panel">

          <PanelHeader
            title="Топ жителей"
            subtitle="Лидеры FENIX CITY"
            icon={Trophy}
            action={
              <button
                className="text-button"
                onClick={() =>
                  go("ranking")
                }
              >
                Весь рейтинг
                <ChevronRight
                  size={15}
                />
              </button>
            }
          />

          <Leaderboard
            data={
              leaderboard.slice(
                0,
                5
              )
            }
            currentId={
              player.id
            }
          />

        </section>

      </div>


      <section className="panel tasks-panel">

        <PanelHeader
          title="Следующий шаг"
          subtitle="Развивай своего персонажа"
          icon={Sparkles}
        />

        <div className="task-grid">

          <TaskCard
            icon={Zap}
            title="Заработай деньги"
            description="Выполни работу и получи награду."
            button="ПЕРЕЙТИ К РАБОТЕ"
            onClick={() =>
              go("work")
            }
          />

          <TaskCard
            icon={Building2}
            title="Купи недвижимость"
            description="Создай первый городской актив."
            button="ОТКРЫТЬ БИЗНЕС"
            onClick={() =>
              go("business")
            }
          />

          <TaskCard
            icon={Car}
            title="Собери гараж"
            description="Купи транспорт и расширяй коллекцию."
            button="ОТКРЫТЬ ГАРАЖ"
            onClick={() =>
              go("garage")
            }
          />

          <TaskCard
            icon={TrendingUp}
            title="Следи за рынком"
            description="Изучай компании и движение цен."
            button="ОТКРЫТЬ РЫНОК"
            onClick={() =>
              go("market")
            }
          />

        </div>


        {tasks.length > 0 && (
          <div className="daily-tasks">

            {tasks
              .slice(0, 3)
              .map(
                (task) => (
                  <div
                    className="daily-task"
                    key={task.id}
                  >
                    <div>
                      <strong>
                        {task.title}
                      </strong>

                      <span>
                        {task.description}
                      </span>
                    </div>

                    <b>
                      +{money(
                        task.reward
                      )}
                    </b>
                  </div>
                )
              )}

          </div>
        )}

      </section>
    </>
  );
}


/* ============================================================
   STAT
============================================================ */

function StatCard({
  icon: Icon,
  label,
  value,
  note,
  accent,
}) {
  return (
    <div
      className={`stat-card accent-${accent}`}
    >

      <div className="stat-top">

        <div className="stat-icon">
          <Icon size={19} />
        </div>

        <span>
          {label}
        </span>

      </div>

      <strong>
        {value}
      </strong>

      <small>
        {note}
      </small>

    </div>
  );
}


/* ============================================================
   PANEL HEADER
============================================================ */

function PanelHeader({
  title,
  subtitle,
  icon: Icon,
  action,
}) {
  return (
    <div className="panel-header">

      <div className="panel-title">

        <div className="panel-icon">
          <Icon size={17} />
        </div>

        <div>
          <h2>{title}</h2>
          <span>{subtitle}</span>
        </div>

      </div>

      {action}

    </div>
  );
}


/* ============================================================
   CITY MAP
============================================================ */

function CityMap({
  districts,
}) {
  const positions = [
    [20, 24],
    [51, 19],
    [79, 27],
    [25, 67],
    [55, 61],
    [79, 72],
  ];

  return (
    <div className="city-map">

      <div className="map-grid" />

      <div className="map-road road-1" />
      <div className="map-road road-2" />
      <div className="map-road road-3" />
      <div className="map-road road-4" />

      <div className="map-center">

        <div className="map-center-ring">
          <Globe2 size={24} />
        </div>

        <span>
          FENIX
        </span>

      </div>

      {districts
        .slice(0, 6)
        .map(
          (
            district,
            index
          ) => {
            const position =
              positions[index] ||
              [50, 50];

            return (
              <div
                key={district.id}
                className="district-marker"
                style={{
                  left:
                    `${position[0]}%`,
                  top:
                    `${position[1]}%`,
                }}
              >

                <div className="marker-dot">
                  <span />
                </div>

                <div className="marker-label">
                  <strong>
                    {district.name}
                  </strong>

                  <span>
                    {number(
                      district.population
                    )} жителей
                  </span>
                </div>

              </div>
            );
          }
        )}

    </div>
  );
}


/* ============================================================
   COMPANY ROW
============================================================ */

function CompanyRow({
  company,
}) {
  const growth =
    Number(
      company.growth || 0
    );

  return (
    <div className="company-row">

      <div className="company-logo">
        {(
          company.name ||
          "F"
        )
          .slice(0, 1)
          .toUpperCase()}
      </div>

      <div className="company-main">

        <strong>
          {company.name}
        </strong>

        <span>
          {company.sector ||
            company.type ||
            "Компания"}
        </span>

      </div>

      <div className="company-price">

        <strong>
          ${money(
            company.price ||
            company.income
          )}
        </strong>

        <span
          className={
            growth >= 0
              ? "positive"
              : "negative"
          }
        >
          {growth >= 0
            ? "+"
            : ""}
          {growth.toFixed(1)}%
        </span>

      </div>

    </div>
  );
}


/* ============================================================
   LEADERBOARD
============================================================ */

function Leaderboard({
  data,
  currentId,
}) {
  if (!data.length) {
    return (
      <Empty
        text="Рейтинг пока пуст."
      />
    );
  }

  return (
    <div className="leaderboard">

      {data.map(
        (item, index) => (
          <div
            className={`leader-row ${
              String(item.id) ===
              String(currentId)
                ? "current"
                : ""
            }`}
            key={
              item.id ||
              index
            }
          >

            <div className="leader-place">
              {index === 0 ? (
                <Crown size={17} />
              ) : (
                `#${index + 1}`
              )}
            </div>

            <div className="leader-avatar">
              {(
                item.nickname ||
                "F"
              )
                .slice(0, 1)
                .toUpperCase()}
            </div>

            <div className="leader-name">

              <strong>
                {item.nickname}
              </strong>

              <span>
                LVL {item.level}
              </span>

            </div>

            <div className="leader-score">

              {number(
                item.reputation ??
                item.rating ??
                0
              )}

              <small>
                REP
              </small>

            </div>

          </div>
        )
      )}

    </div>
  );
}


/* ============================================================
   TASK
============================================================ */

function TaskCard({
  icon: Icon,
  title,
  description,
  button,
  onClick,
}) {
  return (
    <div className="task-card">

      <div className="task-icon">
        <Icon size={21} />
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {description}
      </p>

      <button
        onClick={onClick}
      >
        {button}
        <ArrowUpRight
          size={14}
        />
      </button>

    </div>
  );
}


/* ============================================================
   CITY
============================================================ */

function City({
  districts,
  player,
}) {
  return (
    <>
      <PageHeader
        eyebrow="FENIX CITY / MAP"
        title="ГОРОД"
        description="Исследуй районы, следи за активностью и выбирай место для развития."
      />

      <section className="panel large-map-panel">

        <div className="large-map-wrap">
          <CityMap
            districts={
              districts
            }
          />
        </div>

      </section>


      <section className="district-grid">

        {districts.map(
          (district) => (
            <div
              className="district-card"
              key={
                district.id
              }
            >

              <div className="district-card-top">

                <div className="district-card-icon">
                  <Map size={19} />
                </div>

                <span className="activity-dot">
                  LIVE
                </span>

              </div>

              <h3>
                {district.name}
              </h3>

              <p>
                {district.description}
              </p>

              <div className="district-stats">

                <div>
                  <span>
                    НАСЕЛЕНИЕ
                  </span>

                  <strong>
                    {number(
                      district.population
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    УРОВЕНЬ
                  </span>

                  <strong>
                    {district.level ||
                      1}
                  </strong>
                </div>

              </div>

            </div>
          )
        )}

      </section>


      <section className="panel city-info-panel">

        <div className="city-info-icon">
          <Globe2 size={25} />
        </div>

        <div>
          <h2>
            Город развивается
            вместе с тобой
          </h2>

          <p>
            Развивай персонажа,
            покупай активы и
            повышай свой статус.
          </p>
        </div>

        <div className="city-info-stat">
          <span>
            ТВОЙ УРОВЕНЬ
          </span>

          <strong>
            {player.level}
          </strong>
        </div>

      </section>
    </>
  );
}


/* ============================================================
   WORK
============================================================ */

function Work({
  player,
  action,
  rest,
  levelProgress,
}) {
  const energy =
    Number(
      player.energy || 0
    );

  return (
    <>
      <PageHeader
        eyebrow="FENIX CITY / CAREER"
        title="РАБОТА"
        description="Зарабатывай стартовый капитал и повышай репутацию."
      />

      <div className="work-layout">

        <section className="panel work-main">

          <div className="work-main-top">

            <div>
              <div className="eyebrow">
                ДОСТУПНАЯ РАБОТА
              </div>

              <h2>
                ГОРОДСКОЙ КУРЬЕР
              </h2>

              <p>
                Выполни городское
                задание, получи деньги
                и репутацию.
              </p>
            </div>

            <div className="job-level">
              <Gauge size={18} />
              EASY
            </div>

          </div>

          <div className="job-reward-grid">

            <div>
              <span>
                НАГРАДА
              </span>

              <strong>
                $1000
              </strong>
            </div>

            <div>
              <span>
                РЕПУТАЦИЯ
              </span>

              <strong>
                +100
              </strong>
            </div>

            <div>
              <span>
                ЭНЕРГИЯ
              </span>

              <strong>
                -10
              </strong>
            </div>

          </div>

          <button
            className="primary-button big-action"
            onClick={action}
            disabled={
              energy < 10
            }
          >
            <Zap size={19} />

            {energy >= 10
              ? "ВЫПОЛНИТЬ РАБОТУ"
              : "НЕТ ЭНЕРГИИ"}
          </button>

        </section>


        <section className="panel energy-panel">

          <div className="energy-ring">

            <div>
              <strong>
                {energy}
              </strong>

              <span>
                /100
              </span>
            </div>

          </div>

          <h3>
            ЭНЕРГИЯ
          </h3>

          <p>
            Энергия расходуется
            при выполнении работы.
          </p>

          <button
            className="secondary-button full"
            onClick={rest}
          >
            <Moon size={17} />
            ВОССТАНОВИТЬ
          </button>

        </section>

      </div>


      <section className="panel career-panel">

        <PanelHeader
          title="Прогресс персонажа"
          subtitle={`Уровень ${player.level}`}
          icon={Star}
        />

        <div className="level-progress">

          <div className="level-head">
            <span>
              LVL {player.level}
            </span>

            <span>
              {number(
                player.reputation ??
                player.rating ??
                0
              )} REP
            </span>

            <span>
              LVL{" "}
              {Number(
                player.level
              ) + 1}
            </span>
          </div>

          <div className="progress-track">

            <div
              style={{
                width:
                  `${levelProgress}%`,
              }}
            />

          </div>

        </div>

      </section>
    </>
  );
}


/* ============================================================
   BUSINESS
============================================================ */

function Business({
  properties,
  companies,
  player,
  buyProperty,
}) {
  const cash =
    player.cash ??
    player.money ??
    0;

  return (
    <>
      <PageHeader
        eyebrow="FENIX CITY / ASSETS"
        title="БИЗНЕС"
        description="Недвижимость и компании — основа твоего капитала."
      />

      <section className="section-block">

        <div className="section-title-row">

          <div>
            <h2>
              Недвижимость
            </h2>

            <span>
              {properties.length}
              {" "}объектов
            </span>
          </div>

          <div className="section-balance">
            <Wallet size={16} />
            ${money(cash)}
          </div>

        </div>

        <div className="shop-grid">

          {properties.map(
            (property) => {

              const owned =
                Array.isArray(
                  player.properties
                )
                  ? player.properties.includes(
                      property.id
                    )
                  : property.owned_by ===
                    player.id;

              return (
                <AssetCard
                  key={
                    property.id
                  }
                  icon={Home}
                  name={
                    property.name
                  }
                  subtitle={
                    property.district
                  }
                  price={
                    property.price
                  }
                  income={
                    property.income
                  }
                  owned={owned}
                  canBuy={
                    Number(cash) >=
                    Number(
                      property.price
                    )
                  }
                  onBuy={() =>
                    buyProperty(
                      property.id
                    )
                  }
                />
              );
            }
          )}

        </div>

      </section>


      <section className="section-block">

        <div className="section-title-row">

          <div>
            <h2>
              Компании города
            </h2>

            <span>
              Следи за их развитием
            </span>
          </div>

        </div>

        <div className="company-grid">

          {companies.map(
            (company) => (
              <CompanyCard
                key={
                  company.id
                }
                company={
                  company
                }
              />
            )
          )}

        </div>

      </section>
    </>
  );
}


/* ============================================================
   ASSET CARD
============================================================ */

function AssetCard({
  icon: Icon,
  name,
  subtitle,
  price,
  income,
  owned,
  canBuy,
  onBuy,
}) {
  return (
    <div
      className={`asset-card ${
        owned
          ? "owned"
          : ""
      }`}
    >

      <div className="asset-image">

        <div className="asset-image-grid" />

        <Icon size={38} />

        {owned && (
          <span className="owned-badge">
            ВЛАДЕЕТЕ
          </span>
        )}

      </div>


      <div className="asset-content">

        <div className="asset-category">
          НЕДВИЖИМОСТЬ
        </div>

        <h3>
          {name}
        </h3>

        <span className="asset-location">
          {subtitle}
        </span>

        <div className="asset-info">

          <div>
            <span>
              ЦЕНА
            </span>

            <strong>
              ${money(price)}
            </strong>
          </div>

          <div>
            <span>
              ДОХОД
            </span>

            <strong className="positive">
              +${money(
                income
              )}
            </strong>
          </div>

        </div>


        {owned ? (
          <button
            className="owned-button"
            disabled
          >
            <Shield size={15} />
            ТВОЙ АКТИВ
          </button>
        ) : (
          <button
            className="primary-button asset-buy"
            onClick={onBuy}
            disabled={!canBuy}
          >
            {canBuy
              ? "КУПИТЬ"
              : "НЕДОСТАТОЧНО ДЕНЕГ"}

            {canBuy && (
              <ArrowUpRight
                size={15}
              />
            )}
          </button>
        )}

      </div>

    </div>
  );
}


/* ============================================================
   COMPANY CARD
============================================================ */

function CompanyCard({
  company,
}) {
  const growth =
    Number(
      company.growth || 0
    );

  return (
    <div className="company-card">

      <div className="company-card-head">

        <div className="big-company-logo">
          {(
            company.name ||
            "F"
          )
            .slice(0, 1)
            .toUpperCase()}
        </div>

        <div>
          <h3>
            {company.name}
          </h3>

          <span>
            {company.sector ||
              company.type}
          </span>
        </div>

      </div>

      <div className="company-card-price">

        <strong>
          ${money(
            company.price ||
            company.income
          )}
        </strong>

        <span
          className={
            growth >= 0
              ? "positive"
              : "negative"
          }
        >
          {growth >= 0
            ? "+"
            : ""}
          {growth.toFixed(2)}%
        </span>

      </div>

    </div>
  );
}


/* ============================================================
   GARAGE
============================================================ */

function Garage({
  vehicles,
  player,
  buyVehicle,
}) {
  return (
    <>
      <PageHeader
        eyebrow="FENIX CITY / GARAGE"
        title="ГАРАЖ"
        description="Собирай собственную коллекцию транспорта."
      />

      <div className="garage-banner">

        <div>

          <div className="eyebrow">
            FENIX MOTOR DIVISION
          </div>

          <h2>
            ТРАНСПОРТ —
            <br />
            ЭТО СТИЛЬ.
          </h2>

          <p>
            Собирай автомобили
            и развивай свою коллекцию.
          </p>

        </div>

        <Car
          className="garage-banner-icon"
          size={125}
        />

      </div>


      <div className="shop-grid vehicles-grid">

        {vehicles.map(
          (vehicle) => {

            const owned =
              Array.isArray(
                player.vehicles
              )
                ? player.vehicles.includes(
                    vehicle.id
                  )
                : vehicle.owned_by ===
                  player.id;

            const cash =
              player.cash ??
              player.money ??
              0;

            return (
              <AssetCard
                key={
                  vehicle.id
                }
                icon={Car}
                name={
                  vehicle.name
                }
                subtitle={
                  vehicle.type ||
                  vehicle.category ||
                  "Автомобиль"
                }
                price={
                  vehicle.price
                }
                income={0}
                owned={owned}
                canBuy={
                  Number(cash) >=
                  Number(
                    vehicle.price
                  )
                }
                onBuy={() =>
                  buyVehicle(
                    vehicle.id
                  )
                }
              />
            );
          }
        )}

      </div>
    </>
  );
}


/* ============================================================
   MARKET
============================================================ */

function Market({
  companies,
  marketTick,
}) {
  return (
    <>
      <PageHeader
        eyebrow="FENIX CITY / EXCHANGE"
        title="РЫНОК"
        description="Городская экономика."
        action={
          <button
            className="secondary-button"
            onClick={
              marketTick
            }
          >
            <RefreshCw
              size={16}
            />
            ОБНОВИТЬ РЫНОК
          </button>
        }
      />

      <div className="market-overview">

        <div className="market-overview-card">

          <div className="market-overview-icon">
            <Activity size={20} />
          </div>

          <span>
            СТАТУС РЫНКА
          </span>

          <strong>
            ОТКРЫТ
          </strong>

          <small>
            Система работает
          </small>

        </div>


        <div className="market-overview-card">

          <div className="market-overview-icon">
            <BarChart3
              size={20}
            />
          </div>

          <span>
            КОМПАНИЙ
          </span>

          <strong>
            {companies.length}
          </strong>

          <small>
            Активы города
          </small>

        </div>


        <div className="market-overview-card">

          <div className="market-overview-icon">
            <TrendingUp
              size={20}
            />
          </div>

          <span>
            ТРЕНД
          </span>

          <strong>
            LIVE
          </strong>

          <small>
            Цены изменяются
          </small>

        </div>

      </div>


      <section className="panel market-table-panel">

        <div className="market-table-head">
          <span>
            КОМПАНИЯ
          </span>

          <span>
            СЕКТОР
          </span>

          <span>
            ЦЕНА
          </span>

          <span>
            ИЗМЕНЕНИЕ
          </span>
        </div>


        {companies.map(
          (company) => {

            const growth =
              Number(
                company.growth ||
                0
              );

            return (
              <div
                className="market-row"
                key={
                  company.id
                }
              >

                <div className="market-company">

                  <div className="company-logo">
                    {(
                      company.name ||
                      "F"
                    )
                      .slice(
                        0,
                        1
                      )
                      .toUpperCase()}
                  </div>

                  <strong>
                    {company.name}
                  </strong>

                </div>

                <span>
                  {company.sector ||
                    company.type}
                </span>

                <strong>
                  $
                  {money(
                    company.price ||
                    company.income
                  )}
                </strong>

                <span
                  className={
                    growth >= 0
                      ? "positive"
                      : "negative"
                  }
                >
                  {growth >= 0
                    ? "+"
                    : ""}
                  {growth.toFixed(
                    2
                  )}%
                </span>

              </div>
            );
          }
        )}

      </section>
    </>
  );
}


/* ============================================================
   RANKING
============================================================ */

function Ranking({
  leaderboard,
  player,
}) {
  const currentIndex =
    leaderboard.findIndex(
      (x) =>
        String(x.id) ===
        String(player.id)
    );

  return (
    <>
      <PageHeader
        eyebrow="FENIX CITY / RANKING"
        title="РЕЙТИНГ"
        description="Соревнуйся с другими жителями города."
      />

      <div className="ranking-hero">

        <div className="ranking-crown">
          <Trophy size={36} />
        </div>

        <div>
          <span>
            УРОВЕНЬ
          </span>

          <strong>
            {player.level}
          </strong>
        </div>

        <div>
          <span>
            РЕПУТАЦИЯ
          </span>

          <strong>
            {number(
              player.reputation ??
              player.rating ??
              0
            )}
          </strong>
        </div>

        <div>
          <span>
            МЕСТО
          </span>

          <strong>
            #
            {Math.max(
              1,
              currentIndex + 1
            )}
          </strong>
        </div>

      </div>


      <section className="panel full-ranking">

        <div className="full-ranking-head">
          <span>
            МЕСТО
          </span>

          <span>
            ИГРОК
          </span>

          <span>
            УРОВЕНЬ
          </span>

          <span>
            РЕПУТАЦИЯ
          </span>
        </div>


        {leaderboard.map(
          (
            item,
            index
          ) => (
            <div
              className={`full-ranking-row ${
                String(item.id) ===
                String(player.id)
                  ? "current"
                  : ""
              }`}
              key={
                item.id ||
                index
              }
            >

              <strong>
                #{index + 1}
              </strong>

              <div className="ranking-player">

                <div className="leader-avatar">
                  {(
                    item.nickname ||
                    "F"
                  )
                    .slice(
                      0,
                      1
                    )
                    .toUpperCase()}
                </div>

                <span>
                  {item.nickname}
                </span>

              </div>

              <span>
                LVL {item.level}
              </span>

              <strong>
                {number(
                  item.reputation ??
                  item.rating ??
                  0
                )}
              </strong>

            </div>
          )
        )}

      </section>
    </>
  );
}


/* ============================================================
   PROFILE
============================================================ */

function Profile({
  player,
  levelProgress,
  logout,
}) {
  const cash =
    player.cash ??
    player.money ??
    0;

  const reputation =
    player.reputation ??
    player.rating ??
    0;

  const properties =
    Array.isArray(
      player.properties
    )
      ? player.properties.length
      : Number(
          player.properties ||
          0
        );

  const vehicles =
    Array.isArray(
      player.vehicles
    )
      ? player.vehicles.length
      : Number(
          player.vehicles ||
          0
        );

  return (
    <>
      <PageHeader
        eyebrow="FENIX CITY / ACCOUNT"
        title="ПРОФИЛЬ"
        description="Твоя статистика и прогресс в городе."
      />

      <div className="profile-layout">

        <section className="panel profile-card-main">

          <div className="profile-cover">
            <div className="profile-cover-grid" />
          </div>

          <div className="profile-main">

            <div className="profile-avatar-large">
              {(
                player.nickname ||
                "F"
              )
                .slice(
                  0,
                  1
                )
                .toUpperCase()}
            </div>

            <div className="profile-name">

              <div className="profile-name-line">

                <h2>
                  {player.nickname}
                </h2>

                <span>
                  LVL {player.level}
                </span>

              </div>

              <p>
                ID игрока #{player.id}
              </p>

            </div>

          </div>


          <div className="profile-progress">

            <div>

              <span>
                ПРОГРЕСС УРОВНЯ
              </span>

              <strong>
                {number(
                  reputation
                )} REP
              </strong>

            </div>

            <div className="progress-track">

              <div
                style={{
                  width:
                    `${levelProgress}%`,
                }}
              />

            </div>

          </div>

        </section>


        <section className="panel profile-stats">

          <ProfileStat
            icon={Wallet}
            label="Капитал"
            value={`$${money(
              cash
            )}`}
          />

          <ProfileStat
            icon={Star}
            label="Репутация"
            value={number(
              reputation
            )}
          />

          <ProfileStat
            icon={Building2}
            label="Недвижимость"
            value={number(
              properties
            )}
          />

          <ProfileStat
            icon={Car}
            label="Транспорт"
            value={number(
              vehicles
            )}
          />

          <ProfileStat
            icon={Activity}
            label="Работ выполнено"
            value={number(
              player.jobs_done ||
              0
            )}
          />

        </section>

      </div>


      <section className="panel profile-actions">

        <div>

          <Shield size={21} />

          <div>

            <strong>
              Аккаунт FENIX CITY
            </strong>

            <span>
              Игровые данные загружены
              с сервера.
            </span>

          </div>

        </div>

        <button
          className="danger-button"
          onClick={logout}
        >
          ВЫЙТИ
        </button>

      </section>
    </>
  );
}


/* ============================================================
   PROFILE STAT
============================================================ */

function ProfileStat({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="profile-stat">

      <div className="profile-stat-icon">
        <Icon size={18} />
      </div>

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}


/* ============================================================
   EMPTY
============================================================ */

function Empty({
  text,
}) {
  return (
    <div className="empty-state">
      <Package size={25} />
      <span>
        {text}
      </span>
    </div>
  );
}


/* ============================================================
   EXPORT
============================================================ */

export default App;
