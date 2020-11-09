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
            componentThis.listenForOfferFromChild(channel);
          } else {
            componentThis.setupLanPeerConnectionChild(channel);
            componentThis.listenAnswerFromMaster(channel);
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

  listenAnswerFromMaster = (channel) => {
    const { machineId } = this.state;
    channel.on(
      `web:answer_from_master_${machineId}`,
      async ({ answer_for_child, master_id, child_id }) => {
        const { lanPeersWebRtcConnections } = this.state;
        let updatedArr = lanPeersWebRtcConnections.map(async (peerObj) => {
          if (peerObj.machineId === master_id) {
            await peerObj.peerConnection.setRemoteDescription(answer_for_child);
          }
          return peerObj;
        });
        updatedArr = await Promise.all(updatedArr);
        this.setState({
          lanPeersWebRtcConnections: updatedArr,
        });
      }
    );
  };

  setupLanPeerConnectionChild = async (channel) => {
    const { ip, machineId, lanPeers } = this.state;
    // Here we will create the connection for child to connect to master
    const peerConnection = this.createPeerConnectionObj();
    const peerDataChannel = this.createPeerDataChannel(peerConnection);
    const offerForMaster = await this.createOffer(peerConnection);
    peerConnection.setLocalDescription(offerForMaster);

    const masterNode = lanPeers[lanPeers.length - 1];
    const connObj = {
      ip,
      machineId: masterNode.machine_id,
      type: "MASTER",
      peerConnection,
      peerDataChannel,
    };
    this.setState(
      {
        lanPeersWebRtcConnections: [connObj],
      },
      () => {
        channel.push("web:send_offer_to_master", {
          offer_for_master: offerForMaster,
          ip,
          machine_id: machineId,
        });
      }
    );
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
      this.listenForOfferFromChild(channel);
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

  listenForOfferFromChild = (channel) => {
    const { ip, machineId: master_id } = this.state;
    channel.on(
      `web:offer_from_child_${ip}`,
      async ({ machineId, offer_for_master, ip }) => {
        const { lanPeersWebRtcConnections } = this.state;
        let updatedArr = lanPeersWebRtcConnections.map(async (connObj) => {
          if (connObj.machineId === machineId) {
            await connObj.peerConnection.setRemoteDescription(
              new RTCSessionDescription(offer_for_master)
            );
            const answerForChild = await connObj.peerConnection.createAnswer();
            await connObj.peerConnection.setLocalDescription(answerForChild);
            channel.push(`web:send_answer_to_child`, {
              answer_for_child: answerForChild,
              master_id,
              child_id: connObj.machineId,
            });
          }
          return connObj;
        });
        updatedArr = await Promise.all(updatedArr);
        console.log("updatedArr: ", updatedArr);
        this.setState({
          lanPeersWebRtcConnections: updatedArr,
        });
      }
    );
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
