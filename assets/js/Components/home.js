import React from "react";

import { getMyIp } from "../utils";
import { configureChannel } from "../socket";

class Home extends React.Component {
  state = {
    ip: "",
    peers: [],
  };
  constructor(props) {
    super(props);
  }
  async componentDidMount() {
    // configureChannel();
    const { channel, socket } = await configureChannel();
    channel
      .join()
      .receive("ok", ({ peers }) => this.setState({ peers }))
      .receive("error", ({ reason }) => {
        alert("Something wrong with socket");
        console.log("failed join", reason);
      })
      .receive("timeout", () => {
        alert("Networking issue. Still waiting....");
      });
    console.log(await getMyIp());
  }

  render() {
    return (
      <div>
        <h1>Home</h1>
      </div>
    );
  }
}

export default Home;
