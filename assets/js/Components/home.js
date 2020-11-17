import React from "react";

import { getMyIp } from "../utils/index";
import { masterCreateWebRtcConObj } from "../utils/master/masterWebRtcUtils";
import { childCreateWebRtcConObj } from "../utils/child/childWebrtcUtils";
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
    lanPeersWebRtcConnections: [],
    messageForChild: "",
  };
  constructor(props) {
    super(props);
  }

  // async componentWillUnmount() {
  //   await setNodeType("");
  // }

  async componentDidMount() {
    const { channel, socket } = await configureChannel();
    const componentThis = this;
    await this.setupIp();
    await this.manageMachineId();
    channel
      .join()
      .receive("ok", async ({ lan_peers, type }) => {
        // Receiving null here if request is from same browser
        if (!lan_peers) {
          channel.leave();
          alert("Already a connection is established in other tab");
          return;
        }
        await setNodeType(type);
        this.setState({ lanPeers: lan_peers, type }, () => {
          if (type === "MASTER") {
            componentThis.newNodeListener(channel);
            componentThis.removeNodeListener(channel);
          } else {
            componentThis.setupLanPeerConnectionChild(channel);
          }
          componentThis.updateMasterInChild(channel);
          componentThis.addSelfToIpNodeList(channel);
          componentThis.makeThisNodeMaster(channel);
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

  setupLanPeerConnectionChild = async (channel) => {
    const { ip, machineId, lanPeers, type } = this.state;
    // const masterNode = lanPeers[lanPeers.length - 1];
    // // Here we will create the connection for child to connect to master
    // const {
    //   peerConnection,
    // } =
    // await this.createPeerConnectionForMasterFromChild(channel);
    childCreateWebRtcConObj(channel, ip, machineId);
    // console.log("masterNode: ", masterNode);
    // const masterConnObj = {
    //   peerConnection,
    //   machineId: masterNode.machine_id,
    //   type: "MASTER",
    // };
    // this.setState({
    //   lanPeersWebRtcConnections: [masterConnObj],
    // });
  };

  updateMasterInChild = (channel) => {
    const { ip } = this.state;
    channel.on(`web:update_master_in_child${ip}`, (data) => {
      const updatedPeers = [
        { machine_id: data.machine_id, ip: data.ip, type: "MASTER" },
      ];
      const updatedPeersWebRtcConnections = [];
      this.setState({
        lanPeers: updatedPeers,
        lanPeersWebRtcConnections: updatedPeersWebRtcConnections,
      });
    });
  };

  makeThisNodeMaster = (channel) => {
    const { machineId } = this.state;
    channel.on(`web:make_me_master_${machineId}`, async ({ ip, lan_peers }) => {
      this.setState({
        lanPeers: lan_peers,
        type: "MASTER",
      });
      await setNodeType("MASTER");
      this.newNodeListener(channel);
      this.removeNodeListener(channel);
    });
  };
  // This will be called when new node added in already existed node
  newNodeListener = (channel) => {
    const { ip } = this.state;
    const componentThis = this;
    channel.on(`web:new_${ip}`, (data) => {
      const { machineId } = this.state;
      if (machineId !== data.machine_id) {
        const { lanPeers } = this.state;
        const updatedPeers = [...lanPeers, data];
        componentThis.setState({ lanPeers: updatedPeers });
        componentThis.handleNewChildPeerConnectionCreation(data, channel);
      }
    });
  };

  handleNewChildPeerConnectionCreation = async (
    { ip, machine_id: childId, type },
    channel
  ) => {
    const {
      lanPeersWebRtcConnections,
      machineId,
      type: currentType,
    } = this.state;
    // const {
    //   peerConnection,
    // peerDataChannel,
    // } =
    // await this.createPeerConnectionForChildFromMaster(channel, childId);
    masterCreateWebRtcConObj(channel, ip, machineId, childId);
    // const connObj = {
    //   ip,
    //   machineId: childId,
    //   type,
    //   peerConnection,
    // peerDataChannel,
    // };
    // let updatedPeers = [...lanPeersWebRtcConnections, connObj];
    // updatedPeers = await Promise.all(updatedPeers);
    // this.setState({
    //   lanPeersWebRtcConnections: updatedPeers,
    // });
  };

  removeNodeListener = (channel) => {
    const { ip } = this.state;
    channel.on(`web:remove_${ip}`, (data) => {
      const { lanPeers, lanPeersWebRtcConnections } = this.state;
      const updatedPeers = lanPeers.filter(
        (node) => node.machine_id !== data.machine_id
      );
      const updatedPeersWebRtcConnections = lanPeersWebRtcConnections.filter(
        (nodeObj) => nodeObj.machineId !== data.machine_id
      );
      this.setState({
        lanPeers: updatedPeers,
        lanPeersWebRtcConnections: updatedPeersWebRtcConnections,
      });
    });
  };

  addSelfToIpNodeList = (channel) => {
    const { ip, machineId, type } = this.state;
    channel.push("web:add_self_to_ip_node_list", {
      ip,
      machine_id: machineId,
      type,
    });
  };

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

  handleMessageForChild = (event) => {
    this.setState({
      messageForChild: event.target.value,
    });
  };

  handleMessageToChilds = () => {
    const { lanPeersWebRtcConnections, messageForChild } = this.state;
    lanPeersWebRtcConnections.map(({ peerConnection, peerDataChannel }) => {
      console.log("peerConnection: ", peerConnection);
      console.log("peerDataChannel: ", peerDataChannel);
    });
  };
  render() {
    const { ip, type, lanPeers, machineId } = this.state;
    return (
      <div>
        <h1>Self</h1>
        <h2>{ip}</h2>
        <h2>
          I am {type} - {machineId}
        </h2>
        <button id="sendOfferMaster">Send Offer Master</button>
        <button id="dataChannelMaster">Open Data Channel Master</button>
        <button id="dataChannelChild">Open Data Channel Child</button>
        <button id="stateMaster">State Master</button>
        <button id="stateChild">State Child</button>
        {type === "MASTER" && (
          <div>
            <input
              type="text"
              onChange={this.handleMessageForChild}
              placeholder="Send message to child"
            />
            <button onClick={this.handleMessageToChilds}>Send</button>
          </div>
        )}
        <hr />
        <h1>Peers</h1>
        {lanPeers.map(({ ip, type, machine_id }, i) => (
          <h2 key={i}>
            {ip} - {type} - {machine_id}
          </h2>
        ))}
      </div>
    );
  }
}

export default Home;
