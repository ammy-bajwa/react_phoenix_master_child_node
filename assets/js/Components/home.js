import React from "react";

import { getMyIp } from "../utils";
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
    // configureChannel();
    const { channel, socket } = await configureChannel();
    channel
      .join()
      .receive("ok", async ({ local_peers, id, type }) => {
        const ip = await getMyIp();
        this.setState({ localPeers: local_peers, id, type, ip }, () => {
          this.newNodeListener(channel);
          this.removeNodeListener(channel);
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
        componentThis.setupPeerConn(data);
      }
    });
  };

  removeNodeListener = (channel) => {
    const { ip } = this.state;
    channel.on(`initial:remove_${ip}`, (data) => {
      const { localPeers, localPeersWebRtcConnections } = this.state;
      const updatedPeers = localPeers.filter((node) => node.id !== data.id);
      const updatedPeersWebRtcConnections = localPeersWebRtcConnections.filter(
        (nodeObj) => nodeObj.id !== data.id
      );
      this.setState({
        localPeers: updatedPeers,
        localPeersWebRtcConnections: updatedPeersWebRtcConnections,
      });
    });
  };

  setupPeerConn = ({ id, type }) => {
    //creating our RTCPeerConnection object
    const configuration = {
      iceServers: [{ url: "stun:stun.12connect.com:3478" }],
    };

    const peeConnection = new webkitRTCPeerConnection(configuration);

    console.log("RTCPeerConnection object was created");

    //setup ice handling
    //when the browser finds an ice candidate we send it to another peer
    peeConnection.onicecandidate = function (event) {
      if (event.candidate) {
        send({
          type: "candidate",
          candidate: event.candidate,
        });
      }
    };

    peeConnection.ondatachannel = function (event) {
      const dataChannel = event.channel;
      console.log("Channel Successfull.......");
    };

    const dataChannelOptions = {
      reliable: true,
    };

    const dataChannel = peeConnection.createDataChannel(
      "myDataChannel",
      dataChannelOptions
    );
    dataChannel.onopen = function (event) {
      console.log("myDataChannel is open", dataChannel);
    };
    dataChannel.onerror = function (error) {
      console.log("Error:", error);
    };

    dataChannel.onmessage = function (event) {
      console.log("Got message:", event.data);
    };

    this.addToLocalPeersWebRtcConnections(peeConnection, dataChannel, id, type);
  };

  addToLocalPeersWebRtcConnections = (peeConnection, dataChannel, id, type) => {
    const { localPeersWebRtcConnections } = this.state;
    const peerConnObj = {
      peeConnection,
      dataChannel,
      id,
      type,
    };
    const updatedArr = [...localPeersWebRtcConnections, peerConnObj];
    this.setState({
      localPeersWebRtcConnections: updatedArr,
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
