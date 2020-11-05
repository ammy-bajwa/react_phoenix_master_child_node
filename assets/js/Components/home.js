import React from "react";

import { getMyIp } from "../utils/index";
import { setIdIfRequired } from "../utils/indexedDbUtils";
import { configureChannel } from "../socket";

class Home extends React.Component {
  state = {
    ip: "",
    id: "",
    type: "",
    localPeers: [],
    localPeersWebRtcConnections: [],
  };
  constructor(props) {
    super(props);
  }
  async componentDidMount() {
    const { channel, socket } = await configureChannel();
    setIdIfRequired();
    // channel
    //   .join()
    //   .receive("ok", async (data) => {
    //     const ip = await getMyIp();
    //   })
    //   .receive("error", ({ reason }) => {
    //     alert("Something wrong with socket");
    //     console.log("failed join", reason);
    //   })
    //   .receive("timeout", () => {
    //     alert("Networking issue. Still waiting....");
    //   });
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
