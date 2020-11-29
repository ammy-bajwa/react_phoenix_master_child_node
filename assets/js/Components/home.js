import React from "react";

import { getMyIp } from "../utils/index";
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
      urls: ["turn:avm4962.com:3478", "turn:avm4962.com:5349"],
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
    iceConfigs: [
      { iceServers: [] },
      {
        iceServers: [
          {
            urls: ["stun:avm4962.com:3478", "stun:avm4962.com:5349"],
          },
          { urls: ["stun:ss-turn1.xirsys.com"] },
        ],
      },
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

  remotePeerConnectionForMaster = (channel, remoteNodeIp, remoteNodeId) => {
    const { ip, iceConfigs } = this.state;
    let iceConfigsControlCounter = 0;
    let connection = false;
    let peerConnection = new RTCPeerConnection(
      iceConfigs[iceConfigsControlCounter]
    );

    channel.on(
      `web:update_my_peer_connection_${ip}`,
      ({ iceConfigsControlCounter: otherMasterPeerIceCounter }) => {
        peerConnection = new RTCPeerConnection(
          iceConfigs[otherMasterPeerIceCounter]
        );
        iceConfigsControlCounter = otherMasterPeerIceCounter;
      }
    );

    let isFirst = true;

    const createAndSendOffer = async () => {
      const { iceConfigs } = this.state;
      if (iceConfigsControlCounter > iceConfigs.length || connection) {
        console.log("All Have Been Tried");
        return;
      }
      // iceConfigsControlCounter++;
      // peerConnection = new RTCPeerConnection(
      //   iceConfigs[iceConfigsControlCounter]
      // );

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("candidate send to: ", remoteNodeIp);
          channel.push(`web:add_ice_candidate_from_master_peer`, {
            candidate: JSON.stringify(event.candidate),
            remote_master_ip: remoteNodeIp,
            ip: ip,
          });
        }
      };
      const dataChannel = peerConnection.createDataChannel("MyDataChannel", {
        ordered: false,
        maxRetransmits: 0,
      });
      dataChannel.onopen = () => {
        console.log("Data Channel is open on 313");
        dataChannel.send("Hello FROM NEW MASTER");
        connection = true;
        const { remoteMasterPeersWebRtcConnections } = this.state;
        const updatedArr = remoteMasterPeersWebRtcConnections.map((node) => {
          if (node.machine_id === remoteNodeId) {
            node.peerDataChannel = dataChannel;
          }
          return node;
        });
        this.setState({
          remoteMasterPeersWebRtcConnections: updatedArr,
        });
      };
      dataChannel.onerror = function (error) {
        console.log("Error:", error);
        connection = false;
      };

      dataChannel.onmessage = (event) => {
        const { messagesFromMastersPeers } = this.state;
        console.log("Got message:", event.data);
        this.setState({
          messagesFromMastersPeers: [
            ...messagesFromMastersPeers,
            { message: event.data },
          ],
        });
      };

      const offerForPeerMaster = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offerForPeerMaster);
      channel.push(`web:send_offer_to_peer_master`, {
        offer_for_peer_master: JSON.stringify(offerForPeerMaster),
        ip: ip,
        remote_master_ip: remoteNodeIp,
      });
      console.log("NEW MASTER create and send offer");
    };
    channel.on(
      `web:try_to_connect_to_master_${ip}`,
      async ({ remote_node_ip }) => {
        console.log("NEW MASTER request to connect");
        if (isFirst) {
          isFirst = false;
          const dataChannel = peerConnection.createDataChannel(
            "MyDataChannel",
            {
              ordered: false,
              maxRetransmits: 0,
            }
          );
          dataChannel.onopen = () => {
            console.log("Data Channel is open on 365");
            connection = true;
            dataChannel.send("Hello FROM NEW MASTER");

            const { remoteMasterPeersWebRtcConnections } = this.state;
            const updatedArr = remoteMasterPeersWebRtcConnections.map(
              (node) => {
                if (node.machine_id === remoteNodeId) {
                  node.peerDataChannel = dataChannel;
                }
                return node;
              }
            );
            this.setState({
              remoteMasterPeersWebRtcConnections: updatedArr,
            });
          };
          dataChannel.onerror = function (error) {
            console.log("Error:", error);
            connection = false;
          };

          dataChannel.onmessage = (event) => {
            const { messagesFromMastersPeers } = this.state;
            console.log("Got message:", event.data);
            this.setState({
              messagesFromMastersPeers: [
                ...messagesFromMastersPeers,
                { message: event.data },
              ],
            });
          };
          const offerForPeerMaster = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offerForPeerMaster);
          channel.push(`web:send_offer_to_peer_master`, {
            offer_for_peer_master: JSON.stringify(offerForPeerMaster),
            ip: ip,
            remote_master_ip: remote_node_ip,
          });
          console.log("NEW MASTER create and send offer");
        } else {
          createAndSendOffer();
        }
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
        try {
          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(answerFromChild)
          );
          console.log(
            "New MASTER Receives and set Answer from: ",
            remoteNodeIp
          );
        } catch (error) {
          console.log("Error In MASTER setRemoteDescription Answer");
        }
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

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("candidate send to: ", remoteNodeIp);
        channel.push(`web:add_ice_candidate_from_master_peer`, {
          candidate: JSON.stringify(event.candidate),
          remote_master_ip: remoteNodeIp,
          ip: ip,
        });
      }
    };

    peerConnection.ondatachannel = (event) => {
      const dataChannel = event.channel;
      dataChannel.onopen = (event) => {
        console.log("Data channel is open at  on 489");
        dataChannel.send("Hello FROM NEW MASTER");

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
    const { iceConfigs, ip } = this.state;
    let iceConfigsControlCounter = 0;
    let connection = false;
    let peerConnection = new RTCPeerConnection(
      iceConfigs[iceConfigsControlCounter]
    );

    const createAndSendOffer = async () => {
      const { iceConfigs } = this.state;
      if (iceConfigsControlCounter > iceConfigs.length || connection) {
        clearInterval(connectionRetry);
        console.log("All Have Been Tried");
        return;
      }
      iceConfigsControlCounter++;
      peerConnection = new RTCPeerConnection(
        iceConfigs[iceConfigsControlCounter]
      );

      channel.push(`web:updated_peer_connection_master_peer`, {
        iceConfigsControlCounter,
        remote_master_ip: remoteNodeIp,
      });

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          channel.push(`web:add_ice_candidate_from_master_peer`, {
            candidate: JSON.stringify(event.candidate),
            ip: ip,
            remote_master_ip: remoteNodeIp,
          });
          console.log("NEW MASTER send candidate to: ", remoteNodeIp);
        }
      };

      console.log("Peer connection: ", peerConnection);
      console.log("iceConfigs: ", iceConfigs);
      console.log("iceConfigsControlCounter: ", iceConfigsControlCounter);

      const dataChannel = peerConnection.createDataChannel("MyDataChannel", {
        ordered: false,
        maxRetransmits: 0,
      });
      dataChannel.onopen = () => {
        console.log("Data Channel is open on 573");
        connection = true;
        dataChannel.send("Hello FROM OLD MASTER");
        const { remoteMasterPeersWebRtcConnections } = this.state;
        const updatedArr = remoteMasterPeersWebRtcConnections.map((node) => {
          if (node.machine_id === remoteNodeId) {
            node.peerDataChannel = dataChannel;
          }
          return node;
        });
        this.setState({
          remoteMasterPeersWebRtcConnections: updatedArr,
        });
      };
      dataChannel.onerror = function (error) {
        console.log("Error:", error);
        connection = false;
      };

      dataChannel.onmessage = (event) => {
        const { messagesFromMastersPeers } = this.state;
        console.log("Got message:", event.data);
        this.setState({
          messagesFromMastersPeers: [
            ...messagesFromMastersPeers,
            { message: event.data },
          ],
        });
      };
      const offerForPeerMaster = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offerForPeerMaster);
      channel.push(`web:send_offer_to_peer_master`, {
        offer_for_peer_master: JSON.stringify(offerForPeerMaster),
        ip,
        remote_master_ip: remoteNodeIp,
      });
      console.log("Old MASTER Send Offer");
    };

    let isOther = true;
    const connectionRetry = setInterval(async () => {
      if (!connection) {
        console.log("Old MASTER Request Offer");
        if (isOther) {
          channel.push(`web:try_to_connect_again_remote_master`, {
            ip: ip,
            remote_node_ip: remoteNodeIp,
          });
          isOther = false;
        } else {
          isOther = true;
          createAndSendOffer();
        }
      } else {
        console.log("Interval is cleared");
        clearInterval(connectionRetry);
      }
    }, 16000);

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

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        channel.push(`web:add_ice_candidate_from_master_peer`, {
          candidate: JSON.stringify(event.candidate),
          ip: ip,
          remote_master_ip: remoteNodeIp,
        });
        console.log("NEW MASTER send candidate to: ", remoteNodeIp);
      }
    };

    peerConnection.ondatachannel = (event) => {
      const dataChannel = event.channel;
      dataChannel.onopen = (event) => {
        console.log("Datachannel is open on 718");
        connection = true;
        const { remoteMasterPeersWebRtcConnections } = this.state;
        const updatedArr = remoteMasterPeersWebRtcConnections.map((node) => {
          if (node.machine_id === remoteNodeId) {
            node.peerDataChannel = dataChannel;
          }
          return node;
        });
        this.setState({
          remoteMasterPeersWebRtcConnections: updatedArr,
        });
      };
      dataChannel.onerror = (error) => {
        console.log("Error:", error);
      };

      dataChannel.onmessage = (event) => {
        console.log("Got message:", event.data);
      };
    };

    peerConnection.onnegotiationneeded = async () => {
      console.log("NEGOTIATION Needed OLD MASTER");
      const offerForPeerMaster = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offerForPeerMaster);
      channel.push(`web:send_offer_to_peer_master`, {
        offer_for_peer_master: JSON.stringify(offerForPeerMaster),
        ip,
        remote_master_ip: remoteNodeIp,
      });
      console.log("OLD MASTER Set And Send Offer To: ", remoteNodeIp);
    };

    const dataChannel = peerConnection.createDataChannel("MyDataChannel", {
      ordered: false,
      maxRetransmits: 0,
    });
    dataChannel.onopen = function () {
      connection = true;
      console.log("Data Channel is open on 758");
      dataChannel.send("Hello FROM OLD MASTER");

      const { remoteMasterPeersWebRtcConnections } = this.state;
      const updatedArr = remoteMasterPeersWebRtcConnections.map((node) => {
        if (node.machine_id === remoteNodeId) {
          node.peerDataChannel = dataChannel;
        }
        return node;
      });
      this.setState({
        remoteMasterPeersWebRtcConnections: updatedArr,
      });
    };
    dataChannel.onerror = function (error) {
      console.log("Error:", error);
    };

    dataChannel.onmessage = (event) => {
      const { messagesFromMastersPeers } = this.state;
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
        console.log("Error in parsing message");
      }
    };

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
          setTimeout(() => {
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
          }, 1000);
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
  lanPeerCreateConnectionForMasterFromChild = (
    channel,
    ip,
    masterId,
    childId
  ) => {
    const { iceConfigs } = this.state;
    let iceConfigsControlCounter = 0;
    let connection = false;
    let peerConnection = new RTCPeerConnection(
      iceConfigs[iceConfigsControlCounter]
    );
    this.setState({
      iceConfigs: iceConfigs,
    });
    const createAndSendOffer = async () => {
      const { iceConfigs } = this.state;
      if (iceConfigsControlCounter >= iceConfigs.length) {
        console.log("All Have Been Tried");
        return;
      }
      iceConfigsControlCounter++;
      peerConnection = new RTCPeerConnection(
        iceConfigs[iceConfigsControlCounter]
      );
      const offerForMaster = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offerForMaster);
      channel.push(`web:send_offer_to_master`, {
        child_id: childId,
        offer_for_master: JSON.stringify(offerForMaster),
        master_id: masterId,
        ip,
      });
      console.log("Offer Peer", peerConnection);
      console.log("OFFER IS SENDED TO MASTER");
    };

    let isOther = true;
    let isFirst = true;

    const checkConnection = () => {
      setTimeout(() => {
        if (!connection) {
          console.log("No connection yet");
          checkConnection();
        } else {
          console.log("Child Is Connected");
          const { lanPeers } = this.state;
          const connectionType = iceConfigs[iceConfigsControlCounter];
          const updatedArr = lanPeers.map((node) => {
            if (node.machine_id === masterId) {
              const { iceServers } = connectionType;
              console.log("iceServers: ", iceServers);
              if (iceServers.length <= 0) {
                node.connectionType = "Null Ice Servers";
              } else if (!iceServers[0].username) {
                node.connectionType = "All Stuns Used";
              } else if (
                iceServers[0].urls[0].includes("turn") &&
                !iceServers[0].urls[0].includes("transport")
              ) {
                node.connectionType = "All AVM TLS Turn Used";
              } else if (
                iceServers[0].urls[0].includes("turn") &&
                iceServers[0].urls[0].includes("transport") &&
                iceServers[0].urls[0].includes("udp") &&
                iceServers[0].urls[0].includes("avm")
              ) {
                node.connectionType = "All AVM UDP Turn Used";
              } else if (
                iceServers[0].urls[0].includes("turn") &&
                iceServers[0].urls[0].includes("transport") &&
                iceServers[0].urls[0].includes("tcp") &&
                iceServers[0].urls[0].includes("avm")
              ) {
                node.connectionType = "All AVM TCP Turn Used";
              } else if (
                iceServers[0].urls[0].includes("turn") &&
                iceServers[0].urls[0].includes("transport") &&
                iceServers[0].urls[0].includes("udp") &&
                iceServers[0].urls[0].includes("xirsys")
              ) {
                node.connectionType = "All XIRSYS UDP Turn Used";
              } else if (
                iceServers[0].urls[0].includes("turn") &&
                iceServers[0].urls[0].includes("transport") &&
                iceServers[0].urls[0].includes("tcp") &&
                iceServers[0].urls[0].includes("xirsys")
              ) {
                node.connectionType = "All XIRSYS TCP Turn Used";
              } else {
                node.connectionType = "Unknown";
              }
              console.log("connectionType: ", node.connectionType);
            }
            return node;
          });

          this.setState({
            lanPeers: updatedArr,
          });
        }
      }, 6000);
    };

    checkConnection();

    channel.on(`web:try_to_connect_${childId}`, async () => {
      console.log("----------------Request receive for offer");
      if (isOther && isFirst) {
        const dataChannel = peerConnection.createDataChannel("MyDataChannel", {
          ordered: false,
          maxRetransmits: 0,
        });
        dataChannel.onopen = () => {
          console.log("Data Channel is open");
          connection = true;
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
          connection = false;
        };

        dataChannel.onmessage = (event) => {
          const { messagesFromLanMasterPeer } = this.state;
          console.log("Got message:", event.data);
          this.setState({
            messagesFromLanMasterPeer: [
              ...messagesFromLanMasterPeer,
              { message: event.data },
            ],
          });
        };
        const offerForMaster = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offerForMaster);
        channel.push(`web:send_offer_to_master`, {
          child_id: childId,
          offer_for_master: JSON.stringify(offerForMaster),
          master_id: masterId,
          ip,
        });
        dataChannel.onopen = () => {
          connection = true;
          console.log("Data channel is open child");
        };
        console.log("OFFER IS SENDED TO MASTER");
        isOther = false;
        isFirst = false;
      } else if (isOther) {
        createAndSendOffer();
        isOther = false;
      } else {
        isOther = true;
      }
    });

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
        connection = true;
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
        connection = true;
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
    const { peerConnection } = this.lanPeerCreateConnectionForMasterFromChild(
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
      const { peerConnection } = this.lanPeerCreateConnectionForMasterFromChild(
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
        await setNodeType("MASTER");
        this.newNodeListener(channel);
        this.newMasterNodeListener(channel);
        console.log("2nd :- ", new Date().getMilliseconds());
        this.setupRemotePeerConnections(channel);
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

  lanPeerConnectionForChildFromMaster = (
    channel,
    childIp,
    masterId,
    childId
  ) => {
    const { iceConfigs, ip } = this.state;
    let iceConfigsControlCounter = 0;
    let connection = false;
    let peerConnection = new RTCPeerConnection(
      iceConfigs[iceConfigsControlCounter]
    );
    const createAndSendOffer = async () => {
      const { iceConfigs } = this.state;
      if (
        iceConfigsControlCounter >= iceConfigs.length ||
        peerConnection.connectionState === "connected"
      ) {
        clearInterval(connectionRetry);
        console.log("All Have Been Tried");
        return;
      }
      iceConfigsControlCounter++;
      peerConnection = new RTCPeerConnection(
        iceConfigs[iceConfigsControlCounter]
      );

      const offerForChild = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offerForChild);
      channel.push(`web:send_offer_to_child`, {
        child_id: childId,
        offer_for_child: JSON.stringify(offerForChild),
        master_id: masterId,
        ip: childIp,
      });
    };
    let isOther = true;
    const connectionRetry = setInterval(async () => {
      if (!connection) {
        console.log("Not connected: ", peerConnection.connectionState);
        if (isOther) {
          channel.push(`web:try_to_connect_again`, {
            child_id: childId,
          });
          isOther = false;
          console.log("-------------Requesting offer from child");
        } else {
          createAndSendOffer();
          isOther = true;
        }
      } else {
        console.log("Interval is cleared");
        clearInterval(connectionRetry);
      }
    }, 6000);

    channel.on(
      `web:add_ice_candidate_to_master${childIp}`,
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

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        channel.push(`web:add_ice_candidate_from_master`, {
          candidate: JSON.stringify(event.candidate),
          child_id: childId,
        });
      }
    };

    peerConnection.ondatachannel = (event) => {
      const dataChannel = event.channel;
      console.log("ondatachannel: ", dataChannel);
      dataChannel.onopen = (event) => {
        console.log("Master Data Channel Is Open");
        connection = true;
        const { lanPeersWebRtcConnections } = this.state;
        const updatedPeers = lanPeersWebRtcConnections.map((node) => {
          if (node.machineId === childId) {
            node.peerDataChannel = dataChannel;
          }
          return node;
        });
        this.setState({
          lanPeersWebRtcConnections: updatedPeers,
        });
      };
      dataChannel.onerror = function (error) {
        console.log("Error:", error);
        connection = false;
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
        ip: childIp,
      });
    };

    const dataChannel = peerConnection.createDataChannel("MyDataChannel", {
      ordered: false,
      maxRetransmits: 0,
    });
    dataChannel.onopen = () => {
      console.log("Data Channel is open");
      console.log("Interval is cleared");
      clearInterval(connectionRetry);
      connection = true;
      const { lanPeers } = this.state;
      const connectionType = iceConfigs[iceConfigsControlCounter];
      const updatedArr = lanPeers.map((node) => {
        if (node.machine_id === childId) {
          const { iceServers } = connectionType;
          console.log("iceServers: ", iceServers);
          if (iceServers.length <= 0) {
            node.connectionType = "Null Ice Servers";
          } else if (!iceServers[0].username) {
            node.connectionType = "All Stuns Used";
          } else if (
            iceServers[0].urls[0].includes("turn") &&
            !iceServers[0].urls[0].includes("transport")
          ) {
            node.connectionType = "All AVM TLS Turn Used";
          } else if (
            iceServers[0].urls[0].includes("turn") &&
            iceServers[0].urls[0].includes("transport") &&
            iceServers[0].urls[0].includes("udp") &&
            iceServers[0].urls[0].includes("avm")
          ) {
            node.connectionType = "All AVM UDP Turn Used";
          } else if (
            iceServers[0].urls[0].includes("turn") &&
            iceServers[0].urls[0].includes("transport") &&
            iceServers[0].urls[0].includes("tcp") &&
            iceServers[0].urls[0].includes("avm")
          ) {
            node.connectionType = "All AVM TCP Turn Used";
          } else if (
            iceServers[0].urls[0].includes("turn") &&
            iceServers[0].urls[0].includes("transport") &&
            iceServers[0].urls[0].includes("udp") &&
            iceServers[0].urls[0].includes("xirsys")
          ) {
            node.connectionType = "All XIRSYS UDP Turn Used";
          } else if (
            iceServers[0].urls[0].includes("turn") &&
            iceServers[0].urls[0].includes("transport") &&
            iceServers[0].urls[0].includes("tcp") &&
            iceServers[0].urls[0].includes("xirsys")
          ) {
            node.connectionType = "All XIRSYS TCP Turn Used";
          } else {
            node.connectionType = "Unknown";
          }
          console.log("connectionType: ", node.connectionType);
        }
        return node;
      });

      this.setState({
        lanPeers: updatedArr,
      });
    };
    dataChannel.onerror = function (error) {
      console.log("Error:", error);
      connection = false;
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
    remoteMasterPeersWebRtcConnections.map((masterNode) => {
      masterNode.peerDataChannel.send(
        JSON.stringify({ message, type: "MASTER" })
      );
      console.log("masterNode: ", masterNode);
    });
  };

  handleMessageToLanMaster = () => {
    const { lanPeersWebRtcConnections, message } = this.state;
    lanPeersWebRtcConnections.map((masterNode) => {
      masterNode.peerDataChannel.send(message);
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
      messagesFromLanMasterPeer,
      messagesFromChildsPeers,
    } = this.state;
    return (
      <div>
        <h1>Version 5</h1>
        <h1>{type}</h1>
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
            {remoteMasterPeers.length > 0 &&
              remoteMasterPeers.map(({ ip, type, machine_id }, i) => (
                <h2 key={i}>
                  {ip} - {type} - {machine_id}
                </h2>
              ))}
            <h1>Message From Other Masters Peers</h1>
            {messagesFromMastersPeers.length > 0 &&
              messagesFromMastersPeers.map(({ message }, i) => (
                <h2 key={i}>{message}</h2>
              ))}
            <hr />
            <h1>Message From Child Peers</h1>
            {messagesFromChildsPeers.length > 0 &&
              messagesFromChildsPeers.map(({ message }, i) => (
                <h2 key={i}>{message}</h2>
              ))}
          </div>
        )}

        <h1>Lan Peers</h1>
        {lanPeers.length > 0 &&
          lanPeers.map(({ ip, type, machine_id, connectionType }, i) => (
            <h2 key={i}>
              {ip} - {type} - {machine_id} - {connectionType}
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
            {messagesFromLanMasterPeer.length > 0 &&
              messagesFromLanMasterPeer.map(({ message }, i) => (
                <h2 key={i}>{message}</h2>
              ))}
          </div>
        )}
      </div>
    );
  }
}

export default Home;
