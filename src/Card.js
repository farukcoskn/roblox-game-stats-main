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
    return (
      <a
        ref={this.cardRef}
        className={`card ${this.state.revealed ? "is-revealed" : ""}`}
        style={{
          "--reveal-delay": `${Math.min(this.props.index || 0, 12) * 60}ms`,
        }}
        href={`https://www.roblox.com/games/${this.props.info.gameId}`}
      >
        <div className="container">
          <img
            className="thumbnail"
            src={this.props.info.thumbnail}
            alt="Game Thumbnail"
          ></img>
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
        </div>
      </a>
    );
  }
}

export default Card;
