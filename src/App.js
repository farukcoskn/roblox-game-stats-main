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

    this.state = {
      gameInfo: {},
      analytics: {
        playing: 0,
        visits: 0,
      },
      loaded: false,
    };
  }

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

        this.setState((prev) => ({
          gameInfo: info.mainData,
          analytics: {
            playing: nextPlaying,
            visits: nextVisits,
          },
          loaded: prev.loaded || true,
        }));
      })
      .catch(() => {
        // Keep last good state on transient failures.
      });
  };

  componentDidMount() {
    this.refresh();

    this.refreshInterval = setInterval(() => {
      this.refresh();
    }, 5000);
  }

  componentWillUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  render() {
    return (
      <div className="app">
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
            </div>
          </div>
        </header>

        <div className="spacer" aria-hidden="true" />

        <div className="game-list" ref={this.listRef}>
          {this.state.loaded ? null : (
            <div className="lds-ellipsis">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          )}
          {Object.values(this.state.gameInfo)
            .sort((a, b) => b.playing - a.playing)
            .map((info, index) => {
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
