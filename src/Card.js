import React from "react";
import RollingNumber from "./RollingNumber";

import "./Card.scss";

class Card extends React.Component {
  constructor(props) {
    super(props);

    this.cardRef = React.createRef();

    this.state = {
      revealed: false,
    };
  }

  formatCreatedDate = () => {
    const createdAt = Number(this.props?.info?.createdAt);
    const createdStr = this.props?.info?.created;
    const ms =
      Number.isFinite(createdAt) && createdAt > 0
        ? createdAt
        : Date.parse(createdStr);
    if (!Number.isFinite(ms) || ms <= 0) return null;
    return new Date(ms);
  };

  formatRelativeTimeTr = (date) => {
    if (!date) return null;
    const nowMs = Date.now();
    const diffMs = date.getTime() - nowMs;
    const absMs = Math.abs(diffMs);

    const units = [
      ["year", 1000 * 60 * 60 * 24 * 365],
      ["month", 1000 * 60 * 60 * 24 * 30],
      ["week", 1000 * 60 * 60 * 24 * 7],
      ["day", 1000 * 60 * 60 * 24],
      ["hour", 1000 * 60 * 60],
      ["minute", 1000 * 60],
    ];

    let unit = "minute";
    let value = 0;

    for (const [candidateUnit, unitMs] of units) {
      if (absMs >= unitMs) {
        unit = candidateUnit;
        value = Math.round(absMs / unitMs);
        break;
      }
    }

    const signedValue = diffMs < 0 ? -value : value;

    try {
      if (typeof Intl !== "undefined" && Intl.RelativeTimeFormat) {
        const rtf = new Intl.RelativeTimeFormat("tr", { numeric: "always" });
        return rtf.format(signedValue, unit);
      }
    } catch {
      // ignore
    }

    return null;
  };

  componentDidMount() {
    if (!this.cardRef || !this.cardRef.current) return;

    if (typeof window !== "undefined" && "IntersectionObserver" in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry && entry.isIntersecting) {
            this.setState({ revealed: true });
            if (this.observer) this.observer.disconnect();
          }
        },
        { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.15 }
      );

      this.observer.observe(this.cardRef.current);
    } else {
      this.setState({ revealed: true });
    }
  }

  componentWillUnmount() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  render() {
    const createdDate = this.formatCreatedDate();
    const createdText = createdDate
      ? createdDate.toLocaleDateString("tr-TR")
      : null;
    const relativeText = createdDate
      ? this.formatRelativeTimeTr(createdDate)
      : null;

    return (
      <a
        ref={this.cardRef}
        className={`card ${this.state.revealed ? "is-revealed" : ""}`}
        style={{
          "--reveal-delay": `${Math.min(this.props.index || 0, 12) * 60}ms`,
        }}
        href={`https://www.roblox.com/games/${this.props.info.gameId}`}
      >
        <div className="card-inner">
          <div className="container">
            <div className="thumbnail-wrap">
              <img
                className="thumbnail"
                src={this.props.info.thumbnail}
                alt="Game Thumbnail"
              ></img>
            </div>
            <b className="name info">{this.props.info.name}</b>
            <p className="playing info">
              <i className="fa fa-user" />{" "}
              <b>{<RollingNumber goal={this.props.info.playing} />}</b> Playing
            </p>
            <p className="visits info">
              <i className="fa fa-eye" />{" "}
              <b>{<RollingNumber goal={this.props.info.visits} />}</b> Visits
            </p>
            <p className="favorites info">
              <i className="fa fa-star" />{" "}
              <b>{<RollingNumber goal={this.props.info.favorites} />}</b>{" "}
              Favorites
            </p>
            {createdText ? (
              <p className="created info">
                {createdText}
                {relativeText ? (
                  <span className="created-relative"> ({relativeText})</span>
                ) : null}
              </p>
            ) : null}
          </div>
        </div>
      </a>
    );
  }
}

export default Card;
