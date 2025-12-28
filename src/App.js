import React from "react";

import "./App.scss";
import "./Wheel.scss";

import Roblox from "./API/Roblox";

import Games from "./Games.json";
import Card from "./Card";
import RollingNumber from "./RollingNumber";

class App extends React.Component {
  constructor(props) {
    super(props);

    this.listRef = React.createRef();
    this.sortRef = React.createRef();

    const hour = new Date().getHours();
    const defaultTheme = hour >= 20 ? "dark" : "light";

    this.state = {
      gameInfo: {},
      analytics: {
        playing: 0,
        visits: 0,
        favorites: 0,
        games: 0,
      },
      sortKey: "playing",
      sortDirection: "desc",
      sortMenuOpen: false,
      theme: defaultTheme,
      loaded: false,
    };
  }

  applyTheme = (nextTheme, { animate = true } = {}) => {
    if (nextTheme !== "dark" && nextTheme !== "light") return;

    if (typeof document !== "undefined") {
      const root = document.documentElement;

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (animate && !prefersReducedMotion) {
        root.classList.add("theme-animate");
        if (this.themeTimer) {
          clearTimeout(this.themeTimer);
        }
        this.themeTimer = setTimeout(() => {
          root.classList.remove("theme-animate");
        }, 320);
      }

      root.dataset.theme = nextTheme;
    }

    if (this.state.theme !== nextTheme) {
      this.setState({ theme: nextTheme });
    }
  };

  onThemeSelect = (nextTheme) => {
    this.applyTheme(nextTheme, { animate: true });
  };

  setSortKey = (nextSortKey) => {
    if (
      nextSortKey !== "playing" &&
      nextSortKey !== "visits" &&
      nextSortKey !== "favorites" &&
      nextSortKey !== "created"
    ) {
      return;
    }

    this.setState({ sortKey: nextSortKey });
  };

  setSortDirection = (nextDirection) => {
    if (nextDirection !== "asc" && nextDirection !== "desc") return;
    this.setState({ sortDirection: nextDirection });
  };

  toggleSortMenu = () => {
    this.setState((prev) => ({ sortMenuOpen: !prev.sortMenuOpen }));
  };

  closeSortMenu = () => {
    this.setState({ sortMenuOpen: false });
  };

  onSelectSortKey = (nextSortKey) => {
    this.setSortKey(nextSortKey);
    this.closeSortMenu();
  };

  onDocumentPointerDown = (event) => {
    if (!this.state.sortMenuOpen) return;
    const root = this.sortRef?.current;
    if (!root) return;
    if (root.contains(event.target)) return;
    this.closeSortMenu();
  };

  onDocumentKeyDown = (event) => {
    if (!this.state.sortMenuOpen) return;
    if (event.key === "Escape") {
      event.preventDefault();
      this.closeSortMenu();
    }
  };

  getSortedGames = () => {
    const games = Object.values(this.state.gameInfo);
    const sortKey = this.state.sortKey;
    const sortDirection = this.state.sortDirection;

    const getNumber = (value) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : 0;
    };

    const getCreatedTimestamp = (value) => {
      if (!value) return 0;
      const ms = Date.parse(value);
      return Number.isFinite(ms) ? ms : 0;
    };

    const getCreatedAt = (game) => {
      const explicit = Number(game?.createdAt);
      if (Number.isFinite(explicit) && explicit > 0) return explicit;
      return getCreatedTimestamp(game?.created);
    };

    const compareDescending = (a, b, key) => {
      const diff = getNumber(b?.[key]) - getNumber(a?.[key]);
      if (diff !== 0) return diff;
      return String(a?.name || "").localeCompare(String(b?.name || ""));
    };

    return games.sort((a, b) => {
      let cmp = 0;

      if (sortKey === "created") {
        cmp = getCreatedAt(b) - getCreatedAt(a);
      } else {
        cmp = compareDescending(a, b, sortKey);
      }

      if (cmp === 0) {
        cmp = String(a?.name || "").localeCompare(String(b?.name || ""));
      }

      return sortDirection === "asc" ? -cmp : cmp;
    });
  };

  scrollToList = () => {
    if (this.listRef && this.listRef.current) {
      this.listRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  refresh = () => {
    Roblox.getGameInfo(Games)
      .then((info) => {
        if (!info || typeof info !== "object") return;
        if (!info.mainData || typeof info.mainData !== "object") return;
        if (!info.totalAnalytics || typeof info.totalAnalytics !== "object")
          return;

        const nextKeys = Object.keys(info.mainData);
        if (nextKeys.length === 0) return;

        const nextPlaying = Number(info.totalAnalytics.playing);
        const nextVisits = Number(info.totalAnalytics.visits);
        if (!Number.isFinite(nextPlaying) || !Number.isFinite(nextVisits))
          return;

        const nextFavorites = Object.values(info.mainData).reduce(
          (sum, game) => {
            const value = Number(game?.favorites);
            return sum + (Number.isFinite(value) ? value : 0);
          },
          0
        );

        const nextGames = nextKeys.length;

        this.setState((prev) => ({
          gameInfo: info.mainData,
          analytics: {
            playing: nextPlaying,
            visits: nextVisits,
            favorites: nextFavorites,
            games: nextGames,
          },
          loaded: prev.loaded || true,
        }));
      })
      .catch(() => {
        // Keep last good state on transient failures.
      });
  };

  componentDidMount() {
    this.applyTheme(this.state.theme, { animate: false });
    this.refresh();

    document.addEventListener("pointerdown", this.onDocumentPointerDown);
    document.addEventListener("keydown", this.onDocumentKeyDown);

    this.refreshInterval = setInterval(() => {
      this.refresh();
    }, 5000);
  }

  componentWillUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    if (this.themeTimer) {
      clearTimeout(this.themeTimer);
    }

    document.removeEventListener("pointerdown", this.onDocumentPointerDown);
    document.removeEventListener("keydown", this.onDocumentKeyDown);
  }

  render() {
    const sortLabels = {
      playing: "Playing",
      visits: "Visits",
      favorites: "Favorites",
      created: "Created date",
    };

    const currentSortLabel =
      sortLabels[this.state.sortKey] || sortLabels.playing;

    return (
      <div className="app">
        <div className="theme-toggle" role="group" aria-label="Theme">
          <button
            type="button"
            className={`theme-option ${
              this.state.theme === "light" ? "is-active" : ""
            }`}
            aria-pressed={this.state.theme === "light"}
            onClick={() => this.onThemeSelect("light")}
          >
            Light
          </button>
          <button
            type="button"
            className={`theme-option ${
              this.state.theme === "dark" ? "is-active" : ""
            }`}
            aria-pressed={this.state.theme === "dark"}
            onClick={() => this.onThemeSelect("dark")}
          >
            Dark
          </button>
        </div>

        <header className="hero">
          <div className="hero-content">
            <div className="pill">Live Roblox stats</div>
            <h1 className="hero-title">
              Accelerate Your
              <br />
              <span className="hero-title-accent">Game Intelligence</span>
            </h1>
            <p className="hero-subtitle">
              Highly personalized game analytics, refreshed in real time.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={this.scrollToList}>
                Get started
              </button>
            </div>

            <div className="hero-metrics">
              <div className="metric">
                <div className="metric-value">
                  <RollingNumber goal={this.state.analytics.playing} />
                </div>
                <div className="metric-label">Players</div>
              </div>
              <div className="metric">
                <div className="metric-value">
                  <RollingNumber goal={this.state.analytics.visits} />
                </div>
                <div className="metric-label">Total visits</div>
              </div>
              <div className="metric">
                <div className="metric-value">
                  <RollingNumber goal={this.state.analytics.favorites} />
                </div>
                <div className="metric-label">Total favorites</div>
              </div>
              <div className="metric">
                <div className="metric-value">
                  <RollingNumber goal={this.state.analytics.games} />
                </div>
                <div className="metric-label">Total games</div>
              </div>
            </div>
          </div>
        </header>

        <div className="spacer" aria-hidden="true" />

        <div className="list-toolbar">
          <div className="sort-control" ref={this.sortRef}>
            <span className="sort-label">Sort by</span>
            <div className="sort-dropdown">
              <button
                type="button"
                className="sort-trigger"
                onClick={this.toggleSortMenu}
                aria-haspopup="listbox"
                aria-expanded={this.state.sortMenuOpen}
              >
                {currentSortLabel}
              </button>
              {this.state.sortMenuOpen ? (
                <div className="sort-menu" role="listbox" tabIndex={-1}>
                  <button
                    type="button"
                    className={`sort-option ${
                      this.state.sortKey === "playing" ? "is-selected" : ""
                    }`}
                    role="option"
                    aria-selected={this.state.sortKey === "playing"}
                    onClick={() => this.onSelectSortKey("playing")}
                  >
                    Playing
                  </button>
                  <button
                    type="button"
                    className={`sort-option ${
                      this.state.sortKey === "visits" ? "is-selected" : ""
                    }`}
                    role="option"
                    aria-selected={this.state.sortKey === "visits"}
                    onClick={() => this.onSelectSortKey("visits")}
                  >
                    Visits
                  </button>
                  <button
                    type="button"
                    className={`sort-option ${
                      this.state.sortKey === "favorites" ? "is-selected" : ""
                    }`}
                    role="option"
                    aria-selected={this.state.sortKey === "favorites"}
                    onClick={() => this.onSelectSortKey("favorites")}
                  >
                    Favorites
                  </button>
                  <button
                    type="button"
                    className={`sort-option ${
                      this.state.sortKey === "created" ? "is-selected" : ""
                    }`}
                    role="option"
                    aria-selected={this.state.sortKey === "created"}
                    onClick={() => this.onSelectSortKey("created")}
                  >
                    Created date
                  </button>
                </div>
              ) : null}
            </div>

            <div
              className="sort-direction"
              role="group"
              aria-label="Sort direction"
            >
              <button
                type="button"
                className={`sort-dir-btn ${
                  this.state.sortDirection === "desc" ? "is-selected" : ""
                }`}
                aria-pressed={this.state.sortDirection === "desc"}
                onClick={() => this.setSortDirection("desc")}
              >
                En çoktan en aza
              </button>
              <button
                type="button"
                className={`sort-dir-btn ${
                  this.state.sortDirection === "asc" ? "is-selected" : ""
                }`}
                aria-pressed={this.state.sortDirection === "asc"}
                onClick={() => this.setSortDirection("asc")}
              >
                En azdan en çoğa
              </button>
            </div>
          </div>
        </div>

        <div className="game-list" ref={this.listRef}>
          {this.state.loaded ? null : (
            <div className="lds-ellipsis">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          )}
          {this.getSortedGames().map((info, index) => {
            return <Card info={info} index={index} key={info.gameId} />;
          })}
        </div>

        <img
          src={`${process.env.PUBLIC_URL}/logo.png`}
          alt="Logo"
          className="game-sector-logo"
          width="513px"
          height="438px"
        />
      </div>
    );
  }
}

export default App;
