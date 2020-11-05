import React from "react";

import { getMyIp } from "../utils/index";
import {
  setIdIfRequired,
  getMachineId,
  setNodeType,
  getNodeType,
} from "../utils/indexedDbUtils";
import { configureChannel } from "../socket";

class Home extends React.Component {
  state = {
    ip: "",
    machineId: "",
    type: "",
    lanPeers: [],
    localPeersWebRtcConnections: [],
  };
  constructor(props) {
    super(props);
  }

  async componentWillUnmount() {
    await setNodeType("");
  }

  async componentDidMount() {
    const { channel, socket } = await configureChannel();
    const componentThis = this;
    await this.setupIp();
    await this.manageMachineId();
    channel
      .join()
      .receive("ok", async ({ lan_peers }) => {
        console.log("lan_peers ", lan_peers);
        if (lan_peers.length > 0) {
          await setNodeType("CHILD");
        } else {
          setNodeType("MASTER");
        }
        const nodeType = await getNodeType();
        this.setState({ lanPeers: lan_peers, type: nodeType }, () => {
          componentThis.addSelfToIpNodeList(channel);
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

  addSelfToIpNodeList = (channel) => {
    const { ip, machineId, type } = this.state;
    channel.push("web:add_self_to_ip_node_list", {
      ip,
      machine_id: machineId,
      type,
    });
    console.log("addSelfToIpNodeList");
  };

  setupChild = async () => {};

  setupIp = async () => {
    const ip = await getMyIp();
    this.setState({ ip });
  };

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
