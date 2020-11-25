import React from "react";

import { getMyIp } from "../utils/index";
// import { masterCreateWebRtcConObj } from "../utils/master/masterWebRtcUtils";
// import { childCreateWebRtcConObj } from "../utils/child/childWebrtcUtils";
import {
  setIdIfRequired,
  getMachineId,
  setNodeType,
  getNodeType,
} from "../utils/indexedDbUtils";
import { configureChannel } from "../socket";

const peerConfig = {
  iceServers: [
    {
      urls: ["stun:avm4962.com:3478", "stun:avm4962.com:5349"],
    },
    { urls: ["stun:ss-turn1.xirsys.com"] },
    {
      username: "TuR9Us3r",
      credential:
        "T!W779M?Vh#5ewJcT=L4v6NcUE*=4+-*fcy+gLAS$^WJgg+wq%?ca^Br@D%Q2MVpyV2sqTcHmUAdP2z4#=S8FAb*3LKGT%W^4R%h5Tdw%D*zvvdWTzSA@ytvEH!G#^99QmW3*5ps^jv@aLdNSfyYKBUS@CJ#hxSp5PRnzP+_YDcJHN&ng2Q_g6Z!+j_3RD%vc@P4g%tFuAuX_dz_+AQNe$$$%w7A4sW?CDr87ca^rjFBGV??JR$!tCSnZdAJa6P8",
      urls: [
        "turn:avm4962.com:3478?transport=tcp",
        "turn:avm4962.com:5349?transport=tcp",
      ],
    },
    {
      username:
        "ZyUlEkJOyQDmJFZ0nkKcAKmrrNayVm-rutt8RNHa1EQe_NQADY6Rk4sM2zVstYo_AAAAAF9xt7VhbGl2YXRlY2g=",
      credential: "820f7cf4-0173-11eb-ad8b-0242ac140004",
      urls: [
        "turn:ss-turn1.xirsys.com:80?transport=udp",
        "turn:ss-turn1.xirsys.com:3478?transport=udp",
        "turn:ss-turn1.xirsys.com:80?transport=tcp",
        "turn:ss-turn1.xirsys.com:3478?transport=tcp",
        "turns:ss-turn1.xirsys.com:443?transport=tcp",
        "turns:ss-turn1.xirsys.com:5349?transport=tcp",
      ],
    },
  ],
};

class Home extends React.Component {
  state = {
    ip: "",
    machineId: "",
    type: "",
    lanPeers: [],
    lanPeersWebRtcConnections: [],
    remoteMasterPeers: [],
    remoteMasterPeersWebRtcConnections: [],
    message: "",
    messagesFromMastersPeers: [],
    messagesFromLanMasterPeer: [],
    messagesFromChildsPeers: [],
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
      .receive("ok", async ({ remote_masters_peers, lan_peers, type }) => {
        // Receiving null here if request is from same browser
        if (!lan_peers) {
          channel.leave();
          alert("Already a connection is established in other tab");
          return;
        }
        if (remote_masters_peers) {
          this.setState({
            remoteMasterPeers: remote_masters_peers,
          });
        }
        await setNodeType(type);
        this.setState({ lanPeers: lan_peers, type }, () => {
          if (type === "MASTER") {
            componentThis.newNodeListener(channel);
            componentThis.newMasterNodeListener(channel);
            componentThis.removeNodeListener(channel);
            componentThis.removeMasterNodeListener(channel);
            componentThis.setupRemotePeerConnections(channel);
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

  setupRemotePeerConnections = async (channel) => {
    const { remoteMasterPeers } = this.state;
    let webRtcConArr = [];
    remoteMasterPeers.forEach(({ ip, machine_id, type }) => {
      const { peerConnection } = this.createConnectionForMaster(
        channel,
        ip,
        machine_id
      );
      webRtcConArr.push({ peerConnection, ip, machine_id, type });
    });
    this.setState({
      remoteMasterPeersWebRtcConnections: webRtcConArr,
    });
  };

  createConnectionForMaster = (channel, remoteNodeIp, remoteNodeId) => {
    const { ip } = this.state;
    const peerConnection = new RTCPeerConnection(peerConfig);
    channel.on(
      `web:receive_ice_from_master_peer_${ip}_${remoteNodeIp}`,
      async ({ candidate }) => {
        const parsedCandidate = JSON.parse(candidate);
        await peerConnection.addIceCandidate(
          new RTCIceCandidate(parsedCandidate)
        );
      }
    );

    channel.on(
      `web:receive_offer_${ip}_${remoteNodeIp}`,
      async ({ offer_for_peer_master, ip: peer_master_id }) => {
        const parsedMasterOffer = JSON.parse(offer_for_peer_master);

        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(parsedMasterOffer)
        );
        await peerConnection.createAnswer(
          async (answer) => {
            await peerConnection.setLocalDescription(answer);
            channel.push("web:send_answer_to_master_peer", {
              answer_for_master_peer: JSON.stringify(answer),
              ip: ip,
              remote_master_ip: peer_master_id,
            });
          },
          function (error) {
            alert("oops...error");
          }
        );
      }
    );

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        channel.push(`web:add_ice_candidate_from_master_peer`, {
          candidate: JSON.stringify(event.candidate),
          remote_master_ip: remoteNodeIp,
          ip,
        });
      }
    };

    peerConnection.ondatachannel = (event) => {
      const dataChannel = event.channel;
      dataChannel.onopen = (event) => {
        const { remoteMasterPeersWebRtcConnections } = this.state;
        const updatedPeersArr = remoteMasterPeersWebRtcConnections.map(
          (node) => {
            if (node.ip === remoteNodeIp) {
              node.peerDataChannel = dataChannel;
              node.peerConnection = peerConnection;
            }
            return node;
          }
        );

        this.setState({
          remoteMasterPeersWebRtcConnections: updatedPeersArr,
        });
      };
      dataChannel.onerror = function (error) {
        console.log("Error:", error);
      };

      dataChannel.onmessage = (event) => {
        const { messagesFromMastersPeers } = this.state;
        console.log("Got message:", event.data);
        const message = JSON.parse(event.data);
        this.setState({
          messagesFromMastersPeers: [
            ...messagesFromMastersPeers,
            { message: message.message },
          ],
        });
      };

      dataChannel.onerror = function (event) {
        console.log("Got message:", event.data);
      };
    };

    return { peerConnection };
  };

  createConnectionForNewMaster = (channel, remoteNodeIp, remoteNodeId) => {
    const { ip } = this.state;
    const peerConnection = new RTCPeerConnection(peerConfig);

    channel.on(
      `web:receive_ice_from_master_peer_${ip}_${remoteNodeId}`,
      async ({ candidate }) => {
        const parsedCandidate = JSON.parse(candidate);
        try {
          await peerConnection.addIceCandidate(
            new RTCIceCandidate(parsedCandidate)
          );
        } catch (error) {}
        console.log("Error In Adding Ice Candidate From Child");
      }
    );

    channel.on(
      `web:receive_answer_${ip}_${remoteNodeIp}`,
      async ({ answer_for_master_peer, ip: remote_master_ip }) => {
        const answerFromChild = JSON.parse(answer_for_master_peer);
        try {
          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(answerFromChild)
          );
        } catch (error) {
          console.log("Error In MASTER setRemoteDescription Answer");
        }
      }
    );

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        channel.push(`web:add_ice_candidate_from_master_peer`, {
          candidate: JSON.stringify(event.candidate),
          ip: ip,
          remote_master_ip: remoteNodeIp,
        });
      }
    };

    peerConnection.ondatachannel = function (event) {
      const dataChannel = event.channel;
      console.log("ondatachannel: ", dataChannel);
      dataChannel.onopen = function (event) {};
      dataChannel.onerror = function (error) {
        console.log("Error:", error);
      };

      dataChannel.onmessage = function (event) {
        console.log("Got message:", event.data);
      };
    };

    peerConnection.onnegotiationneeded = async () => {
      console.log(ip, "NEGOTIATION Needed");
      const offerForPeerMaster = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offerForPeerMaster);
      channel.push(`web:send_offer_to_peer_master`, {
        offer_for_peer_master: JSON.stringify(offerForPeerMaster),
        ip,
        remote_master_ip: remoteNodeIp,
      });
    };

    const dataChannel = this.createDataChannel(peerConnection);

    return {
      peerConnection,
      dataChannel,
    };
  };

  newMasterNodeListener = (channel) => {
    channel.on(
      `web:new_master_node_added`,
      async ({ type, ip, machine_id }) => {
        const {
          remoteMasterPeers,
          machineId,
          remoteMasterPeersWebRtcConnections,
        } = this.state;
        if (machineId !== machine_id) {
          const newMaster = { type, ip, machine_id };
          const {
            peerConnection,
            dataChannel,
          } = this.createConnectionForNewMaster(channel, ip, machine_id);
          const newMasterWebRtc = {
            peerConnection,
            peerDataChannel: dataChannel,
            ...newMaster,
          };
          const updatedPeersArr = [...remoteMasterPeers, newMaster];
          const updatedPeersWebRtcArr = [
            ...remoteMasterPeersWebRtcConnections,
            newMasterWebRtc,
          ];

          this.setState({
            remoteMasterPeers: updatedPeersArr,
            remoteMasterPeersWebRtcConnections: updatedPeersWebRtcArr,
          });
        }
      }
    );
  };

  removeMasterNodeListener = (channel) => {
    channel.on(`web:master_is_removed`, async ({ ip, machine_id }) => {
      const {
        remoteMasterPeers,
        remoteMasterPeersWebRtcConnections,
      } = this.state;
      const updatedPeersArr = remoteMasterPeers.filter(
        (node) => node.ip !== ip && node.machine_id !== machine_id
      );

      const updatedPeersWebRtcArr = remoteMasterPeersWebRtcConnections.filter(
        (node) => node.ip !== ip && node.machine_id !== machine_id
      );

      this.setState({
        remoteMasterPeers: updatedPeersArr,
        remoteMasterPeersWebRtcConnections: updatedPeersWebRtcArr,
      });
    });
  };
  childCreateWebRtcConObj = (channel, ip, masterId, childId) => {
    const peerConnection = new RTCPeerConnection(peerConfig);


    channel.on(
      `web:add_ice_candidate_to_child${childId}`,
      async ({ child_id, candidate }) => {
        const parsedCandidate = JSON.parse(candidate);
        await peerConnection.addIceCandidate(
          new RTCIceCandidate(parsedCandidate)
        );
      }
    );

    channel.on(
      `web:offer_from_master_${childId}`,
      async ({ offer_from_master, master_id, child_id }) => {
        const parsedMasterOffer = JSON.parse(offer_from_master);

        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(parsedMasterOffer)
        );
        await peerConnection.createAnswer(
          async (answer) => {
            await peerConnection.setLocalDescription(answer);
            channel.push("web:send_answer_to_master", {
              answer_for_master: JSON.stringify(answer),
              master_id,
              child_id,
              ip: ip,
            });
          },
          function (error) {
            alert("oops...error");
          }
        );
      }
    );

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        channel.push(`web:add_ice_candidate_from_child`, {
          candidate: JSON.stringify(event.candidate),
          child_id: childId,
          ip,
        });
      }
    };

    peerConnection.ondatachannel = (event) => {
      const dataChannel = event.channel;
      console.log("ondatachannel: ", dataChannel);
      dataChannel.onopen = (event) => {
        const masterConnObj = {
          peerConnection,
          machineId: masterId,
          type: "MASTER",
          peerDataChannel: dataChannel,
        };
        this.setState({
          lanPeersWebRtcConnections: [masterConnObj],
        });
      };
      dataChannel.onerror = function (error) {
        console.log("Error:", error);
      };

      dataChannel.onmessage = (event) => {
        const { messagesFromLanMasterPeer } = this.state;
        console.log("Got message:", event.data);
        this.setState({
          messagesFromLanMasterPeer: [
            ...messagesFromLanMasterPeer,
            {
              message: event.data,
            },
          ],
        });
      };

      dataChannel.onerror = function (event) {
        console.log("Got message:", event.data);
      };
    };
    return { peerConnection };
  };

  setupLanPeerConnectionChild = async (channel) => {
    const { ip, machineId, lanPeers, type } = this.state;
    const masterNode = lanPeers[lanPeers.length - 1];
    // Here we will create the connection for child to connect to master
    const { peerConnection } = this.childCreateWebRtcConObj(
      channel,
      ip,
      masterNode.machine_id,
      machineId
    );
  };

  updateMasterInChild = (channel) => {
    const { ip } = this.state;
    channel.on(`web:update_master_in_child${ip}`, (data) => {
      const { machineId } = this.state;

      const updatedPeers = [
        { machine_id: data.machine_id, ip: data.ip, type: "MASTER" },
      ];
      // Here we will create the connection for child to connect to master
      const { peerConnection } = this.childCreateWebRtcConObj(
        channel,
        ip,
        data.machine_id,
        machineId
      );

      this.setState({
        lanPeers: updatedPeers,
      });
    });
  };

  makeThisNodeMaster = (channel) => {
    const { machineId } = this.state;
    channel.on(
      `web:make_me_master_${machineId}`,
      async ({ ip, lan_peers, remote_masters_peers }) => {
        this.setState({
          lanPeers: lan_peers,
          type: "MASTER",
        });
        const updatedRemotePeers = remote_masters_peers.filter(
          (node) => node.ip !== ip
        );
        this.setState({
          remoteMasterPeers: updatedRemotePeers,
        });
        this.setupRemotePeerConnections(channel);
        this.newNodeListener(channel);
        this.removeNodeListener(channel);
        this.updateChildWebRtcArr(channel);
        await setNodeType("MASTER");
      }
    );
  };

  updateChildWebRtcArr = (channel) => {
    const { lanPeers } = this.state;
    this.setState({
      lanPeersWebRtcConnections: [],
    });
    lanPeers.map((peerObj) => {
      this.handleNewChildPeerConnectionCreation(peerObj, channel);
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
    const {
      peerConnection,
      dataChannel: peerDataChannel,
    } = this.masterCreateWebRtcConObj(channel, ip, machineId, childId);
    const connObj = {
      ip,
      machineId: childId,
      type,
      peerConnection,
      peerDataChannel,
    };
    const updatedPeers = [...lanPeersWebRtcConnections, connObj];
    this.setState({
      lanPeersWebRtcConnections: updatedPeers,
    });
  };

  masterCreateWebRtcConObj = (channel, ip, masterId, childId) => {
    const peerConnection = new RTCPeerConnection(peerConfig);

    channel.on(
      `web:add_ice_candidate_to_master${ip}`,
      async ({ child_id, candidate }) => {
        const parsedCandidate = JSON.parse(candidate);
        try {
          await peerConnection.addIceCandidate(
            new RTCIceCandidate(parsedCandidate)
          );
        } catch (error) {
          console.log("Error In Adding Ice Candidate From Child");
        }
      }
    );

    channel.on(
      `web:answer_from_child_${ip}`,
      async ({ master_id, answer_for_master, child_id }) => {
        const answerFromChild = JSON.parse(answer_for_master);
        try {
          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(answerFromChild)
          );
        } catch (error) {
          console.log("Error In MASTER setRemoteDescription Answer");
        }
      }
    );

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        channel.push(`web:add_ice_candidate_from_master`, {
          candidate: JSON.stringify(event.candidate),
          child_id: childId,
        });
      }
    };

    peerConnection.ondatachannel = function (event) {
      const dataChannel = event.channel;
      console.log("ondatachannel: ", dataChannel);
      dataChannel.onopen = function (event) {
        console.log("Master Data Channel Is Open");
      };
      dataChannel.onerror = function (error) {
        console.log("Error:", error);
      };

      dataChannel.onmessage = (event) => {
        const { messagesFromChildsPeers } = this.state;
        console.log("Got message:", event.data);
        this.setState({
          messagesFromChildsPeers: [
            ...messagesFromChildsPeers,
            { message: event.data },
          ],
        });
      };
    };

    peerConnection.onnegotiationneeded = async () => {
      console.log("NEGOTIATION MASTER");
      const offerForChild = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offerForChild);
      channel.push(`web:send_offer_to_child`, {
        child_id: childId,
        offer_for_child: JSON.stringify(offerForChild),
        master_id: masterId,
        ip,
      });
    };

    const dataChannel = this.createDataChannel(peerConnection);

    return {
      peerConnection,
      dataChannel,
    };
  };

  createDataChannel = (peerConnection) => {
    const dataChannel = peerConnection.createDataChannel("MyDataChannel", {
      ordered: false,
      maxRetransmits: 0,
    });
    dataChannel.onopen = function () {
      console.log("Data Channel is open");
    };
    dataChannel.onerror = function (error) {
      console.log("Error:", error);
    };

    dataChannel.onmessage = (event) => {
      const { messagesFromChildsPeers, messagesFromMastersPeers } = this.state;
      console.log("Got message:", event.data);
      try {
        const message = JSON.parse(event.data);
        this.setState({
          messagesFromMastersPeers: [
            ...messagesFromMastersPeers,
            { message: message.message },
          ],
        });
      } catch (error) {
        this.setState({
          messagesFromChildsPeers: [
            ...messagesFromChildsPeers,
            { message: event.data },
          ],
        });
      }
    };
    return dataChannel;
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

  handleMessage = (event) => {
    this.setState({
      message: event.target.value,
    });
  };

  handleMessageToChilds = () => {
    const { lanPeersWebRtcConnections, message } = this.state;
    lanPeersWebRtcConnections.map(({ peerDataChannel }) => {
      peerDataChannel.send(message);
    });
  };

  handleMessageToMasters = () => {
    const { remoteMasterPeersWebRtcConnections, message } = this.state;
    remoteMasterPeersWebRtcConnections.map(({ peerDataChannel }) => {
      peerDataChannel.send(JSON.stringify({ message, type: "MASTER" }));
    });
  };

  handleMessageToLanMaster = () => {
    const { lanPeersWebRtcConnections, message } = this.state;
    lanPeersWebRtcConnections.map(({ peerDataChannel }) => {
      peerDataChannel.send(message);
    });
  };
  render() {
    const {
      ip,
      type,
      lanPeers,
      remoteMasterPeers,
      machineId,
      messagesFromMastersPeers,
      messagesFromLanMasterPeer,
      messagesFromChildsPeers,
    } = this.state;
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
              onChange={this.handleMessage}
              placeholder="Send message to child"
            />
            <button onClick={this.handleMessageToChilds}>Send To Child</button>
            <button onClick={this.handleMessageToMasters}>
              Send To Masters
            </button>
            <hr />
            <h1>Masters Peers</h1>
            {remoteMasterPeers.map(({ ip, type, machine_id }, i) => (
              <h2 key={i}>
                {ip} - {type} - {machine_id}
              </h2>
            ))}
            <h1>Message From Other Masters Peers</h1>
            {messagesFromMastersPeers.map(({ message }, i) => (
              <h2 key={i}>{message}</h2>
            ))}
            <hr />
            <h1>Message From Child Peers</h1>
            {messagesFromChildsPeers.map(({ message }, i) => (
              <h2 key={i}>{message}</h2>
            ))}
          </div>
        )}

        <h1>Lan Peers</h1>
        {lanPeers.map(({ ip, type, machine_id }, i) => (
          <h2 key={i}>
            {ip} - {type} - {machine_id}
          </h2>
        ))}

        {type === "CHILD" && (
          <div>
            <input
              type="text"
              onChange={this.handleMessage}
              placeholder="Send message to master"
            />
            <button onClick={this.handleMessageToLanMaster}>
              Send To Master
            </button>
            <h1>Message From Master</h1>
            {messagesFromLanMasterPeer.map(({ message }, i) => (
              <h2 key={i}>{message}</h2>
            ))}
          </div>
        )}
      </div>
    );
  }
}

export default Home;
