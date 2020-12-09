import React from "react";

import { RenderLanPeers } from "./lanPeer";

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
    remoteMasterPeers: [],
    remoteMasterPeersWebRtcConnections: [],
    message: "",
    messagesFromMastersPeers: [],
    messageFromLanPeers: [],
    iceConfigs: [
      // 0
      { iceServers: [] },
      // 1
      {
        iceServers: [
          {
            urls: ["stun:avm4962.com:3478", "stun:avm4962.com:5349"],
          },
          { urls: ["stun:ss-turn1.xirsys.com"] },
        ],
      },
      //2
      {
        iceServers: [
          {
            username: "TuR9Us3r",
            credential:
              "T!W779M?Vh#5ewJcT=L4v6NcUE*=4+-*fcy+gLAS$^WJgg+wq%?ca^Br@D%Q2MVpyV2sqTcHmUAdP2z4#=S8FAb*3LKGT%W^4R%h5Tdw%D*zvvdWTzSA@ytvEH!G#^99QmW3*5ps^jv@aLdNSfyYKBUS@CJ#hxSp5PRnzP+_YDcJHN&ng2Q_g6Z!+j_3RD%vc@P4g%tFuAuX_dz_+AQNe$$$%w7A4sW?CDr87ca^rjFBGV??JR$!tCSnZdAJa6P8",
            urls: [
              "turn:avm4962.com:3478?transport=udp",
              "turn:avm4962.com:5349?transport=udp",
            ],
          },
        ],
      },
      //3
      {
        iceServers: [
          {
            username: "TuR9Us3r",
            credential:
              "T!W779M?Vh#5ewJcT=L4v6NcUE*=4+-*fcy+gLAS$^WJgg+wq%?ca^Br@D%Q2MVpyV2sqTcHmUAdP2z4#=S8FAb*3LKGT%W^4R%h5Tdw%D*zvvdWTzSA@ytvEH!G#^99QmW3*5ps^jv@aLdNSfyYKBUS@CJ#hxSp5PRnzP+_YDcJHN&ng2Q_g6Z!+j_3RD%vc@P4g%tFuAuX_dz_+AQNe$$$%w7A4sW?CDr87ca^rjFBGV??JR$!tCSnZdAJa6P8",
            urls: [
              "turn:avm4962.com:3478?transport=tcp",
              "turn:avm4962.com:5349?transport=tcp",
            ],
          },
        ],
      },
      // 4

      {
        iceServers: [
          {
            username: "TuR9Us3r",
            credential:
              "T!W779M?Vh#5ewJcT=L4v6NcUE*=4+-*fcy+gLAS$^WJgg+wq%?ca^Br@D%Q2MVpyV2sqTcHmUAdP2z4#=S8FAb*3LKGT%W^4R%h5Tdw%D*zvvdWTzSA@ytvEH!G#^99QmW3*5ps^jv@aLdNSfyYKBUS@CJ#hxSp5PRnzP+_YDcJHN&ng2Q_g6Z!+j_3RD%vc@P4g%tFuAuX_dz_+AQNe$$$%w7A4sW?CDr87ca^rjFBGV??JR$!tCSnZdAJa6P8",
            urls: ["turn:avm4962.com:3478", "turn:avm4962.com:5349"],
          },
        ],
      },
      // 5
      {
        iceServers: [
          {
            username: "TuR9Us3r",
            credential:
              "T!W779M?Vh#5ewJcT=L4v6NcUE*=4+-*fcy+gLAS$^WJgg+wq%?ca^Br@D%Q2MVpyV2sqTcHmUAdP2z4#=S8FAb*3LKGT%W^4R%h5Tdw%D*zvvdWTzSA@ytvEH!G#^99QmW3*5ps^jv@aLdNSfyYKBUS@CJ#hxSp5PRnzP+_YDcJHN&ng2Q_g6Z!+j_3RD%vc@P4g%tFuAuX_dz_+AQNe$$$%w7A4sW?CDr87ca^rjFBGV??JR$!tCSnZdAJa6P8",
            urls: [
              "turn:avm4962.com:3478?transport=udp",
              "turn:avm4962.com:5349?transport=tcp",
            ],
          },
        ],
      },
      // 6
      {
        iceServers: [
          {
            username:
              "ZyUlEkJOyQDmJFZ0nkKcAKmrrNayVm-rutt8RNHa1EQe_NQADY6Rk4sM2zVstYo_AAAAAF9xt7VhbGl2YXRlY2g=",
            credential: "820f7cf4-0173-11eb-ad8b-0242ac140004",
            urls: [
              "turn:ss-turn1.xirsys.com:80?transport=udp",
              "turn:ss-turn1.xirsys.com:3478?transport=udp",
            ],
          },
        ],
      },
      // 7
      {
        iceServers: [
          {
            username:
              "ZyUlEkJOyQDmJFZ0nkKcAKmrrNayVm-rutt8RNHa1EQe_NQADY6Rk4sM2zVstYo_AAAAAF9xt7VhbGl2YXRlY2g=",
            credential: "820f7cf4-0173-11eb-ad8b-0242ac140004",
            urls: [
              "turn:ss-turn1.xirsys.com:80?transport=tcp",
              "turn:ss-turn1.xirsys.com:3478?transport=tcp",
              "turns:ss-turn1.xirsys.com:443?transport=tcp",
              "turns:ss-turn1.xirsys.com:5349?transport=tcp",
            ],
          },
        ],
      },
      // 8
      {
        iceServers: [
          {
            urls: ["stun:avm4962.com:3478", "stun:avm4962.com:5349"],
          },
          {
            username: "TuR9Us3r",
            credential:
              "T!W779M?Vh#5ewJcT=L4v6NcUE*=4+-*fcy+gLAS$^WJgg+wq%?ca^Br@D%Q2MVpyV2sqTcHmUAdP2z4#=S8FAb*3LKGT%W^4R%h5Tdw%D*zvvdWTzSA@ytvEH!G#^99QmW3*5ps^jv@aLdNSfyYKBUS@CJ#hxSp5PRnzP+_YDcJHN&ng2Q_g6Z!+j_3RD%vc@P4g%tFuAuX_dz_+AQNe$$$%w7A4sW?CDr87ca^rjFBGV??JR$!tCSnZdAJa6P8",
            urls: [
              "turn:avm4962.com:3478?transport=udp",
              "turn:avm4962.com:5349?transport=tcp",
            ],
          },
        ],
      },
      // 9
      {
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
              "turn:avm4962.com:3478?transport=udp",
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
      },
    ],
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
        console.log(
          "remote_masters_peers on before filter: ",
          remote_masters_peers
        );
        if (remote_masters_peers) {
          const updatedRemoteMasterPeers = remote_masters_peers.filter(
            (node) => node !== null
          );
          console.log(
            "remote_masters_peers on creation: ",
            updatedRemoteMasterPeers
          );
          this.setState({
            remoteMasterPeers: updatedRemoteMasterPeers,
          });
        }
        await setNodeType(type);
        this.setState({ lanPeers: lan_peers, type }, () => {
          if (type === "MASTER") {
            componentThis.newMasterNodeListener(channel);
            componentThis.newNodeListener(channel);
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
      const { peerConnection } = this.remotePeerConnectionForMaster(
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

  remotePeerConnectionForMaster = async (
    channel,
    remoteNodeIp,
    remoteNodeId
  ) => {
    const { ip } = this.state;
    let iceConfigsControlCounter = 1;
    let verifyMessage = false;
    let dataChannel = null;
    let peerConnection = await this.peerConnectionCreatorMasterPeers(
      channel,
      remoteNodeIp,
      remoteNodeId,
      iceConfigsControlCounter
    );

    const updateConnectionType = () => {
      let iceServerType = "Nothing";
      switch (iceConfigsControlCounter) {
        case 0:
          iceServerType = "0-Null_ICE_SERVER";
          break;
        case 1:
          iceServerType = "1-ALL_STUN";
          break;
        case 2:
          iceServerType = "2-AVM_TURN_UDP_3478_5349";
          break;
        case 3:
          iceServerType = "3-AVM_TURN_TCP_3478_5349";
          break;
        case 4:
          iceServerType = "4-AVM_TURN_3478_5349";
          break;
        case 5:
          iceServerType = "5-AVM_TURN_:3478_UDP:5349_TCP";
          break;
        case 6:
          iceServerType = "6-XIRSYS_TURN_UDP_80_3478";
          break;
        case 7:
          iceServerType = "7-XIRSYS_TURN_TCP_80_3478_443_5349";
          break;
        case 8:
          iceServerType = "8-AVM_STUN_TURN";
          break;
        case 9:
          iceServerType = "9AVM_XIRSYS_STUN_TURN";
          break;
        default:
          iceServerType = "None";
          break;
      }
      const { remoteMasterPeers } = this.state;
      const updatedArr = remoteMasterPeers.map((node) => {
        if (node.machine_id === remoteNodeId) {
          node.connectionType = iceServerType;
        }
        return node;
      });

      this.setState({
        remoteMasterPeers: updatedArr,
      });
    };

    channel.on(
      `web:verify_message_${ip}_${remoteNodeIp}`,
      ({ ip, remote_master_ip }) => {
        console.log("Verification reques received");
        const { messagesFromMastersPeers } = this.state;
        messagesFromMastersPeers.forEach(({ message }) => {
          if (message === "1") {
            verifyMessage = true;
            dataChannel.send("1");
            updateConnectionType();
          }
        });
        console.log("verifyMessage: ", verifyMessage);
        if (verifyMessage) {
          channel.push("web:verification_received", {
            ip,
            remote_master_ip: remoteNodeIp,
          });
        }
      }
    );

    channel.on(
      `web:update_my_peer_connection_${ip}_${remoteNodeIp}`,
      async ({ counter }) => {
        console.log("Updated peerconnection: ", counter);
        peerConnection = await this.peerConnectionCreatorMasterPeers(
          channel,
          remoteNodeIp,
          remoteNodeId,
          counter
        );
        iceConfigsControlCounter = counter;
      }
    );

    channel.on(
      `web:try_to_connect_to_master_${ip}_${remoteNodeIp}`,
      async ({ remote_node_ip, ice_config_control_counter }) => {
        console.log("NEW MASTER request to connect");
        console.log("STEP TWO");
        const offerForPeerMaster = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offerForPeerMaster);
        channel.push(`web:send_offer_to_peer_master`, {
          offer_for_peer_master: JSON.stringify(offerForPeerMaster),
          ip: ip,
          remote_master_ip: remoteNodeIp,
        });
        console.log("MASTER SEND OFFER");
        dataChannel = this.createDataChannelForMasterPeer(
          peerConnection,
          remoteNodeId
        );
      }
    );
    channel.on(
      `web:receive_ice_from_master_peer_${ip}_${remoteNodeIp}`,
      async ({ candidate, ip: currentMachineIp, remote_master_ip }) => {
        if (currentMachineIp === ip) {
          const parsedCandidate = JSON.parse(candidate);
          await peerConnection.addIceCandidate(
            new RTCIceCandidate(parsedCandidate)
          );
          console.log(
            "candidate is received from: ",
            remote_master_ip,
            parsedCandidate
          );
        } else {
          console.log(
            "NEW MASTER UNKNOWN Candidate remote current: ",
            currentMachineIp,
            remote_master_ip
          );
        }
      }
    );
    channel.on(
      `web:receive_answer_${ip}_${remoteNodeIp}`,
      async ({ answer_for_master_peer, ip: remote_master_ip }) => {
        const answerFromChild = JSON.parse(answer_for_master_peer);
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(answerFromChild)
        );
        console.log("New MASTER Receives and set Answer from: ", remoteNodeIp);
      }
    );
    channel.on(
      `web:receive_offer_${ip}_${remoteNodeIp}`,
      async ({ offer_for_peer_master, ip: peer_master_id }) => {
        const parsedMasterOffer = JSON.parse(offer_for_peer_master);
        console.log("NEW MASTER Received Offer : ", remoteNodeIp);
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
            console.log("NEW MASTER Set Offer And Send Answer: ", remoteNodeIp);
          },
          function (error) {
            alert("oops...error");
          }
        );
      }
    );
    return { peerConnection };
  };

  createDataChannelForMasterPeer = (peerConnection, remoteNodeId) => {
    const dataChannel = peerConnection.createDataChannel("MyDataChannel");
    dataChannel.onopen = async () => {
      console.log("Data Channel is open on 548");
      try {
        await dataChannel.send(
          JSON.stringify({ type: "MASTER", message: "1" })
        );
      } catch (error) {
        console.log("Error in sending message 553: ", error);
      }
      const { remoteMasterPeersWebRtcConnections } = this.state;
      const updatedArr = remoteMasterPeersWebRtcConnections.map((node) => {
        if (node.machine_id === remoteNodeId) {
          console.log("OLD MASTER Updating datachannel on 559");
          node.peerDataChannel = dataChannel;
        }
        return node;
      });
      this.setState({
        remoteMasterPeersWebRtcConnections: updatedArr,
      });
    };
    dataChannel.onerror = function (error) {
      console.log("Error: ", error, " 569");
    };

    dataChannel.onmessage = (event) => {
      const { messagesFromMastersPeers } = this.state;
      console.log("Got message:", event.data);
      try {
        const parsedMessage = JSON.parse(event.data);
        this.setState({
          messagesFromMastersPeers: [
            ...messagesFromMastersPeers,
            { message: parsedMessage.message },
          ],
        });
      } catch (error) {
        this.setState({
          messagesFromMastersPeers: [
            ...messagesFromMastersPeers,
            { message: event.data },
          ],
        });
      }
    };
    return dataChannel;
  };

  onDataChannelForMasterPeer = (event, remoteNodeId) => {
    const dataChannel = event.channel;
    dataChannel.onopen = async (event) => {
      console.log("Datachannel is open on 589");
      try {
        await dataChannel.send(
          JSON.stringify({ type: "MASTER", message: "1" })
        );
      } catch (error) {
        console.log("Error in sending message 595: ", error);
      }
      const { remoteMasterPeersWebRtcConnections } = this.state;
      const updatedArr = remoteMasterPeersWebRtcConnections.map((node) => {
        if (node.machine_id === remoteNodeId) {
          console.log("OLD MASTER Updating datachannel on 600");
          node.peerDataChannel = dataChannel;
        }
        return node;
      });
      this.setState({
        remoteMasterPeersWebRtcConnections: updatedArr,
      });
    };
    dataChannel.onerror = (error) => {
      console.log("Error:", error, " 611");
    };

    dataChannel.onmessage = (event) => {
      const { messagesFromMastersPeers } = this.state;
      console.log("Got message:", event.data);
      try {
        const parsedMessage = JSON.parse(event.data);
        this.setState({
          messagesFromMastersPeers: [
            ...messagesFromMastersPeers,
            { message: parsedMessage.message },
          ],
        });
      } catch (error) {
        this.setState({
          messagesFromMastersPeers: [
            ...messagesFromMastersPeers,
            { message: event.data },
          ],
        });
      }
    };
    return dataChannel;
  };

  peerConnectionCreatorMasterPeers = async (
    channel,
    remoteNodeIp,
    remoteNodeId,
    iceConfigsControlCounter
  ) => {
    const { iceConfigs, ip } = this.state;
    const peerConnection = new RTCPeerConnection(
      iceConfigs[iceConfigsControlCounter]
    );
    peerConnection.onnegotiationneeded = async () => {
      console.log("NEGOTIATION MASTER");
      const offerForPeerMaster = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offerForPeerMaster);
      channel.push(`web:send_offer_to_peer_master`, {
        offer_for_peer_master: JSON.stringify(offerForPeerMaster),
        ip: ip,
        remote_master_ip: remoteNodeIp,
      });
      console.log("MASTER SEND OFFER");
    };
    peerConnection.ondatachannel = async (event) => {
      console.log("Event: ", event.channel);
      const dataChannel = await this.onDataChannelForMasterPeer(
        event,
        remoteNodeId
      );
    };
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("candidate send to: ", remoteNodeIp);
        channel.push(`web:add_ice_candidate_from_master_peer`, {
          candidate: JSON.stringify(event.candidate),
          remote_master_ip: remoteNodeIp,
          remote_master_id: remoteNodeId,
          ip: ip,
        });
      }
    };

    return peerConnection;
  };

  createConnectionForNewMaster = async (
    channel,
    remoteNodeIp,
    remoteNodeId
  ) => {
    const { iceConfigs, ip } = this.state;
    let iceConfigsControlCounter = 1;
    let connection = false;
    let dataChannel = null;
    let isOther = true;
    let peerConnection = await this.peerConnectionCreatorMasterPeers(
      channel,
      remoteNodeIp,
      remoteNodeId,
      iceConfigsControlCounter
    );
    dataChannel = this.createDataChannelForMasterPeer(
      peerConnection,
      remoteNodeId
    );
    const updateConnectionType = () => {
      let iceServerType = "Nothing";
      switch (iceConfigsControlCounter) {
        case 0:
          iceServerType = "0-Null_ICE_SERVER";
          break;
        case 1:
          iceServerType = "1-ALL_STUN";
          break;
        case 2:
          iceServerType = "2-AVM_TURN_UDP_3478_5349";
          break;
        case 3:
          iceServerType = "3-AVM_TURN_TCP_3478_5349";
          break;
        case 4:
          iceServerType = "4-AVM_TURN_3478_5349";
          break;
        case 5:
          iceServerType = "5-AVM_TURN_:3478_UDP:5349_TCP";
          break;
        case 6:
          iceServerType = "6-XIRSYS_TURN_UDP_80_3478";
          break;
        case 7:
          iceServerType = "7-XIRSYS_TURN_TCP_80_3478_443_5349";
          break;
        case 8:
          iceServerType = "8-AVM_STUN_TURN";
          break;
        case 9:
          iceServerType = "9AVM_XIRSYS_STUN_TURN";
          break;
        default:
          iceServerType = "None";
          break;
      }
      const { remoteMasterPeers } = this.state;
      const updatedArr = remoteMasterPeers.map((node) => {
        if (node.machine_id === remoteNodeId) {
          node.connectionType = iceServerType;
        }
        return node;
      });

      this.setState({
        remoteMasterPeers: updatedArr,
      });
    };
    const connectionRetry = setInterval(async () => {
      console.log("peerConnection", peerConnection);
      console.log("connection state", peerConnection.connectionState);
      console.log("Data channel state", dataChannel.readyState);
      if (dataChannel.readyState !== "open") {
        if (iceConfigsControlCounter >= iceConfigs.length) {
          console.log("ALL Have Been Tried");
          clearInterval(connectionRetry);
          return;
        }
        if (isOther) {
          channel.push(`web:try_to_connect_again_remote_master`, {
            ip: ip,
            remote_node_ip: remoteNodeIp,
            ice_config_control_counter: iceConfigsControlCounter,
          });
          isOther = false;
          console.log("OLD MASTER SEND TRY REQUEST");
          console.log(
            "Old MASTER iceConfigsControlCounter: ",
            iceConfigsControlCounter
          );
          return;
        } else {
          iceConfigsControlCounter = iceConfigsControlCounter + 1;
          channel.push(`web:updated_peer_connection`, {
            iceConfigsControlCounter,
            receiver: remoteNodeIp,
            sender: ip,
          });
          peerConnection = await this.peerConnectionCreatorMasterPeers(
            channel,
            remoteNodeIp,
            remoteNodeId,
            iceConfigsControlCounter
          );
          dataChannel = this.createDataChannelForMasterPeer(
            peerConnection,
            remoteNodeId
          );
          console.log("OLD MASTER CREATE DATA CHANNEL");
          console.log(
            "Old MASTER iceConfigsControlCounter: ",
            iceConfigsControlCounter
          );
          isOther = true;
        }
      } else {
        // verify channel via message
        setTimeout(() => {
          channel.push("web:verify_message", {
            ip,
            remote_master_ip: remoteNodeIp,
          });
          setTimeout(() => {
            if (connection) {
              console.log("Retry removed");
              clearInterval(connectionRetry);
              updateConnectionType();
            } else {
              console.log("message verification failed");
              peerConnection.close();
            }
          }, 500);
        }, 500);
      }
    }, 5000);

    channel.on(`web:master_is_removed`, async ({ ip, machine_id }) => {
      if (machine_id === remoteNodeId) {
        console.log("Clearing interval");
        clearInterval(connectionRetry);
        iceConfigsControlCounter = 0;
        peerConnection = await this.peerConnectionCreatorMasterPeers(
          channel,
          remoteNodeIp,
          remoteNodeId,
          iceConfigsControlCounter
        );
        channel.push(`web:updated_peer_connection`, {
          iceConfigsControlCounter,
          receiver: remoteNodeIp,
          sender: ip,
        });
      }
    });

    channel.on(
      `web:verification_received_from_other_master_peer_${ip}`,
      ({ ip: currentIp, remote_master_ip }) => {
        const { messagesFromMastersPeers } = this.state;
        console.log("messagesFromMastersPeers: ", messagesFromMastersPeers);
        messagesFromMastersPeers.map(({ message }) => {
          if (message === "1") {
            console.log("Verified------------");
            connection = true;
          }
        });
      }
    );
    channel.on(
      `web:receive_ice_from_master_peer_${ip}_${remoteNodeId}`,
      async ({ candidate, ip: currentMachineIp, remote_master_ip }) => {
        if (currentMachineIp === ip) {
          const parsedCandidate = JSON.parse(candidate);
          try {
            await peerConnection.addIceCandidate(
              new RTCIceCandidate(parsedCandidate)
            );
            console.log(
              "candidate is received from: ",
              remote_master_ip,
              parsedCandidate
            );
          } catch (error) {
            console.log("Error In Adding Ice Candidate From Child");
          }
        } else {
          console.log(
            "OLD MASTER UNKNOWN Candidate remote current: ",
            currentMachineIp,
            remoteNodeIp
          );
        }
      }
    );
    channel.on(
      `web:receive_offer_${ip}_${remoteNodeIp}`,
      async ({ offer_for_peer_master, ip: peer_master_id }) => {
        const parsedMasterOffer = JSON.parse(offer_for_peer_master);
        console.log(
          "OLD MASTER Received Offer from NEW MASTER : ",
          remoteNodeIp
        );
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
            console.log(
              "OLD MASTER Set Offer Send Answer To NEW MASTER: ",
              remoteNodeIp
            );
          },
          function (error) {
            alert("oops...error");
          }
        );
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
          console.log("Answer is received from: ", remoteNodeIp);
        } catch (error) {
          console.log("Error In MASTER setRemoteDescription Answer");
        }
      }
    );
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
          const { peerConnection } = this.createConnectionForNewMaster(
            channel,
            ip,
            machine_id
          );
          const newMasterWebRtc = {
            peerConnection,
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
  lanPeerCreateConnectionForMasterFromChild = async (
    channel,
    ip,
    masterId,
    childId
  ) => {
    const { iceConfigs } = this.state;
    let iceConfigsControlCounter = 0;
    let dataChannel;
    let verifyMessage = false;
    let peerConnection = await this.lanPeerConnectionCreator(
      channel,
      ip,
      masterId,
      childId,
      iceConfigsControlCounter
    );

    const updateConnectionType = () => {
      let iceServerType = "Nothing";
      switch (iceConfigsControlCounter) {
        case 0:
          iceServerType = "0-Null_ICE_SERVER";
          break;
        case 1:
          iceServerType = "1-ALL_STUN";
          break;
        case 2:
          iceServerType = "2-AVM_TURN_UDP_3478_5349";
          break;
        case 3:
          iceServerType = "3-AVM_TURN_TCP_3478_5349";
          break;
        case 4:
          iceServerType = "4-AVM_TURN_3478_5349";
          break;
        case 5:
          iceServerType = "5-AVM_TURN_:3478_UDP:5349_TCP";
          break;
        case 6:
          iceServerType = "6-XIRSYS_TURN_UDP_80_3478";
          break;
        case 7:
          iceServerType = "7-XIRSYS_TURN_TCP_80_3478_443_5349";
          break;
        case 8:
          iceServerType = "8-AVM_STUN_TURN";
          break;
        case 9:
          iceServerType = "9AVM_XIRSYS_STUN_TURN";
          break;
        default:
          iceServerType = "None";
          break;
      }
      const { lanPeers } = this.state;
      const updatedArr = lanPeers.map((node) => {
        if (node.machine_id === masterId) {
          node.connectionType = iceServerType;
        }
        return node;
      });

      this.setState({
        lanPeers: updatedArr,
      });
    };

    channel.on(
      `web:verify_message_${childId}_${masterId}`,
      async ({ child_id, master_id }) => {
        console.log("Verification request received");
        const { messageFromLanPeers } = this.state;
        messageFromLanPeers.forEach(({ message }) => {
          if (message === "1") {
            verifyMessage = true;
            updateConnectionType();
          }
        });
        console.log("verifyMessage: ", verifyMessage);
        if (verifyMessage) {
          channel.push("web:verification_received_lan_peer", {
            child_id: childId,
            master_id: masterId,
          });
        }
      }
    );

    channel.on(
      `web:update_my_peer_connection_${childId}_${masterId}`,
      async ({ counter }) => {
        console.log("Updated peerconnection: ", counter);
        peerConnection = await this.lanPeerConnectionCreator(
          channel,
          ip,
          masterId,
          childId,
          counter
        );
        iceConfigsControlCounter = counter;
      }
    );

    channel.on(
      `web:try_to_connect_child_${childId}`,
      async ({ senderIp, ice_config_control_counter }) => {
        console.log("CHILD RECEIVE TRY REQUEST FROM MASTER");
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        channel.push(`web:send_offer_to_master`, {
          child_id: childId,
          offer_for_master: JSON.stringify(offer),
          master_id: masterId,
          ip,
        });
        console.log("CHILD SEND OFFER");
        dataChannel = this.lanPeerCreateDataChannel(peerConnection, masterId);
      }
    );

    channel.on(
      `web:add_ice_candidate_from_lan_${childId}_${masterId}`,
      async ({ sender_id, candidate }) => {
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
      `web:answer_from_master_${childId}`,
      async ({ answer_for_child, master_id, child_id }) => {
        const answerFromMaster = JSON.parse(answer_for_child);
        try {
          console.log("peerConnection: ", peerConnection);
          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(answerFromMaster)
          );
        } catch (error) {
          console.log("Error In Child setRemoteDescription Answer: ", error);
        }
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

    // dataChannel = this.lanPeerCreateDataChannel(peerConnection, childId);

    return { peerConnection };
  };

  setupLanPeerConnectionChild = async (channel) => {
    const { ip, machineId, lanPeers, type } = this.state;
    const masterNode = lanPeers[lanPeers.length - 1];
    // Here we will create the connection for child to connect to master
    const { peerConnection } = this.lanPeerCreateConnectionForMasterFromChild(
      channel,
      ip,
      masterNode.machine_id,
      machineId
    );
    const masterPeer = {
      ...masterNode,
      peerConnection,
    };
    console.log("MASTER masterPeer: ", masterPeer);
    this.setState({
      lanPeersWebRtcConnections: [masterPeer],
    });
  };

  updateMasterInChild = (channel) => {
    const { ip } = this.state;
    channel.on(`web:update_master_in_child${ip}`, (data) => {
      const { machineId } = this.state;
      // Here we will create the connection for child to connect to master
      const { peerConnection } = this.lanPeerCreateConnectionForMasterFromChild(
        channel,
        ip,
        data.machine_id,
        machineId
      );
      const updatedPeers = [
        {
          machine_id: data.machine_id,
          ip: data.ip,
          type: "MASTER",
          peerConnection,
        },
      ];
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
        await setNodeType("MASTER");
        this.newNodeListener(channel);
        this.newMasterNodeListener(channel);
        await this.setupRemotePeerConnections(channel);
        this.removeNodeListener(channel);
        this.removeMasterNodeListener(channel);
        this.updateChildWebRtcArr(channel);
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
    { ip: childIp, machine_id: childId, type },
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
    } = this.lanPeerConnectionForChildFromMaster(
      channel,
      childIp,
      machineId,
      childId
    );
    const connObj = {
      childIp,
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

  lanPeerConnectionCreator = async (
    channel,
    ip,
    masterId,
    childId,
    iceConfigsControlCounter
  ) => {
    const { type, iceConfigs } = this.state;
    const peerConnection = new RTCPeerConnection(
      iceConfigs[iceConfigsControlCounter]
    );
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        if (type === "MASTER") {
          channel.push(`web:add_ice_candidate_lan`, {
            candidate: JSON.stringify(event.candidate),
            sender_id: masterId,
            receiver_id: childId,
          });
        } else {
          channel.push(`web:add_ice_candidate_lan`, {
            candidate: JSON.stringify(event.candidate),
            sender_id: childId,
            receiver_id: masterId,
          });
        }
      }
    };

    peerConnection.ondatachannel = (event) => {
      console.log("ondatachannel: ", type);
      if (type === "MASTER") {
        const dataChannel = this.onDataChannelForLanPeer(
          peerConnection,
          event,
          childId
        );
      } else {
        const dataChannel = this.onDataChannelForLanPeer(
          peerConnection,
          event,
          masterId
        );
      }
    };

    peerConnection.onnegotiationneeded = async () => {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      if (type === "MASTER") {
        channel.push(`web:send_offer_to_child`, {
          child_id: childId,
          offer_for_child: JSON.stringify(offer),
          master_id: masterId,
          ip,
        });
        console.log("NEGOTIATION MASTER");
        console.log("MASTER SEND OFFER");
      } else {
        channel.push(`web:send_offer_to_master`, {
          child_id: childId,
          offer_for_master: JSON.stringify(offer),
          master_id: masterId,
          ip,
        });
        console.log("NEGOTIATION CHILD");
        console.log("CHILD SEND OFFER");
      }
    };

    return peerConnection;
  };

  lanPeerCreateDataChannel = (peerConnection, lanPeerId) => {
    const dataChannel = peerConnection.createDataChannel("MyDataChannel");
    dataChannel.onopen = () => {
      console.log("LanPeer Data Channel Is Open");
      const { lanPeersWebRtcConnections } = this.state;
      dataChannel.send("1");
      const updatedPeers = lanPeersWebRtcConnections.map((node) => {
        if (node.machineId === lanPeerId) {
          node.peerDataChannel = dataChannel;
          node.peerConnection = peerConnection;
        }
        return node;
      });
      this.setState({
        lanPeersWebRtcConnections: updatedPeers,
      });
    };
    dataChannel.onerror = function (error) {
      console.log("Error:", error);
    };

    dataChannel.onmessage = (event) => {
      const { messageFromLanPeers } = this.state;
      console.log("Got message:", event.data);
      this.setState({
        messageFromLanPeers: [...messageFromLanPeers, { message: event.data }],
      });
    };
    return dataChannel;
  };

  onDataChannelForLanPeer = (peerConnection, event, lanPeerId) => {
    const dataChannel = event.channel;
    console.log("ondatachannel: ", dataChannel);
    dataChannel.onopen = (event) => {
      const { lanPeersWebRtcConnections } = this.state;
      console.log(
        "onDataChannelForLanPeer LanPeer Data Channel Is Open",
        lanPeersWebRtcConnections
      );
      dataChannel.send("1");
      const updatedPeers = lanPeersWebRtcConnections.map((node) => {
        if (node.machine_id === lanPeerId) {
          node.peerDataChannel = dataChannel;
          node.peerConnection = peerConnection;
        }
        return node;
      });
      this.setState({
        lanPeersWebRtcConnections: updatedPeers,
      });
    };
    dataChannel.onerror = function (error) {
      console.log("Error:", error);
    };

    dataChannel.onmessage = (event) => {
      const { messageFromLanPeers } = this.state;
      console.log("Got message:", event.data);
      this.setState({
        messageFromLanPeers: [...messageFromLanPeers, { message: event.data }],
      });
    };
    return dataChannel;
  };

  lanPeerConnectionForChildFromMaster = async (
    channel,
    childIp,
    masterId,
    childId
  ) => {
    const { iceConfigs, ip } = this.state;
    let iceConfigsControlCounter = 0;
    let connection = false;
    let dataChannel = null;
    let isOther = true;
    let peerConnection = await this.lanPeerConnectionCreator(
      channel,
      childIp,
      masterId,
      childId,
      iceConfigsControlCounter
    );
    const connectionRetry = setInterval(async () => {
      console.log("peerConnection", peerConnection);
      console.log("connection state", peerConnection.connectionState);
      console.log("Data channel state", dataChannel.readyState);
      if (dataChannel.readyState !== "open") {
        if (iceConfigsControlCounter >= iceConfigs.length) {
          console.log("ALL Have Been Tried");
          clearInterval(connectionRetry);
          return;
        }
        if (isOther) {
          channel.push(`web:try_to_connect_again_lan_child`, {
            ip: ip,
            child_id: childId,
            ice_config_control_counter: iceConfigsControlCounter,
          });
          isOther = false;
          console.log("MASTER SEND TRY REQUEST");
          console.log(
            "MASTER iceConfigsControlCounter: ",
            iceConfigsControlCounter
          );
          return;
        } else {
          console.log("STEP THREE");
          iceConfigsControlCounter = iceConfigsControlCounter + 1;
          channel.push(`web:updated_peer_connection`, {
            iceConfigsControlCounter,
            sender: masterId,
            receiver: childId,
          });
          peerConnection = await this.lanPeerConnectionCreator(
            channel,
            ip,
            masterId,
            childId,
            iceConfigsControlCounter
          );
          dataChannel = this.lanPeerCreateDataChannel(peerConnection, childId);
          console.log("MASTER CREATE DATA CHANNEL");
          console.log(
            "MASTER iceConfigsControlCounter: ",
            iceConfigsControlCounter
          );
          isOther = true;
        }
      } else {
        // verify channel via message
        setTimeout(() => {
          channel.push("web:verify_message_lan_peer", {
            child_id: childId,
            master_id: masterId,
          });
          setTimeout(() => {
            console.log("Connection ------------", connection);
            if (connection) {
              console.log("Retry removed");
              clearInterval(connectionRetry);
              updateConnectionType();
            } else {
              console.log("message verification failed");
              peerConnection.close();
            }
          }, 500);
        }, 500);
      }
    }, 5000);

    const updateConnectionType = () => {
      let iceServerType = "Nothing";
      switch (iceConfigsControlCounter) {
        case 0:
          iceServerType = "0-Null_ICE_SERVER";
          break;
        case 1:
          iceServerType = "1-ALL_STUN";
          break;
        case 2:
          iceServerType = "2-AVM_TURN_UDP_3478_5349";
          break;
        case 3:
          iceServerType = "3-AVM_TURN_TCP_3478_5349";
          break;
        case 4:
          iceServerType = "4-AVM_TURN_3478_5349";
          break;
        case 5:
          iceServerType = "5-AVM_TURN_:3478_UDP:5349_TCP";
          break;
        case 6:
          iceServerType = "6-XIRSYS_TURN_UDP_80_3478";
          break;
        case 7:
          iceServerType = "7-XIRSYS_TURN_TCP_80_3478_443_5349";
          break;
        case 8:
          iceServerType = "8-AVM_STUN_TURN";
          break;
        case 9:
          iceServerType = "9AVM_XIRSYS_STUN_TURN";
          break;
        default:
          iceServerType = "None";
          break;
      }
      const { lanPeers } = this.state;
      const updatedArr = lanPeers.map((node) => {
        if (node.machine_id === childId) {
          node.connectionType = iceServerType;
        }
        return node;
      });

      this.setState({
        lanPeers: updatedArr,
      });
    };

    channel.on(
      `web:verification_received_from_child_${masterId}_${childId}`,
      ({ ip: currentIp, remote_master_ip }) => {
        const { messageFromLanPeers } = this.state;
        console.log("messageFromLanPeers: ", messageFromLanPeers);
        messageFromLanPeers.map(({ message }) => {
          if (message === "1") {
            console.log("Verified------------");
            connection = true;
          }
        });
      }
    );
    channel.on(
      `web:add_ice_candidate_from_lan_${masterId}_${childId}`,
      async ({ sender_id, candidate }) => {
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
      `web:offer_from_child_${ip}`,
      async ({ offer_for_master, master_id, child_id }) => {
        console.log("MASTER Receive OFFER", offer_for_master);
        const parsedChildOffer = JSON.parse(offer_for_master);
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(parsedChildOffer)
        );
        await peerConnection.createAnswer(
          async (answer) => {
            await peerConnection.setLocalDescription(answer);
            channel.push("web:send_answer_to_child", {
              answer_for_child: JSON.stringify(answer),
              master_id,
              child_id,
            });
            const dataChannel = this.createDataChannel(peerConnection);
            console.log("ANSWER IS SENDED TO CHILD");
          },
          function (error) {
            alert("oops...error");
          }
        );
      }
    );

    channel.on(
      `web:answer_from_child_${childIp}`,
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

    dataChannel = this.lanPeerCreateDataChannel(peerConnection, childId);

    return {
      peerConnection,
      dataChannel,
    };
  };

  createDataChannel = (peerConnection, lanPeerId) => {
    const dataChannel = peerConnection.createDataChannel("MyDataChannel", {
      ordered: false,
      maxRetransmits: 0,
    });
    dataChannel.onopen = () => {
      console.log("Data Channel is open");
      const { lanPeersWebRtcConnections } = this.state;
      const updatedPeers = lanPeersWebRtcConnections.map((node) => {
        if (node.machine_id === lanPeerId) {
          node.peerDataChannel = dataChannel;
          node.peerConnection = peerConnection;
        }
        return node;
      });
      this.setState({
        lanPeersWebRtcConnections: updatedPeers,
      });
    };
    dataChannel.onerror = function (error) {
      console.log("Error:", error);
    };
    dataChannel.onmessage = (event) => {
      const { messageFromLanPeers } = this.state;
      console.log("Got message:", event.data);
      this.setState({
        messageFromLanPeers: [...messageFromLanPeers, { message: event.data }],
      });
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
      const defaultMessage = document.querySelector("#masterInputField").value;
      let messageToSend = defaultMessage;
      if (message) {
        messageToSend = message;
      }
      peerDataChannel.send(messageToSend);
    });
  };

  handleMessageToMasters = () => {
    const { remoteMasterPeersWebRtcConnections, message } = this.state;
    remoteMasterPeersWebRtcConnections.map((masterNode) => {
      const defaultMessage = document.querySelector("#masterInputField").value;
      let messageToSend = defaultMessage;
      if (message) {
        messageToSend = message;
      }
      masterNode.peerDataChannel.send(
        JSON.stringify({ message: messageToSend, type: "MASTER" })
      );
      console.log("masterNode: ", masterNode);
    });
  };

  handleMessageToLanMaster = () => {
    const { lanPeersWebRtcConnections, message } = this.state;
    lanPeersWebRtcConnections.map((masterNode) => {
      const defaultMessage = document.querySelector("#childInputField").value;
      let messageToSend = defaultMessage;
      if (message) {
        messageToSend = message;
      }
      masterNode.peerDataChannel.send(messageToSend);
      console.log("masterNode: ", masterNode);
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
      messageFromLanPeers,
      messagesFromChildsPeers,
    } = this.state;
    const style =
      type === "MASTER"
        ? {
            backgroundColor: "rgba(151, 151, 151, 0.9)",
          }
        : {
            backgroundColor: "white",
          };
    const remotePeerContainerStyle = {
      border: "2px solid white",
      padding: "3px",
      margin: "15px 5px",
      display: "inline-block",
    };

    const lanPeerContainerStyle = {
      border: "2px solid black",
      padding: "3px",
      margin: "15px 5px",
      display: "inline-block",
      color: "black",
    };
    return (
      <div style={style}>
        <h1
          style={
            type === "MASTER"
              ? { color: "white", fontSize: "25px" }
              : { color: "black", fontSize: "25px" }
          }
        >
          {type}__{ip}__{machineId}
        </h1>

        {type === "MASTER" && (
          <div>
            <input
              type="text"
              onChange={this.handleMessage}
              placeholder="Send message to child"
              id="masterInputField"
              value={`${type}__${ip}__${machineId}__Hello`}
            />
            <button onClick={this.handleMessageToChilds}>Send To Child</button>
            <button onClick={this.handleMessageToMasters} id="sendToMaster">
              Send To Masters
            </button>
            <hr />
            <div
              style={{
                width: "100%",
                display: "inline-block",
                height: "auto",
                backgroundColor: "#666666",
                color: "white",
              }}
            >
              <div
                style={{
                  width: "50%",
                  display: "inline-block",
                  height: "auto",
                  backgroundColor: "#262626",
                }}
              >
                <h1 style={{ color: "white", textAlign: "center" }}>
                  Remote Masters
                </h1>
                {remoteMasterPeers.length > 0 &&
                  remoteMasterPeers.map((node, i) => (
                    <div
                      key={i}
                      style={{
                        ...remotePeerContainerStyle,
                        borderWidth: "5px",
                      }}
                    >
                      <div style={remotePeerContainerStyle}>
                        <span>Ice Server Status</span>
                        <hr />
                        <span>
                          {node.connectionType || "Connecting........."}
                        </span>
                      </div>
                      <div style={remotePeerContainerStyle}>
                        <span>IP</span>
                        <hr />
                        <span>{node.ip}</span>
                      </div>
                      <div style={remotePeerContainerStyle}>
                        <span>ID</span>
                        <hr />
                        <span>{node.machine_id}</span>
                      </div>
                      <div style={remotePeerContainerStyle}>
                        <span>Type</span>
                        <hr />
                        <span>{node.type}</span>
                      </div>
                      <div style={remotePeerContainerStyle}>
                        <span>Last Connect Time</span>
                        <hr />
                        <span>0</span>
                      </div>
                      <div style={remotePeerContainerStyle}>
                        <span>Last Message Send Time</span>
                        <hr />
                        <span>0</span>
                      </div>
                      <div style={remotePeerContainerStyle}>
                        <span>Last Message Receive Time</span>
                        <hr />
                        <span>0</span>
                      </div>
                      <div style={remotePeerContainerStyle}>
                        <span>Total Message Send</span>
                        <hr />
                        <span>0</span>
                      </div>
                      <div style={remotePeerContainerStyle}>
                        <span>Total Message Receive</span>
                        <hr />
                        <span>0</span>
                      </div>
                      <div style={remotePeerContainerStyle}>
                        <span>Total Connection time</span>
                        <hr />
                        <span>0</span>
                      </div>
                    </div>
                  ))}
              </div>
              <div
                style={{
                  width: "50%",
                  display: "inline-block",
                  height: "auto",
                  backgroundColor: "white",
                }}
              >
                <RenderLanPeers lanPeers={lanPeers} ip={ip} />
              </div>
            </div>
          </div>
        )}

        {type === "CHILD" && (
          <div>
            <input
              type="text"
              onChange={this.handleMessage}
              placeholder="Send message to master"
              id="childInputField"
              value={`${type}__${ip}__${machineId}__Hello`}
            />
            <button onClick={this.handleMessageToLanMaster}>
              Send To Master
            </button>
            <RenderLanPeers lanPeers={lanPeers} ip={ip} />
          </div>
        )}
      </div>
    );
  }
}

export default Home;
