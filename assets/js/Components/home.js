import React from "react";

import { getMyIp } from "../utils";
import { configureChannel } from "../socket";

class Home extends React.Component {
  state = {
    ip: "",
    id: "",
    type: "",
    peers: [],
  };
  constructor(props) {
    super(props);
  }
  async componentDidMount() {
    // configureChannel();
    const { channel, socket } = await configureChannel();
    const componentThis = this;
    channel
      .join()
      .receive("ok", async ({ peers, id, type }) => {
        const ip = await getMyIp();
        this.setState({ peers, id, type, ip }, () => {
          this.newNodeListener(channel);
          this.sendBroadcast(channel);
        });
      })
      .receive("error", ({ reason }) => {
        alert("Something wrong with socket");
        console.log("failed join", reason);
      })
      .receive("timeout", () => {
        alert("Networking issue. Still waiting....");
      });
  }

  newNodeListener = (channel) => {
    const { ip } = this.state;
    channel.on(`initial:new_${ip}`, function (data) {
      console.log(`initial:new_${ip} `, data);
    });
  };

  sendBroadcast = (channel) => {
    const { ip, id } = this.state;
    channel.push("initial:boadcast_new_node", { ip, id });
  };

  render() {
    return (
      <div>
        <h1>Home</h1>
      </div>
    );
  }
}

export default Home;
