import React from "react";

import { getMyIp } from "../utils";
import { configureChannel } from "../socket";

class Home extends React.Component {
  state = {
    ip: "",
    id: "",
    type: "",
    localPeers: [],
    localPeersConnections: [],
  };
  constructor(props) {
    super(props);
  }
  async componentDidMount() {
    // configureChannel();
    const { channel, socket } = await configureChannel();
    channel
      .join()
      .receive("ok", async ({ local_peers, id, type }) => {
        const ip = await getMyIp();
        this.setState({ localPeers: local_peers, id, type, ip }, () => {
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
    const componentThis = this;
    channel.on(`initial:new_${ip}`, (data) => {
      const { id } = this.state;
      if (id !== data.id) {
        const { localPeers } = this.state;
        const updatedPeers = [...localPeers, data];
        componentThis.setState({ localPeers: updatedPeers });
        // console.log(`initial:new_${ip} `, data);
      }
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
