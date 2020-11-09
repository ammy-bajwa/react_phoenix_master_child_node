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
            componentThis.listenForOfferFromChild(channel);
            componentThis.listenForAnswerFromChild(channel);
          } else {
            componentThis.setupLanPeerConnectionChild(channel);
            componentThis.listenAnswerFromMaster(channel);
            componentThis.listenOfferFromMaster(channel);
          }
          componentThis.listenForIceCandidate(channel);
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

  listenForIceCandidate = (channel) => {
    const { machineId } = this.state;
    channel.on(`web:add_ice_candidate${machineId}`, async (data) => {
      const { lanPeersWebRtcConnections } = this.state;
      let updatedArr = lanPeersWebRtcConnections.map(async (connObj) => {
        if (connObj.machineId === data.sender) {
          console.log("Ice agent added");
          connObj.peerConnection.ondatachannel = function (event) {
            dataChannel = event.channel;
            console.log("Channel Successfull.......");
          };
          setTimeout(async () => {
            await connObj.peerConnection.addIceCandidate(
              new RTCIceCandidate(data.candidate)
            );
          }, 1000);
        }
        return connObj;
      });
      updatedArr = await Promise.all(updatedArr);
      this.setState({
        lanPeersWebRtcConnections: updatedArr,
      });
    });
  };

  listenOfferFromMaster = (channel) => {
    const { machineId, ip } = this.state;
    channel.on(
      `web:offer_from_master_${machineId}`,
      async ({ offer_for_child, master_id, child_id }) => {
        const { lanPeersWebRtcConnections } = this.state;
        let updatedArr = lanPeersWebRtcConnections.map(async (peerObj) => {
          if (peerObj.machineId === master_id) {
            await peerObj.peerConnection.setRemoteDescription(
              new RTCSessionDescription(offer_for_child)
            );
            console.log("master offer setRemote");
            const answerForMaster = await peerObj.peerConnection.createAnswer();
            console.log("master answer created");
            await peerObj.peerConnection.setLocalDescription(answerForMaster);
            console.log("master answer setLocal");
            channel.push(`web:send_answer_to_master`, {
              answer_for_master: answerForMaster,
              master_id: peerObj.machineId,
              child_id: machineId,
              ip: ip,
            });
          }
          return peerObj;
        });
        updatedArr = await Promise.all(updatedArr);
        console.log("listenOfferFromMaster: ", updatedArr);
        this.setState({
          lanPeersWebRtcConnections: updatedArr,
        });
      }
    );
  };

  listenAnswerFromMaster = (channel) => {
    const { machineId } = this.state;
    channel.on(
      `web:answer_from_master_${machineId}`,
      async ({ answer_for_child, master_id, child_id }) => {
        const { lanPeersWebRtcConnections } = this.state;
        console.log(
          "answer_from_master_ lanPeersWebRtcConnections: ",
          lanPeersWebRtcConnections
        );
        let updatedArr = lanPeersWebRtcConnections.map(async (peerObj) => {
          if (peerObj.machineId === master_id) {
            await peerObj.peerConnection.setRemoteDescription(answer_for_child);
          }
          return peerObj;
        });
        updatedArr = await Promise.all(updatedArr);
        console.log("listenAnswerFromMaster: ", updatedArr);
        this.setState({
          lanPeersWebRtcConnections: updatedArr,
        });
      }
    );
  };

  setupLanPeerConnectionChild = async (channel) => {
    const { ip, machineId, lanPeers, type } = this.state;
    const masterNode = lanPeers[lanPeers.length - 1];
    // Here we will create the connection for child to connect to master
    const peerConnection = this.createPeerConnectionObj(
      channel,
      masterNode.machine_id,
      type
    );
  };

  createOffer = async (peerConnection) => {
    return await peerConnection.createOffer();
  };

  createPeerConnectionObj = (channel, toReceive, currentMachineType) => {
    const componentThis = this;

    const { lanPeers, ip, machineId, lanPeersWebRtcConnections } = this.state;
    const masterNode = lanPeers[lanPeers.length - 1];

    const configuration = {
      iceServers: [{ url: "stun:stun.12connect.com:3478" }],
    };

    const peerConnection = new webkitRTCPeerConnection(configuration);

    peerConnection.onnegotiationneeded = async () => {
      // Create and send offer
      if (currentMachineType === "CHILD") {
        // From Child to Master
        console.log("child peerConnection created");
        const offerForMaster = await this.createOffer(peerConnection);
        console.log("child offer created");
        peerConnection.setLocalDescription(offerForMaster);
        console.log("child offer setLocal");
        const connObj = {
          ip,
          machineId: masterNode.machine_id,
          type: "MASTER",
          peerConnection,
        };
        this.setState(
          {
            lanPeersWebRtcConnections: [connObj],
          },
          () => {
            const { lanPeersWebRtcConnections } = this.state;
            channel.push("web:send_offer_to_master", {
              offer_for_master: offerForMaster,
              ip,
              machine_id: machineId,
            });

            console.log(
              "onnegotion lanPeersWebRtcConnections: ",
              lanPeersWebRtcConnections
            );
          }
        );
      } else {
        // From Master to Child
        const offerForChild = await this.createOffer(peerConnection);
        console.log("Master offer created");
        peerConnection.setLocalDescription(offerForChild);
        console.log("Master offer setLocal");

        channel.push("web:send_offer_to_child", {
          offer_for_child: offerForChild,
          ip,
          child_id: toReceive,
          master_id: machineId,
        });
        console.log("onnegotiationneeded MASTER", currentMachineType);
      }
      console.log("onnegotiationneeded", currentMachineType);
    };

    peerConnection.onicecandidate = function (event) {
      const { machineId, lanPeers, type } = componentThis.state;
      console.log("onicecandidate event: ", type, event);
      if (event.candidate) {
        if (type === "CHILD") {
          console.log("Must be master id: ", masterNode);
          const masterNode = lanPeers[lanPeers.length - 1];
          componentThis.addIceMessage(
            channel,
            machineId,
            masterNode.machine_id,
            event.candidate
          );
        } else {
          console.log("Must be child id: ", toReceive);
          componentThis.addIceMessage(
            channel,
            machineId,
            toReceive,
            event.candidate
          );
        }
      }
    };

    peerConnection.ondatachannel = function (event) {
      const dataChannel = event.channel;
      console.log("Channel Successfull ondatachannel.......", dataChannel);
    };
    const dataChannelOptions = {
      reliable: true,
      RtpDataChannels: true,
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

    return peerConnection;
  };

  addIceMessage = (channel, sender, receiver, candidate) => {
    channel.push(`web:add_ice`, {
      sender,
      receiver,
      candidate,
    });
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
        componentThis.handleNewChildPeerConnectionCreation(data, channel);
      }
    });
  };

  handleNewChildPeerConnectionCreation = async (
    { ip, machine_id, type },
    channel
  ) => {
    const {
      lanPeersWebRtcConnections,
      machineId,
      type: currentType,
    } = this.state;
    const peerConnection = this.createPeerConnectionObj(
      channel,
      machine_id,
      currentType
    );
    const connObj = {
      ip,
      machineId: machine_id,
      type,
      peerConnection,
    };
    const updatedPeers = [...lanPeersWebRtcConnections, connObj];
    console.log("handleNewChildPeerConnectionCreation: ", updatedPeers);
    this.setState({
      lanPeersWebRtcConnections: updatedPeers,
    });
  };

  listenForAnswerFromChild = (channel) => {
    const { ip, machineId: master_id } = this.state;
    channel.on(
      `web:answer_from_child_${ip}`,
      async ({ master_id, answer_for_master, child_id }) => {
        const { lanPeersWebRtcConnections } = this.state;
        let updatedArr = lanPeersWebRtcConnections.map(async (connObj) => {
          if (connObj.machineId === child_id) {
            await connObj.peerConnection.setRemoteDescription(
              new RTCSessionDescription(answer_for_master)
            );
            console.log("master offer setRemote");
          }
          return connObj;
        });
        updatedArr = await Promise.all(updatedArr);
        this.setState({
          lanPeersWebRtcConnections: updatedArr,
        });
      }
    );
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
            console.log("master offer setRemote");
            const answerForChild = await connObj.peerConnection.createAnswer();
            console.log("master answer created");
            await connObj.peerConnection.setLocalDescription(answerForChild);
            console.log("master answer setLocal");
            channel.push(`web:send_answer_to_child`, {
              answer_for_child: answerForChild,
              master_id,
              child_id: connObj.machineId,
            });
          }
          return connObj;
        });
        updatedArr = await Promise.all(updatedArr);
        console.log("listenForOfferFromChild: ", updatedArr);
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

  handleMessageForChild = (event) => {
    this.setState({
      messageForChild: event.target.value,
    });
  };

  handleMessageToChilds = () => {
    const { lanPeersWebRtcConnections, messageForChild } = this.state;
    lanPeersWebRtcConnections.map((connObj) => {
      connObj.peerDataChannel.send(messageForChild);
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
