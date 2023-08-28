import React, { Component, RefObject } from "react";

interface IStar {
  X: number;
  Y: number;
  SX: number;
  SY: number;
  W: number;
  H: number;
  age: number;
  dies: number;
  C: string;
}

interface IStarFieldState {
  stars: IStar[];
  acceleration: number;
  starsToDraw: number;
}

class StarField extends Component<{}, IStarFieldState> {
  private fieldRef: RefObject<HTMLCanvasElement>;
  private interval?: NodeJS.Timeout;

  constructor(props: {}) {
    super(props);

    this.state = {
      stars: [],
      acceleration: 1,
      starsToDraw: 0,
    };

    this.fieldRef = React.createRef();
  }

  getUrlParameter = (sParam: string): string | boolean | undefined => {
    const sPageURL = decodeURIComponent(window.location.search.substring(1));
    const sURLVariables = sPageURL.split("&");
    let sParameterName;

    for (let i = 0; i < sURLVariables.length; i++) {
      sParameterName = sURLVariables[i].split("=");
      if (sParameterName[0] === sParam) {
        return sParameterName[1] === undefined ? true : sParameterName[1];
      }
    }
  };

  componentDidMount() {
    const starsToDraw = (this.fieldRef.current!.width * this.fieldRef.current!.height) / 833.33;
    const acceleration = Number(this.getUrlParameter("accel")) || 1;

    this.setState({
      starsToDraw: Number(this.getUrlParameter("stars")) || starsToDraw,
      acceleration: acceleration,
    });

    this.fieldRef.current!.width = window.innerWidth;
    this.fieldRef.current!.height = window.innerHeight;

    this.interval = setInterval(this.draw, 40);
  }

  componentWillUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  createStar = (): IStar => {
    const field = this.fieldRef.current!;
    const star: IStar = {
      X: field.width / 2,
      Y: field.height / 2,
      SX: Math.random() * 5 - 2.5,
      SY: Math.random() * 5 - 2.5,
      W: 1,
      H: 1,
      age: 0,
      dies: 500,
      C: "#ffffff",
    };

    let start = field.width > field.height ? field.width : field.height;
    star.X += (star.SX * start) / 5;
    star.Y += (star.SY * start) / 5;

    return star;
  };

  drawStar = (star: IStar): IStar | null => {
    const fieldCanvasElement = this.fieldRef.current!;
    const fieldContext = fieldCanvasElement.getContext("2d");

    star.X += star.SX;
    star.Y += star.SY;

    star.SX += star.SX / (50 / this.state.acceleration);
    star.SY += star.SY / (50 / this.state.acceleration);
    star.age++;

    if (
      [
        Math.floor(50 / this.state.acceleration),
        Math.floor(150 / this.state.acceleration),
        Math.floor(300 / this.state.acceleration),
      ].includes(star.age)
    ) {
      star.W++;
      star.H++;
    }

    if (star.X + star.W < 0 || star.X > fieldCanvasElement.width || star.Y + star.H < 0 || star.Y > fieldCanvasElement.height) {
      return null;
    }

    if (fieldContext) {
      fieldContext.fillStyle = star.C;
      fieldContext.fillRect(star.X, star.Y, star.W, star.H);
    }
    return star;
  };

  draw = () => {
    const field = this.fieldRef.current!;
    const fieldContext = field.getContext("2d")!;

    if (field.width !== window.innerWidth) field.width = window.innerWidth;
    if (field.height !== window.innerHeight) field.height = window.innerHeight;

    fieldContext.fillStyle = "rgba(0, 0, 0, 0.8)";
    fieldContext.fillRect(0, 0, field.width, field.height);

    const updatedStars = this.state.stars.map(this.drawStar).filter((star) => star !== null) as IStar[];

    while (updatedStars.length < this.state.starsToDraw) {
      updatedStars.push(this.createStar());
    }

    this.setState({ stars: updatedStars });
  };

  render() {
    return (
      <div className="star-field-canvas-wrapper absolute w-full">
        <canvas className="max-h-[calc(100vh-90px)] w-full" ref={this.fieldRef} id="field"></canvas>
      </div>
    );
  }
}

export default StarField;
