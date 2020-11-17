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
    const masterNode = lanPeers[lanPeers.length - 1];
    // Here we will create the connection for child to connect to master
    const {
      peerConnection,
    } = await this.createPeerConnectionForMasterFromChild(channel);
    console.log("masterNode: ", masterNode);
    const masterConnObj = {
      peerConnection,
      machineId: masterNode.machine_id,
      type: "MASTER",
    };
    this.setState({
      lanPeersWebRtcConnections: [masterConnObj],
    });
  };

  createOffer = async (peerConnection) => {
    return await peerConnection.createOffer();
  };

  createPeerConnectionForChildFromMaster = async (channel, childId) => {
    const { ip, machineId } = this.state;
    let offer, answer;
    const configuration = {
      iceServers: [{ urls: "stun:stun.l.test.com:19000" }],
    };

    const peerConnection = new RTCPeerConnection(configuration);

    // channel.on(
    //   `web:offer_from_child_${ip}`,
    //   async ({ child_id, offer_for_master, ip }) => {
    //     const parsedChildOffer = JSON.parse(offer_for_master);

    //     await peerConnection.setRemoteDescription(
    //       new RTCSessionDescription(parsedChildOffer)
    //     );
    //     console.log("child offer setRemote");
    //     const answerForChild = await peerConnection.createAnswer();
    //     console.log("answerForChild created");
    //     await peerConnection.setLocalDescription(answerForChild);
    //     console.log("answerForChild setLocal");
    //     channel.push(`web:send_answer_to_child`, {
    //       answer_for_child: JSON.stringify(answerForChild),
    //       master_id: machineId,
    //       child_id: child_id,
    //     });
    //   }
    // );

    channel.on(
      `web:add_ice_candidate_to_master${ip}`,
      async ({ child_id, candidate }) => {
        await peerConnection.addIceCandidate(
          new RTCIceCandidate(JSON.parse(candidate))
        );
        console.log("MASTER Ice Candidate Added From Child");
      }
    );

    channel.on(
      `web:answer_from_child_${ip}`,
      async ({ master_id, answer_for_master, child_id }) => {
        const answerFromChild = JSON.parse(answer_for_master);
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(answerFromChild)
        );
        console.log("MASTER setRemoteDescription Answer: ");
      }
    );

    peerConnection.onicecandidate = (event) => {
      console.log("MASTER IceEvent");
      if (event.candidate) {
        console.log("MASTER Ice Candidate Send To Child");
        channel.push(`web:add_ice_candidate_from_master`, {
          candidate: JSON.stringify(event.candidate),
          child_id: childId,
        });
      }
    };

    peerConnection.onnegotiationneeded = async () => {
      console.log("NEGOTIATION MASTER");
      const offerForChild = await peerConnection.createOffer();
      console.log("MASTER createOffer: ");
      await peerConnection.setLocalDescription(offerForChild);
      console.log("MASTER setLocalDescription Offer");
      channel.push(`web:send_offer_to_child`, {
        child_id: childId,
        offer_for_child: JSON.stringify(offerForChild),
        master_id: machineId,
        ip,
      });
      console.log("MASTER Send Offer");
    };

    peerConnection.ondatachannel = function (event) {
      const dataChannel = event.channel;
      console.log("ondatachannel: ", dataChannel);
      dataChannel.onopen = function (event) {
        dataChannel.send("Hello from amir again");
      };
      dataChannel.onerror = function (error) {
        console.log("Error:", error);
      };

      dataChannel.onmessage = function (event) {
        console.log("Got message:", event.data);
      };
    };
    document
      .querySelector("#dataChannelMaster")
      .addEventListener("click", () => {
        const dataChannel = this.createDataChannel(peerConnection);
        console.log("MASTER DataChannel Created", dataChannel);
      });
    document
      .querySelector("#sendOfferMaster")
      .addEventListener("click", async () => {
        const offerForChild = await peerConnection.createOffer();
        console.log("MASTER createOffer: ");
        await peerConnection.setLocalDescription(offerForChild);
        console.log("MASTER setLocalDescription Offer");
        channel.push(`web:send_offer_to_child`, {
          child_id: childId,
          offer_for_child: JSON.stringify(offerForChild),
          master_id: machineId,
          ip,
        });
      });

    const offerForChild = await peerConnection.createOffer();
    console.log("MASTER createOffer: ");
    await peerConnection.setLocalDescription(offerForChild);
    console.log("MASTER setLocalDescription Offer");
    channel.push(`web:send_offer_to_child`, {
      child_id: childId,
      offer_for_child: JSON.stringify(offerForChild),
      master_id: machineId,
      ip,
    });
    console.log("MASTER Send Offer");

    document.querySelector("#stateMaster").addEventListener("click", () => {
      console.log("MASTER peerconnection", peerConnection);
    });

    return {
      peerConnection,
      // peerDataChannel,
    };
  };

  createDataChannel = (peerConnection) => {
    const dataChannel = peerConnection.createDataChannel("MyDataChannel");
    dataChannel.onopen = function () {
      console.log("Data Channel is open");
      dataChannel.send("Hello from amir");
    };
    dataChannel.onerror = function (error) {
      console.log("Error:", error);
    };

    dataChannel.onmessage = function (event) {
      console.log("Got message:", event.data);
    };
    return dataChannel;
  };

  createPeerConnectionForMasterFromChild = async (channel) => {
    const { machineId, ip } = this.state;
    const configuration = {
      iceServers: [{ urls: "stun:stun.l.test.com:19000" }],
    };

    const peerConnection = new RTCPeerConnection(configuration);

    channel.on(
      `web:add_ice_candidate_to_child${machineId}`,
      async ({ child_id, candidate }) => {
        await peerConnection.addIceCandidate(
          new RTCIceCandidate(JSON.parse(candidate))
        );
        console.log("CHILD Added Ice Candidate From Master");
      }
    );

    // channel.on(
    //   `web:answer_from_master_${machineId}`,
    //   async ({ master_id, answer_for_child, child_id }) => {
    //     const answerFromMaster = JSON.parse(answer_for_child);
    //     await peerConnection.setRemoteDescription(
    //       new RTCSessionDescription(answerFromMaster)
    //     );
    //     console.log("After Answer Set Remote CHILD: ", peerConnection);
    //   }
    // );

    channel.on(
      `web:offer_from_master_${machineId}`,
      async ({ offer_from_master, master_id, child_id }) => {
        const parsedMasterOffer = JSON.parse(offer_from_master);

        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(parsedMasterOffer)
        );
        console.log("CHILD setRemoteDescription offer");
        const answerForMaster = await peerConnection.createAnswer();
        console.log("CHILD createAnswer");
        await peerConnection.setLocalDescription(answerForMaster);
        console.log("CHILD setLocalDescription Answer");
        channel.push(`web:send_answer_to_master`, {
          answer_for_master: JSON.stringify(answerForMaster),
          master_id,
          child_id,
          ip: ip,
        });
        console.log("CHILD Send Answer");
      }
    );

    peerConnection.onnegotiationneeded = async () => {
      console.log("onnegotiationneeded CHILD");
      // const offerForMaster = await peerConnection.createOffer();
      // await peerConnection.setLocalDescription(offerForMaster);
      // channel.push(`web:send_offer_to_master`, {
      //   child_id: childId,
      //   offer_for_child: JSON.stringify(offerForMaster),
      //   ip,
      // });
    };

    peerConnection.onicecandidate = (event) => {
      console.log("CHILD IceEvent");
      if (event.candidate) {
        console.log("CHILD Send Candidate To Master");
        channel.push(`web:add_ice_candidate_from_child`, {
          candidate: JSON.stringify(event.candidate),
          child_id: machineId,
          ip,
        });
      }
    };

    peerConnection.ondatachannel = function (event) {
      const dataChannel = event.channel;
      console.log("ondatachannel: ", dataChannel);
      dataChannel.onopen = function (event) {
        dataChannel.send("Hello from amir again");
      };
      dataChannel.onerror = function (error) {
        console.log("Error:", error);
      };

      dataChannel.onmessage = function (event) {
        console.log("Got message:", event.data);
      };

      dataChannel.onerror = function (event) {
        console.log("Got message:", event.data);
      };
    };

    document
      .querySelector("#dataChannelChild")
      .addEventListener("click", () => {
        const dataChannel = this.createDataChannel(peerConnection);
        console.log("CHILD Datachannel Created", dataChannel);
      });

    document.querySelector("#stateChild").addEventListener("click", () => {
      console.log("CHILD peerconnection", peerConnection);
    });

    return { peerConnection };
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
    // const {
    //   lanPeersWebRtcConnections,
    //   machineId,
    //   type: currentType,
    // } = this.state;
    // const {
    //   peerConnection,
    // peerDataChannel,
    // } =
    await this.createPeerConnectionForChildFromMaster(channel, childId);
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
