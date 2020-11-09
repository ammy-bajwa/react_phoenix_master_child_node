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
    lanPeersWebRtcConnections: [],
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
    // Here we will create the connection for child to connect to master
    const peerConnection = this.createPeerConnectionObj();
    const peerDataChannel = this.createPeerDataChannel(peerConnection);
    const offerFromChild = await this.createOffer(peerConnection);
    peerConnection.setLocalDescription(offerFromChild);
    // Send offer to master
    console.log("peerConnection ", peerConnection);
    console.log("peerDataChannel ", peerDataChannel);
    console.log("offerFromChild ", offerFromChild);
  };

  createOffer = async (peerConnection) => {
    return await peerConnection.createOffer();
  };

  createPeerDataChannel = (peerConnection) => {
    const dataChannelOptions = {
      reliable: true,
    };

    const peerDataChannel = peerConnection.createDataChannel(
      "myDataChannel",
      dataChannelOptions
    );
    peerDataChannel.onopen = function (event) {
      console.log("myDataChannel is open", peerDataChannel);
      console.log("Ready........");
    };
    peerDataChannel.onerror = function (error) {
      console.log("Error:", error);
    };

    peerDataChannel.onmessage = function (event) {
      console.log("Got message:", event.data);
    };
    return peerDataChannel;
  };

  createPeerConnectionObj = () => {
    const configuration = {
      iceServers: [{ url: "stun:stun.12connect.com:3478" }],
    };

    const peerConnection = new webkitRTCPeerConnection(configuration);
    peerConnection.onicecandidate = function (event) {
      console.log("onicecandidate");
      // if (event.candidate) {
      //   send({
      //     type: "candidate",
      //     candidate: event.candidate,
      //   });
      // }
    };
    peerConnection.ondatachannel = function (event) {
      const dataChannel = event.channel;
      console.log("Channel Successfull ondatachannel.......");
    };

    return peerConnection;
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
      console.log("make_me_master ", lan_peers);
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
        const { lanPeers, lanPeersWebRtcConnections } = this.state;
        const updatedPeers = [...lanPeers, data];
        componentThis.setState({ lanPeers: updatedPeers });
        componentThis.handleNewChildPeerConnectionCreation(data);
      }
    });
  };

  handleNewChildPeerConnectionCreation = async ({ ip, machine_id, type }) => {
    const { lanPeersWebRtcConnections } = this.state;
    const peerConnection = this.createPeerConnectionObj();
    const peerDataChannel = this.createPeerDataChannel(peerConnection);
    const connObj = {
      ip,
      machineId: machine_id,
      type,
      peerConnection,
      peerDataChannel,
    };
    const updatedPeers = [...lanPeersWebRtcConnections, connObj];
    this.setState({
      lanPeersWebRtcConnections: updatedPeers,
    });
  };

  removeNodeListener = (channel) => {
    const { ip } = this.state;
    channel.on(`web:remove_${ip}`, (data) => {
      const { lanPeers, lanPeersWebRtcConnections } = this.state;
      const updatedPeers = lanPeers.filter(
        (node) => node.machine_id !== data.machine_id
      );
      const updatedPeersWebRtcConnections = lanPeersWebRtcConnections.filter(
        (nodeObj) => nodeObj.machine_id !== data.machine_id
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
  render() {
    const { ip, type, lanPeers, machineId } = this.state;
    return (
      <div>
        <h1>Self</h1>
        <h2>{ip}</h2>
        <h2>
          I am {type} - {machineId}
        </h2>
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
