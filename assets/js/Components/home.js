import React from "react";

import { getMyIp } from "../utils/index";
import { setIdIfRequired, getMachineId } from "../utils/indexedDbUtils";
import { configureChannel } from "../socket";

class Home extends React.Component {
  state = {
    ip: "",
    machineId: "",
    type: "",
    localPeers: [],
    localPeersWebRtcConnections: [],
  };
  constructor(props) {
    super(props);
  }
  async componentDidMount() {
    const { channel, socket } = await configureChannel();
    await this.manageMachineId();
    channel
      .join()
      .receive("ok", async (data) => {
        const ip = await getMyIp();
      })
      .receive("error", ({ reason }) => {
        alert("Something wrong with socket");
        console.log("failed join", reason);
      })
      .receive("timeout", () => {
        alert("Networking issue. Still waiting....");
      });
  }

  manageMachineId = async () => {
    const machineId = await getMachineId();
    this.setState({
      machineId,
    });
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
