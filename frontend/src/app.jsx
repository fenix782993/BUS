import React, { useEffect, useMemo, useState } from "react";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function api(path, options = {}) {
  const response = await fetch(`${API}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

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
  new Intl.NumberFormat("ru-RU").format(Number(value || 0));

const num = (value) =>
  new Intl.NumberFormat("ru-RU").format(Number(value || 0));

function Icon({ children, className = "" }) {
  return (
    <span className={`ui-icon ${className}`} aria-hidden="true">
      {children}
    </span>
  );
}

const ICONS = {
  home: "⌂",
  city: "▦",
  work: "⚡",
  business: "▣",
  garage: "▰",
  market: "↗",
  ranking: "♛",
  profile: "●",
  settings: "⚙",
  search: "⌕",
  refresh: "↻",
  money: "$",
  energy: "ϟ",
  xp: "✦",
  users: "♙",
  building: "▥",
  car: "▰",
  trophy: "♛",
  arrow: "→",
  close: "×",
  check: "✓",
  location: "⌖",
  chart: "▥",
  shield: "◆",
};

function App() {
  const [playerId, setPlayerId] = useState(
    localStorage.getItem("fenix_city_player")
  );

  const [player, setPlayer] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [events, setEvents] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [properties, setProperties] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [page, setPage] = useState("dashboard");
  const [nickname, setNickname] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

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

      setPlayer(playerData.player || playerData);

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
        leaderboardData.leaderboard ||
          leaderboardData.players ||
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
          "Не удалось загрузить данные города."
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
    const name = nickname.trim();

    if (name.length < 2) {
      setError("Никнейм должен содержать минимум 2 символа.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await api("/register", {
        method: "POST",
        body: JSON.stringify({
          nickname: name,
        }),
      });

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
        String(id)
      );

      setPlayerId(String(id));
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
    setMobileOpen(false);
  };

  const work = async () => {
    if (!player) return;

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
      setError(err.message);
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const buyProperty = async (id) => {
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const buyVehicle = async (id) => {
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateMarket = async () => {
    setLoading(true);
    setError("");

    try {
      await api("/market/tick", {
        method: "POST",
      });

      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const levelProgress = useMemo(() => {
    if (!player) return 0;

    const level = Number(
      player.level || 1
    );

    const xp = Number(
      player.xp || 0
    );

    const current = (level - 1) * 100;
    const next = level * 100;

    if (next <= current) return 100;

    return Math.max(
      0,
      Math.min(
        100,
        ((xp - current) /
          (next - current)) *
          100
      )
    );
  }, [player]);

  const filteredCompanies = companies.filter(
    (item) =>
      `${item.name || ""} ${
        item.type || ""
      } ${item.district || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const filteredProperties = properties.filter(
    (item) =>
      `${item.name || ""} ${
        item.type || ""
      } ${item.district || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const filteredVehicles = vehicles.filter(
    (item) =>
      `${item.name || ""} ${
        item.type || ""
      } ${item.class || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  if (!playerId || !player) {
    return (
      <LoginScreen
        nickname={nickname}
        setNickname={setNickname}
        register={register}
        loading={loading}
        error={
          error ||
          (!playerId
            ? ""
            : "Загрузка FENIX CITY...")
        }
      />
    );
  }

  const navigate = (nextPage) => {
    setPage(nextPage);
    setMobileOpen(false);
  };

  return (
    <div className="city-app">
      <Topbar
        player={player}
        search={search}
        setSearch={setSearch}
        loading={loading}
        refresh={loadData}
        openMenu={() => setMobileOpen(true)}
      />

      <div className="layout">
        <Sidebar
          page={page}
          navigate={navigate}
          player={player}
          logout={logout}
        />

        {mobileOpen && (
          <MobileMenu
            page={page}
            navigate={navigate}
            player={player}
            logout={logout}
            close={() => setMobileOpen(false)}
          />
        )}

        <main className="main">
          {error && (
            <div className="alert">
              <div>
                <Icon>{ICONS.shield}</Icon>
                <span>{error}</span>
              </div>

              <button
                onClick={() => setError("")}
              >
                {ICONS.close}
              </button>
            </div>
          )}

          {loading && (
            <div className="loading-bar">
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
              levelProgress={levelProgress}
              navigate={navigate}
              work={work}
              rest={rest}
            />
          )}

          {page === "city" && (
            <City
              player={player}
              districts={districts}
              events={events}
            />
          )}

          {page === "work" && (
            <Work
              player={player}
              progress={levelProgress}
              work={work}
              rest={rest}
            />
          )}

          {page === "business" && (
            <Business
              player={player}
              properties={filteredProperties}
              companies={filteredCompanies}
              buyProperty={buyProperty}
            />
          )}

          {page === "garage" && (
            <Garage
              player={player}
              vehicles={filteredVehicles}
              buyVehicle={buyVehicle}
            />
          )}

          {page === "market" && (
            <Market
              companies={filteredCompanies}
              updateMarket={updateMarket}
            />
          )}

          {page === "ranking" && (
            <Ranking
              player={player}
              leaderboard={leaderboard}
            />
          )}

          {page === "profile" && (
            <Profile
              player={player}
              progress={levelProgress}
              logout={logout}
            />
          )}
        </main>
      </div>

      <MobileNav
        page={page}
        navigate={navigate}
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
    <div className="login">
      <div className="login-glow glow-a" />
      <div className="login-glow glow-b" />
      <div className="login-grid" />

      <div className="login-card">
        <div className="login-logo">
          <div className="logo-box">
            F
          </div>

          <div>
            <strong>FENIX</strong>
            <span>CITY</span>
          </div>
        </div>

        <div className="login-heading">
          Твой город.
          <br />
          <span>Твоя история.</span>
        </div>

        <p className="login-text">
          Создай персонажа, зарабатывай,
          покупай недвижимость и автомобили,
          развивай бизнес и поднимайся
          в рейтинге FENIX CITY.
        </p>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <label className="field-label">
          НИКНЕЙМ
        </label>

        <div className="input">
          <Icon>{ICONS.profile}</Icon>

          <input
            value={nickname}
            onChange={(e) =>
              setNickname(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                register();
              }
            }}
            placeholder="Например: Fenix"
            maxLength={24}
          />
        </div>

        <button
          className="button primary wide"
          onClick={register}
          disabled={loading}
        >
          {loading
            ? "СОЗДАНИЕ..."
            : "ВОЙТИ В FENIX CITY"}
          <span>{ICONS.arrow}</span>
        </button>

        <div className="login-points">
          <span>
            <b>$</b> Экономика
          </span>
          <span>
            <b>▣</b> Бизнес
          </span>
          <span>
            <b>▰</b> Транспорт
          </span>
          <span>
            <b>♛</b> Рейтинг
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TOPBAR
============================================================ */

function Topbar({
  player,
  search,
  setSearch,
  loading,
  refresh,
  openMenu,
}) {
  return (
    <header className="topbar">
      <div className="brand-area">
        <button
          className="mobile-menu"
          onClick={openMenu}
        >
          ☰
        </button>

        <div className="brand">
          <div className="brand-icon">
            F
          </div>

          <div>
            <strong>FENIX</strong>
            <span>CITY</span>
          </div>
        </div>
      </div>

      <div className="search-box">
        <Icon>{ICONS.search}</Icon>

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Поиск по городу..."
        />
      </div>

      <div className="top-right">
        <div className="live">
          <i />
          LIVE
        </div>

        <button
          className="refresh"
          onClick={refresh}
        >
          <span
            className={
              loading ? "rotate" : ""
            }
          >
            {ICONS.refresh}
          </span>
        </button>

        <div className="money">
          <span>$</span>
          {money(
            player.money ??
              player.cash
          )}
        </div>

        <div className="user-mini">
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

            <small>
              LVL {player.level || 1}
            </small>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ============================================================
   SIDEBAR
============================================================ */

const MENU = [
  ["dashboard", "Главная", "home"],
  ["city", "Город", "city"],
  ["work", "Работа", "work"],
  ["business", "Бизнес", "business"],
  ["garage", "Гараж", "garage"],
  ["market", "Рынок", "market"],
  ["ranking", "Рейтинг", "ranking"],
];

function Sidebar({
  page,
  navigate,
  player,
  logout,
}) {
  return (
    <aside className="sidebar">
      <div className="side-group">
        <div className="side-label">
          ГОРОД
        </div>

        {MENU.map(
          ([id, label, icon]) => (
            <button
              key={id}
              className={`side-item ${
                page === id
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                navigate(id)
              }
            >
              <Icon>
                {ICONS[icon]}
              </Icon>

              <span>{label}</span>

              {id === "market" && (
                <em>LIVE</em>
              )}
            </button>
          )
        )}
      </div>

      <div className="side-group">
        <div className="side-label">
          АККАУНТ
        </div>

        <button
          className={`side-item ${
            page === "profile"
              ? "active"
              : ""
          }`}
          onClick={() =>
            navigate("profile")
          }
        >
          <Icon>{ICONS.profile}</Icon>
          <span>Профиль</span>
        </button>

        <button className="side-item disabled">
          <Icon>{ICONS.settings}</Icon>
          <span>Настройки</span>
        </button>
      </div>

      <div className="side-bottom">
        <div className="side-user">
          <div className="avatar small">
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
              {player.job ||
                "Гражданин"}
            </span>
          </div>
        </div>

        <button
          className="logout"
          onClick={logout}
        >
          ВЫЙТИ
        </button>
      </div>
    </aside>
  );
}

/* ============================================================
   MOBILE MENU
============================================================ */

function MobileMenu({
  page,
  navigate,
  player,
  logout,
  close,
}) {
  return (
    <div
      className="mobile-overlay"
      onClick={close}
    >
      <aside
        className="mobile-sidebar"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <div className="mobile-sidebar-head">
          <div className="brand">
            <div className="brand-icon">
              F
            </div>
            <div>
              <strong>FENIX</strong>
              <span>CITY</span>
            </div>
          </div>

          <button onClick={close}>
            ×
          </button>
        </div>

        <Sidebar
          page={page}
          navigate={navigate}
          player={player}
          logout={logout}
        />
      </aside>
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
  navigate,
  work,
  rest,
}) {
  const currentRank =
    leaderboard.findIndex(
      (x) =>
        String(x.id) ===
        String(player.id)
    ) + 1;

  return (
    <div>
      <PageHeader
        eyebrow="FENIX CITY / DASHBOARD"
        title={`Добро пожаловать, ${
          player.nickname
        }`}
        description="Твой личный центр управления городом."
      />

      <section className="hero">
        <div className="hero-copy">
          <span className="hero-tag">
            <i /> ГОРОД АКТИВЕН
          </span>

          <h2>
            Создай свою
            <br />
            <span>империю.</span>
          </h2>

          <p>
            Работай, развивай бизнес,
            покупай недвижимость и
            становись влиятельнее.
          </p>

          <div className="hero-actions">
            <button
              className="button primary"
              onClick={() =>
                navigate("work")
              }
            >
              НАЧАТЬ ЗАРАБАТЫВАТЬ
              <span>{ICONS.arrow}</span>
            </button>

            <button
              className="button secondary"
              onClick={() =>
                navigate("city")
              }
            >
              ИССЛЕДОВАТЬ ГОРОД
            </button>
          </div>
        </div>

        <div className="hero-stats">
          <div className="hero-orb">
            F
          </div>

          <div className="hero-level">
            <div>
              <span>
                УРОВЕНЬ
              </span>
              <strong>
                {player.level || 1}
              </strong>
            </div>

            <div className="progress">
              <span
                style={{
                  width: `${levelProgress}%`,
                }}
              />
            </div>

            <small>
              {num(
                player.xp || 0
              )} XP
            </small>
          </div>
        </div>
      </section>

      <div className="stats-grid">
        <Stat
          title="Баланс"
          value={`$${money(
            player.money
          )}`}
          sub="Доступные средства"
          icon="$"
        />

        <Stat
          title="Энергия"
          value={`${num(
            player.energy
          )}/100`}
          sub="Текущее состояние"
          icon="ϟ"
        />

        <Stat
          title="Рейтинг"
          value={num(
            player.rating
          )}
          sub={
            currentRank > 0
              ? `Позиция #${currentRank}`
              : "Пока нет позиции"
          }
          icon="♛"
        />

        <Stat
          title="Репутация"
          value={num(
            player.xp
          )}
          sub="Опыт жителя"
          icon="✦"
        />
      </div>

      <div className="dashboard-grid">
        <Panel
          title="Быстрые действия"
          action="РАБОТА"
          onAction={() =>
            navigate("work")
          }
        >
          <div className="quick-grid">
            <button
              className="quick-card"
              onClick={work}
            >
              <div className="quick-icon">
                ⚡
              </div>
              <strong>
                Выполнить работу
              </strong>
              <span>
                +$1 000 · -10 энергии
              </span>
            </button>

            <button
              className="quick-card"
              onClick={rest}
            >
              <div className="quick-icon">
                +
              </div>
              <strong>
                Восстановиться
              </strong>
              <span>
                Энергия и здоровье
              </span>
            </button>

            <button
              className="quick-card"
              onClick={() =>
                navigate("business")
              }
            >
              <div className="quick-icon">
                ▣
              </div>
              <strong>
                Купить недвижимость
              </strong>
              <span>
                Развивай капитал
              </span>
            </button>

            <button
              className="quick-card"
              onClick={() =>
                navigate("garage")
              }
            >
              <div className="quick-icon">
                ▰
              </div>
              <strong>
                Автомобили
              </strong>
              <span>
                Собери гараж
              </span>
            </button>
          </div>
        </Panel>

        <Panel
          title="События города"
          action="ГОРОД"
          onAction={() =>
            navigate("city")
          }
        >
          <div className="event-list">
            {events.length === 0 ? (
              <Empty text="Событий пока нет." />
            ) : (
              events.slice(0, 4).map(
                (event, index) => (
                  <div
                    className="event"
                    key={
                      event.id ||
                      index
                    }
                  >
                    <div className="event-icon">
                      {index % 2 === 0
                        ? "!"
                        : "↗"}
                    </div>

                    <div>
                      <strong>
                        {event.title ||
                          "Городское событие"}
                      </strong>

                      <span>
                        {event.description ||
                          "Активность города"}
                      </span>
                    </div>

                    <b>
                      {event.active
                        ? "ACTIVE"
                        : "ENDED"}
                    </b>
                  </div>
                )
              )
            )}
          </div>
        </Panel>
      </div>

      <div className="dashboard-grid">
        <Panel
          title="Районы"
          action="ОТКРЫТЬ"
          onAction={() =>
            navigate("city")
          }
        >
          <div className="district-list">
            {districts
              .slice(0, 4)
              .map(
                (
                  district,
                  index
                ) => (
                  <div
                    className="district"
                    key={
                      district.id ||
                      index
                    }
                  >
                    <div className="district-number">
                      0{index + 1}
                    </div>

                    <div className="district-main">
                      <strong>
                        {district.name}
                      </strong>

                      <span>
                        {district.description}
                      </span>
                    </div>

                    <div className="district-pop">
                      {num(
                        district.population
                      )}
                      <small>
                        жителей
                      </small>
                    </div>
                  </div>
                )
              )}
          </div>
        </Panel>

        <Panel
          title="Задания"
          action="ВСЕ"
        >
          <div className="task-list">
            {tasks
              .slice(0, 4)
              .map(
                (
                  task,
                  index
                ) => (
                  <div
                    className="task"
                    key={
                      task.id ||
                      index
                    }
                  >
                    <div className="task-check">
                      {player.completed_tasks?.includes(
                        task.id
                      )
                        ? "✓"
                        : index + 1}
                    </div>

                    <div>
                      <strong>
                        {task.title}
                      </strong>

                      <span>
                        {task.description}
                      </span>
                    </div>

                    <b>
                      +$
                      {money(
                        task.reward
                      )}
                    </b>
                  </div>
                )
              )}
          </div>
        </Panel>
      </div>

      <Panel
        title="Топ жителей"
        action="РЕЙТИНГ"
        onAction={() =>
          navigate("ranking")
        }
      >
        <Leaderboard
          players={leaderboard.slice(
            0,
            5
          )}
          player={player}
        />
      </Panel>

      <div className="city-footer">
        FENIX CITY
        <span>
          DIGITAL ECONOMY
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   STAT
============================================================ */

function Stat({
  title,
  value,
  sub,
  icon,
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{title}</span>
        <div className="stat-icon">
          {icon}
        </div>
      </div>

      <strong>{value}</strong>

      <small>{sub}</small>
    </div>
  );
}

/* ============================================================
   CITY
============================================================ */

function City({
  districts,
  events,
}) {
  return (
    <div>
      <PageHeader
        eyebrow="CITY / MAP"
        title="Город"
        description="Исследуй районы FENIX CITY."
      />

      <div className="city-layout">
        <section className="map-card">
          <div className="map-head">
            <div>
              <span>FENIX CITY</span>
              <strong>
                ГОРОДСКАЯ КАРТА
              </strong>
            </div>

            <span className="map-live">
              ● LIVE
            </span>
          </div>

          <div className="fake-map">
            <div className="map-road road-a" />
            <div className="map-road road-b" />
            <div className="map-road road-c" />

            <div className="map-block block-a">
              ЦЕНТР
            </div>

            <div className="map-block block-b">
              BUSINESS
            </div>

            <div className="map-block block-c">
              INDUSTRIAL
            </div>

            <div className="map-block block-d">
              SUBURB
            </div>

            <div className="map-pin">
              F
            </div>
          </div>
        </section>

        <section className="district-cards">
          {districts.map(
            (district, index) => (
              <div
                className="district-card"
                key={
                  district.id ||
                  index
                }
              >
                <div className="district-card-top">
                  <span>
                    0{index + 1}
                  </span>
                  <b>
                    LVL{" "}
                    {district.level ||
                      1}
                  </b>
                </div>

                <h3>
                  {district.name}
                </h3>

                <p>
                  {district.description}
                </p>

                <div className="district-card-bottom">
                  <span>
                    НАСЕЛЕНИЕ
                  </span>
                  <strong>
                    {num(
                      district.population
                    )}
                  </strong>
                </div>
              </div>
            )
          )}
        </section>
      </div>

      <Panel title="Активные события">
        <div className="event-list">
          {events.map(
            (event, index) => (
              <div
                className="event"
                key={
                  event.id ||
                  index
                }
              >
                <div className="event-icon">
                  {index % 2
                    ? "↗"
                    : "!"}
                </div>

                <div>
                  <strong>
                    {event.title}
                  </strong>
                  <span>
                    {event.description}
                  </span>
                </div>

                <b>
                  {event.active
                    ? "ACTIVE"
                    : "ENDED"}
                </b>
              </div>
            )
          )}
        </div>
      </Panel>
    </div>
  );
}

/* ============================================================
   WORK
============================================================ */

function Work({
  player,
  progress,
  work,
  rest,
}) {
  return (
    <div>
      <PageHeader
        eyebrow="CAREER / WORK"
        title="Работа"
        description="Зарабатывай деньги и прокачивай персонажа."
      />

      <div className="work-hero">
        <div>
          <span className="eyebrow">
            ТЕКУЩАЯ РАБОТА
          </span>

          <h2>
            {player.job ||
              "Безработный"}
          </h2>

          <p>
            Выполняй рабочие действия,
            чтобы получать деньги,
            рейтинг и XP.
          </p>
        </div>

        <div className="work-energy">
          <span>ЭНЕРГИЯ</span>
          <strong>
            {player.energy}/100
          </strong>

          <div className="progress">
            <span
              style={{
                width: `${Math.max(
                  0,
                  Math.min(
                    100,
                    Number(
                      player.energy ||
                        0
                    )
                  )
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="work-grid">
        <div className="action-card primary-action">
          <div className="big-icon">
            ⚡
          </div>

          <span>РАБОЧАЯ СМЕНА</span>

          <h3>
            Выполнить работу
          </h3>

          <p>
            Получи фиксированную
            выплату и опыт.
          </p>

          <div className="reward">
            <strong>
              +$1 000
            </strong>
            <span>
              −10 энергии
            </span>
          </div>

          <button
            className="button primary wide"
            onClick={work}
            disabled={
              Number(
                player.energy || 0
              ) < 10
            }
          >
            НАЧАТЬ СМЕНУ
          </button>
        </div>

        <div className="action-card">
          <div className="big-icon">
            +
          </div>

          <span>
            ВОССТАНОВЛЕНИЕ
          </span>

          <h3>
            Отдохнуть
          </h3>

          <p>
            Полностью восстанови
            энергию и здоровье.
          </p>

          <div className="reward">
            <strong>
              100 / 100
            </strong>
            <span>
              энергия
            </span>
          </div>

          <button
            className="button secondary wide"
            onClick={rest}
          >
            ВОССТАНОВИТЬСЯ
          </button>
        </div>
      </div>

      <Panel title="Прогресс уровня">
        <div className="level-panel">
          <div>
            <strong>
              УРОВЕНЬ{" "}
              {player.level || 1}
            </strong>
            <span>
              {num(
                player.xp || 0
              )} XP
            </span>
          </div>

          <div className="progress large">
            <span
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>
      </Panel>
    </div>
  );
}

/* ============================================================
   BUSINESS
============================================================ */

function Business({
  player,
  properties,
  companies,
  buyProperty,
}) {
  return (
    <div>
      <PageHeader
        eyebrow="CAPITAL / BUSINESS"
        title="Бизнес"
        description="Покупай активы и создавай источник дохода."
      />

      <div className="capital-strip">
        <div>
          <span>КАПИТАЛ</span>
          <strong>
            ${money(player.money)}
          </strong>
        </div>

        <div>
          <span>АКТИВОВ</span>
          <strong>
            {(player.properties ||
              []).length}
          </strong>
        </div>

        <div>
          <span>БИЗНЕСОВ</span>
          <strong>
            {(player.businesses ||
              []).length}
          </strong>
        </div>
      </div>

      <Panel title="Недвижимость">
        <div className="product-grid">
          {properties.map(
            (property) => {
              const owned =
                player.properties?.includes(
                  property.id
                );

              return (
                <div
                  className="product-card"
                  key={property.id}
                >
                  <div className="product-image property-image">
                    <span>
                      {property.type ||
                        "PROPERTY"}
                    </span>
                    <b>
                      {property.level
                        ? `LVL ${property.level}`
                        : "CITY"}
                    </b>
                  </div>

                  <div className="product-body">
                    <span className="product-type">
                      {property.district}
                    </span>

                    <h3>
                      {property.name}
                    </h3>

                    <div className="product-row">
                      <span>
                        Доход
                      </span>
                      <strong>
                        +$
                        {money(
                          property.income
                        )}
                      </strong>
                    </div>

                    <div className="product-row">
                      <span>
                        Цена
                      </span>
                      <strong>
                        $
                        {money(
                          property.price
                        )}
                      </strong>
                    </div>

                    <button
                      className={`button ${
                        owned
                          ? "secondary"
                          : "primary"
                      } wide`}
                      disabled={owned}
                      onClick={() =>
                        buyProperty(
                          property.id
                        )
                      }
                    >
                      {owned
                        ? "КУПЛЕНО"
                        : "КУПИТЬ"}
                    </button>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </Panel>

      <Panel title="Компании города">
        <div className="company-list">
          {companies.map(
            (company) => (
              <div
                className="company"
                key={company.id}
              >
                <div className="company-icon">
                  {company.icon ===
                  "car"
                    ? "▰"
                    : "▣"}
                </div>

                <div>
                  <strong>
                    {company.name}
                  </strong>

                  <span>
                    {company.type ||
                      company.sector ||
                      "Компания"}{" "}
                    ·{" "}
                    {company.district}
                  </span>
                </div>

                <div className="company-money">
                  <strong>
                    +$
                    {money(
                      company.income
                    )}
                  </strong>
                  <span>
                    доход
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      </Panel>
    </div>
  );
}

/* ============================================================
   GARAGE
============================================================ */

function Garage({
  player,
  vehicles,
  buyVehicle,
}) {
  return (
    <div>
      <PageHeader
        eyebrow="GARAGE / VEHICLES"
        title="Гараж"
        description="Выбирай транспорт и собирай собственную коллекцию."
      />

      <div className="garage-header">
        <div>
          <span>ТРАНСПОРТ</span>
          <strong>
            {(player.vehicles ||
              []).length}
          </strong>
        </div>

        <div>
          <span>БАЛАНС</span>
          <strong>
            ${money(player.money)}
          </strong>
        </div>
      </div>

      <div className="product-grid">
        {vehicles.map(
          (vehicle) => {
            const owned =
              player.vehicles?.includes(
                vehicle.id
              );

            return (
              <div
                className="product-card"
                key={vehicle.id}
              >
                <div className="product-image car-image">
                  <div className="car-shape">
                    {ICONS.car}
                  </div>

                  <b>
                    CLASS{" "}
                    {vehicle.class ||
                      "C"}
                  </b>
                </div>

                <div className="product-body">
                  <span className="product-type">
                    {vehicle.type ||
                      "Автомобиль"}
                  </span>

                  <h3>
                    {vehicle.name}
                  </h3>

                  <div className="product-row">
                    <span>
                      Скорость
                    </span>
                    <strong>
                      {vehicle.speed ||
                        0}
                    </strong>
                  </div>

                  <div className="product-row">
                    <span>
                      Цена
                    </span>
                    <strong>
                      $
                      {money(
                        vehicle.price
                      )}
                    </strong>
                  </div>

                  <button
                    className={`button ${
                      owned
                        ? "secondary"
                        : "primary"
                    } wide`}
                    disabled={owned}
                    onClick={() =>
                      buyVehicle(
                        vehicle.id
                      )
                    }
                  >
                    {owned
                      ? "В ГАРАЖЕ"
                      : "КУПИТЬ"}
                  </button>
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}

/* ============================================================
   MARKET
============================================================ */

function Market({
  companies,
  updateMarket,
}) {
  return (
    <div>
      <PageHeader
        eyebrow="MARKET / LIVE"
        title="Рынок"
        description="Следи за компаниями и изменением городской экономики."
      />

      <div className="market-hero">
        <div>
          <span className="market-live">
            ● LIVE MARKET
          </span>

          <h2>
            Экономика
            <br />
            города
          </h2>

          <p>
            Рыночные показатели
            обновляются в реальном
            времени.
          </p>
        </div>

        <div className="market-chart">
          <div className="chart-line">
            ╱╲__╱╲___╱╲
            ╱╲
          </div>

          <span>
            +12.4%
          </span>
        </div>
      </div>

      <Panel
        title="Компании"
        action="ОБНОВИТЬ"
        onAction={updateMarket}
      >
        <div className="market-list">
          {companies.map(
            (company) => (
              <div
                className="market-item"
                key={company.id}
              >
                <div className="market-company-icon">
                  {company.icon ===
                  "car"
                    ? "▰"
                    : "▣"}
                </div>

                <div className="market-company">
                  <strong>
                    {company.name}
                  </strong>
                  <span>
                    {company.type ||
                      "Компания"}
                  </span>
                </div>

                <div className="market-price">
                  <strong>
                    $
                    {money(
                      company.income
                    )}
                  </strong>

                  <span className="up">
                    +{(
                      2.1 +
                      company.id *
                        1.4
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      </Panel>
    </div>
  );
}

/* ============================================================
   RANKING
============================================================ */

function Ranking({
  player,
  leaderboard,
}) {
  return (
    <div>
      <PageHeader
        eyebrow="CITY / LEADERBOARD"
        title="Рейтинг"
        description="Сравнивай достижения жителей FENIX CITY."
      />

      <div className="ranking-top">
        <div>
          <span>ТВОЙ РЕЙТИНГ</span>
          <strong>
            {num(
              player.rating
            )}
          </strong>
        </div>

        <div>
          <span>УРОВЕНЬ</span>
          <strong>
            {player.level || 1}
          </strong>
        </div>

        <div>
          <span>ДЕНЬГИ</span>
          <strong>
            ${money(player.money)}
          </strong>
        </div>
      </div>

      <Panel title="ТОП ЖИТЕЛЕЙ">
        <Leaderboard
          players={leaderboard}
          player={player}
        />
      </Panel>
    </div>
  );
}

function Leaderboard({
  players,
  player,
}) {
  if (!players.length) {
    return (
      <Empty text="Рейтинг пока пуст." />
    );
  }

  return (
    <div className="leaderboard">
      {players.map(
        (item, index) => {
          const current =
            String(item.id) ===
            String(player?.id);

          return (
            <div
              className={`rank-row ${
                current
                  ? "current"
                  : ""
              }`}
              key={
                item.id ||
                index
              }
            >
              <div className="rank-number">
                {item.rank ||
                  index + 1}
              </div>

              <div className="rank-avatar">
                {(
                  item.nickname ||
                  "F"
                )
                  .slice(0, 1)
                  .toUpperCase()}
              </div>

              <div className="rank-name">
                <strong>
                  {item.nickname}
                </strong>
                <span>
                  LVL{" "}
                  {item.level ||
                    1}
                </span>
              </div>

              <div className="rank-rating">
                <strong>
                  {num(
                    item.rating
                  )}
                </strong>
                <span>
                  рейтинг
                </span>
              </div>

              <div className="rank-money">
                $
                {money(
                  item.money
                )}
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}

/* ============================================================
   PROFILE
============================================================ */

function Profile({
  player,
  progress,
  logout,
}) {
  return (
    <div>
      <PageHeader
        eyebrow="ACCOUNT / PROFILE"
        title="Профиль"
        description="Информация о твоём жителе."
      />

      <div className="profile-grid">
        <div className="profile-card profile-main">
          <div className="profile-avatar">
            {(
              player.nickname ||
              "F"
            )
              .slice(0, 1)
              .toUpperCase()}
          </div>

          <span className="profile-status">
            ● ONLINE
          </span>

          <h2>
            {player.nickname}
          </h2>

          <p>
            {player.status ||
              "Гражданин"}{" "}
            ·{" "}
            {player.district ||
              "Пригород"}
          </p>

          <div className="profile-level">
            <div>
              <span>
                LEVEL
              </span>
              <strong>
                {player.level ||
                  1}
              </strong>
            </div>

            <div className="progress">
              <span
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>

          <button
            className="button secondary wide"
            onClick={logout}
          >
            ВЫЙТИ ИЗ АККАУНТА
          </button>
        </div>

        <div className="profile-details">
          <ProfileRow
            title="ID игрока"
            value={player.id}
          />

          <ProfileRow
            title="Работа"
            value={
              player.job ||
              "Безработный"
            }
          />

          <ProfileRow
            title="Район"
            value={
              player.district ||
              "Пригород"
            }
          />

          <ProfileRow
            title="Баланс"
            value={`$${money(
              player.money
            )}`}
          />

          <ProfileRow
            title="Рейтинг"
            value={num(
              player.rating
            )}
          />

          <ProfileRow
            title="Автомобилей"
            value={
              player.vehicles
                ?.length || 0
            }
          />

          <ProfileRow
            title="Недвижимость"
            value={
              player.properties
                ?.length || 0
            }
          />
        </div>
      </div>
    </div>
  );
}

function ProfileRow({
  title,
  value,
}) {
  return (
    <div className="profile-row">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

/* ============================================================
   COMPONENTS
============================================================ */

function PageHeader({
  eyebrow,
  title,
  description,
}) {
  return (
    <div className="page-header">
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}

function Panel({
  title,
  action,
  onAction,
  children,
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{title}</h2>

        {action && (
          <button
            onClick={onAction}
            disabled={!onAction}
          >
            {action} →
          </button>
        )}
      </div>

      {children}
    </section>
  );
}

function Empty({ text }) {
  return (
    <div className="empty">
      {text}
    </div>
  );
}

function MobileNav({
  page,
  navigate,
}) {
  const items = MENU.slice(
    0,
    5
  );

  return (
    <nav className="mobile-nav">
      {items.map(
        ([id, label, icon]) => (
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
            <Icon>
              {ICONS[icon]}
            </Icon>

            <span>{label}</span>
          </button>
        )
      )}
    </nav>
  );
}

export default App;
