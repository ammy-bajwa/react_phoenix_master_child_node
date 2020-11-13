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
            componentThis.listenForIceCandidateMaster(channel);
          } else {
            componentThis.setupLanPeerConnectionChild(channel);
            componentThis.listenForIceCandidateChild(channel);
            componentThis.listenOfferFromMaster(channel);
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

  listenForIceCandidateMaster = (channel) => {
    const { ip } = this.state;
    channel.on(
      `web:add_ice_candidate_to_master${ip}`,
      async ({ child_id, candidate }) => {
        const { lanPeersWebRtcConnections } = this.state;
        console.log("add_ice_candidate_to_master: ", lanPeersWebRtcConnections);
        let updatedArr = lanPeersWebRtcConnections.map(async (connObj) => {
          if (connObj.machineId === child_id) {
            await connObj.peerConnection.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
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
  listenForIceCandidateChild = (channel) => {
    const { machineId } = this.state;
    channel.on(
      `web:add_ice_candidate_to_child${machineId}`,
      async ({ child_id: childId, candidate }) => {
        const { lanPeersWebRtcConnections } = this.state;
        console.log(
          "add_ice_candidate_to_child: lanPeersWebRtcConnections",
          lanPeersWebRtcConnections
        );
        let updatedArr = lanPeersWebRtcConnections.map(async (connObj) => {
          if (connObj.machineId === childId) {
            console.log("Ice agent added");
            await connObj.peerConnection.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          }
          return connObj;
        });
        updatedArr = await Promise.all(updatedArr);
        console.log("add_ice_candidate_to_child: updatedArr", updatedArr);
        this.setState({
          lanPeersWebRtcConnections: updatedArr,
        });
      }
    );
  };

  listenOfferFromMaster = (channel) => {
    const { machineId, ip } = this.state;
    channel.on(
      `web:offer_from_master_${machineId}`,
      async ({ offer_from_master, master_id, child_id }) => {
        console.log("offer_from_master_: ", offer_from_master);
        const { lanPeersWebRtcConnections } = this.state;
        let updatedArr = lanPeersWebRtcConnections.map(
          async ({ machineId, peerConnection, ...rem }) => {
            if (machineId === master_id) {
              if (!peerConnection.localDescription) {
                try {
                  await peerConnection.setRemoteDescription(
                    new RTCSessionDescription(offer_from_master)
                  );
                  console.log("master offer setRemote");
                  const answerForMaster = await peerConnection.createAnswer();
                  console.log("answerForMaster created");
                  await peerConnection.setLocalDescription(answerForMaster);
                  console.log("answerForMaster setLocal");
                  channel.push(`web:send_answer_to_master`, {
                    answer_for_master: answerForMaster,
                    master_id,
                    child_id,
                    ip: ip,
                  });
                } catch (error) {
                  console.error("listenOfferFromMaster: ", error);
                }
              }
            }
            return { machineId, peerConnection, ...rem };
          }
        );
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
        let updatedArr = lanPeersWebRtcConnections.map(
          async ({ machineId, peerConnection, ...rem }) => {
            if (machineId === master_id) {
              try {
                await peerConnection.setRemoteDescription(setRemoteDescription);
                console.log("setRemoteDescription: setRemoteDescription");
              } catch (error) {
                console.error("listenAnswerFromMaster: ", error);
              }
            }
            return { machineId, peerConnection, ...rem };
          }
        );
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
    const {
      peerConnection,
      peerDataChannel,
    } = await this.createPeerConnectionForMasterFromChild(channel);
    console.log("masterNode: ", masterNode);
    const masterConnObj = {
      peerConnection,
      machineId: masterNode.machine_id,
      type: "MASTER",
      peerDataChannel,
    };
    this.setState({
      lanPeersWebRtcConnections: [masterConnObj],
    });
  };

  createOffer = async (peerConnection) => {
    return await peerConnection.createOffer();
  };

  sendOfferToChild = (channel, offerForChild, childId) => {
    const { ip, machineId } = this.state;
    channel.push(`web:send_offer_to_child`, {
      child_id: childId,
      offer_for_child: offerForChild,
      master_id: machineId,
      ip,
    });
  };

  createAndSendOfferForChildFromMaster = async (
    channel,
    peerConnection,
    childId
  ) => {
    if (!peerConnection.localDescription) {
      const offerForChidl = await peerConnection.createOffer();
      peerConnection.setLocalDescription(offerForChidl);
      this.sendOfferToChild(channel, offerForChidl, childId);
    }
  };

  onDataChannelCreated = (event) => {
    const dataChannel = event.channel;
    console.log("Channel Successfull ondatachannel.......", dataChannel);
  };

  onNegotiationNeededHandler = async (channel, peerConnection, childId) => {
    await this.createAndSendOfferForChildFromMaster(
      channel,
      peerConnection,
      childId
    );
    // Get answer from child
    // set answer to remote
    console.log("onnegotiationneeded MASTER");
  };
  onIceCandidateHandlerMaster = (event, channel, childId) => {
    if (event.candidate) {
      console.log("add_ice_candidate_from_master--------");
      channel.push(`web:add_ice_candidate_from_master`, {
        candidate: event.candidate,
        child_id: childId,
      });
    }
  };
  createPeerConnectionForChildFromMaster = async (channel, childId) => {
    const configuration = {
      iceServers: [{ url: "stun:stun.12connect.com:3478" }],
    };

    const peerConnection = new webkitRTCPeerConnection(configuration);

    peerConnection.onicecandidate = (event) =>
      this.onIceCandidateHandlerMaster(event, channel, childId);

    peerConnection.onnegotiationneeded = () =>
      this.onNegotiationNeededHandler(channel, peerConnection, childId);

    peerConnection.ondatachannel = this.onDataChannelCreated;
    const dataChannelOptions = {
      reliable: true,
      RtpDataChannels: true,
    };
    const peerDataChannel = peerConnection.createDataChannel(
      "myDataChannel",
      dataChannelOptions
    );
    peerDataChannel.onopen = this.dataChannelOpenHandler;
    peerDataChannel.onerror = this.dataChannelErrorHandler;
    peerDataChannel.onmessage = this.dataChannelMessageHandler;

    return {
      peerConnection,
      peerDataChannel,
    };
  };

  sendOfferToMaster = (channel, offerForMaster) => {
    const { ip, machineId } = this.state;
    channel.push(`web:send_offer_to_master${ip}`, {
      child_id: machineId,
      offer_for_master: offerForMaster,
    });
  };
  dataChannelMessageHandler = (event) => {
    console.log("Got message:", event.data);
  };

  dataChannelErrorHandler = (error) => {
    console.log("Error:", error);
  };

  dataChannelOpenHandler = (event) => {
    console.log("myDataChannel is open", peerDataChannel);
    console.log("Ready........");
  };

  onIceCandidateHandlerChild = (event, channel) => {
    if (event.candidate) {
      const { machineId, ip } = this.state;
      channel.push(`web:add_ice_candidate_from_child`, {
        candidate: event.candidate,
        child_id: machineId,
        ip,
      });
    }
  };

  createPeerConnectionForMasterFromChild = async (channel) => {
    const componentThis = this;
    const configuration = {
      iceServers: [{ url: "stun:stun.12connect.com:3478" }],
    };

    const peerConnection = new webkitRTCPeerConnection(configuration);
    peerConnection.onnegotiationneeded = async () => {
      // const offerForMaster = await this.createOffer(peerConnection);
      // await peerConnection.setLocalDescription(offerForMaster);
      // Send Offer to master
      // componentThis.sendOfferToMaster(channel, offerForMaster);
      // Get answer from master
      // set answer to remote
      console.log("onnegotiationneeded CHILD");
    };

    peerConnection.onicecandidate = (event) =>
      this.onIceCandidateHandlerChild(event, channel);

    peerConnection.ondatachannel = this.onDataChannelCreated;
    const dataChannelOptions = {
      reliable: true,
      RtpDataChannels: true,
    };
    const peerDataChannel = peerConnection.createDataChannel(
      "myDataChannel",
      dataChannelOptions
    );
    peerDataChannel.onopen = this.dataChannelOpenHandler;
    peerDataChannel.onerror = this.dataChannelErrorHandler;
    peerDataChannel.onmessage = this.dataChannelMessageHandler;

    return { peerConnection, peerDataChannel };
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
    const {
      peerConnection,
      peerDataChannel,
    } = await this.createPeerConnectionForChildFromMaster(channel, machine_id);
    const connObj = {
      ip,
      machineId: machine_id,
      type,
      peerConnection,
      peerDataChannel,
    };
    let updatedPeers = [...lanPeersWebRtcConnections, connObj];
    updatedPeers = await Promise.all(updatedPeers);
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
        let updatedArr = lanPeersWebRtcConnections.map(
          async ({ machineId, peerConnection, ...rem }) => {
            if (machineId === child_id) {
              try {
                await peerConnection.setRemoteDescription(
                  new RTCSessionDescription(answer_for_master)
                );
                console.log("answer_for_master LAST");
              } catch (error) {
                console.error("listenForAnswerFromChild: ", error);
              }
            }
            return { machineId, peerConnection, ...rem };
          }
        );
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
      async ({ child_id, offer_for_master, ip }) => {
        const { lanPeersWebRtcConnections } = this.state;
        let updatedArr = lanPeersWebRtcConnections.map(
          async ({ machineId, peerConnection, ...rem }) => {
            if (machineId === child_id) {
              try {
                await peerConnection.setRemoteDescription(
                  new RTCSessionDescription(offer_for_master)
                );
                console.log("master offer setRemote");
                const answerForChild = await peerConnection.createAnswer();
                console.log("master answer created");
                await peerConnection.setLocalDescription(answerForChild);
                console.log("master answer setLocal");
                channel.push(`web:send_answer_to_child`, {
                  answer_for_child: answerForChild,
                  master_id,
                  child_id,
                });
              } catch (error) {
                console.error("listenForOfferFromChild: ", error);
              }
            }
            return { machineId, peerConnection, machineId, ...rem };
          }
        );
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
