import React from "react";
import moment from "moment";

import { v4 as uuidv4 } from "uuid";

import { RenderLanPeers } from "./lanPeer";
import { Table } from "./table";

import { getMyIp } from "../utils/index";
import { iceConfigServers } from "../utils/iceServersArr";
import { getMachineId, setNodeType, setNodeId } from "../utils/indexedDbUtils";
import { configureChannel } from "../socket";

class Home extends React.Component {
  state = {
    momentFormat: "YYYY/MM/DD HH:mm:ss",
    messageSendTime: 500,
    messageVerifyTime: 1000,
    retryTime: 5000,
    dataChannelOptions: {
      ordered: true, // do not guarantee order
      // maxPacketLifeTime: 300, // in milliseconds
    },
    ip: "",
    heartBeatInterval: null,
    machineId: "",
    type: "",
    lanPeers: [],
    lanPeersWebRtcConnections: [],
    remoteMasterPeers: [],
    remoteMasterPeersWebRtcConnections: [],
    message: "",
    masterDataChannel: false,
    messagesFromMastersPeers: [],
    messageFromLanPeers: [],
    iceConfigs: [...iceConfigServers],
  };
  constructor(props) {
    super(props);
  }

  // async componentWillUnmount() {
  //   await setNodeType("");
  // }

  componentWillUnmount() {
    const { heartBeatInterval } = this.setState;
    clearInterval(heartBeatInterval);
  }

  async componentDidMount() {
    let { channel, socket } = await configureChannel();
    this.setupSocketAndChannel(channel);
    socket.onError = () => {
      alert("Socket Has Error");
      socket.connect();
      this.setupSocketAndChannel(channel);
    };
    socket.onClose = () => {
      alert("Socket Has Closed");
      socket.connect();
      this.setupSocketAndChannel(channel);
    };
  }

  setupSocketAndChannel = async (channel) => {
    const componentThis = this;
    await this.setupIp();
    await this.manageMachineId();
    channel
      .join()
      .receive("ok", async ({ remote_masters_peers, lan_peers, type }) => {
        // Receiving null here if request is from same browser
        const heartBeatInterval = setInterval(() => {
          channel.push("web:heart_beat", {});
        }, 4000);
        this.setState({
          heartBeatInterval,
        });
        if (!lan_peers) {
          channel.leave();
          alert("Already a connection is established in other tab");
          return;
        }
        if (remote_masters_peers) {
          const updatedRemoteMasterPeers = remote_masters_peers.filter(
            (node) => node !== null
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
        console.log("Something wrong with socket");
        console.log("failed join", reason);
      })
      .receive("timeout", () => {
        console.log("Networking issue. Still waiting....");
      });
  };

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

  getIceServerType = (controlVariable) => {
    switch (controlVariable) {
      case 0:
        return "0-Null_ICE_SERVER";
      case 1:
        return "1-ALL STUN";
      case 2:
        return "2-AVM_TURN_UDP_3478";
      case 3:
        return "3-AVM_TURN_UDP_5349";
      case 4:
        return "4-AVM_TURN_TCP_3478";
      case 5:
        return "5-AVM_TURN_TCP_5349";
      case 6:
        return "6-AVM_TURN_3478";
      case 7:
        return "7-AVM_TURN_5349";
      case 8:
        return "8-AVM_TURN_:3478_UDP:5349_TCP";
      case 9:
        return "9-XIRSYS_TURN_UDP_80";
      case 10:
        return "10-XIRSYS_TURN_UDP_3478";
      case 11:
        return "11-XIRSYS_TURN_TCP_80";
      case 12:
        return "12-XIRSYS_TURN_TCP_3478";
      case 13:
        return "13-XIRSYS_TURN_TCP_443";
      case 14:
        return "14-XIRSYS_TURN_TCP_5349";
      case 15:
        return "15-AVM_TURN_UDP_3475_TCP_5349";
      case 16:
        return "16-AVM_XIRSYS_STUN_TURN_UDP_TCP_ALL";
      default:
        return "None";
    }
  };

  remotePeerConnectionForMaster = async (
    channel,
    remoteNodeIp,
    remoteNodeId
  ) => {
    const { ip } = this.state;
    let iceConfigsControlCounter = 1;
    let verifyMessage = false;
    let peerConnection = await this.peerConnectionCreatorMasterPeers(
      channel,
      remoteNodeIp,
      remoteNodeId,
      iceConfigsControlCounter
    );

    const updateConnectionType = () => {
      let iceServerType = this.getIceServerType(iceConfigsControlCounter);
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

    const cleanConnection = () => {
      try {
        peerConnection.close();
      } catch (error) {
        console.error(error);
      }
    };

    channel.on(
      `web:verify_message_${ip}_${remoteNodeIp}`,
      ({ ip, remote_master_ip }) => {
        console.log("Verification request received");
        const { messagesFromMastersPeers } = this.state;
        console.log(
          "====================messagesFromMastersPeers---------: ",
          messagesFromMastersPeers
        );
        messagesFromMastersPeers.forEach(({ message }) => {
          if (message.split("_")[0] === remoteNodeId) {
            verifyMessage = true;
          }
        });
        console.log("verifyMessage: ", verifyMessage);
        if (verifyMessage) {
          channel.push("web:verification_received", {
            ip,
            remote_master_ip: remoteNodeIp,
          });
          updateConnectionType();
        }
      }
    );

    channel.on(
      `web:update_my_peer_connection_${ip}_${remoteNodeIp}`,
      async ({ counter }) => {
        console.log("Updated peerconnection: ", counter);
        cleanConnection();
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
        // this.createDataChannelForMasterPeer(peerConnection, remoteNodeId);
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
            console.log("oops...error");
          }
        );
      }
    );
    return { peerConnection };
  };

  cleanMessagesMasterPeers = (masterPeerId) => {
    const { messagesFromMastersPeers } = this.state;
    const updatedMessages = messagesFromMastersPeers.filter(
      ({ message }) => message.split("_")[0] !== masterPeerId
    );
    this.setState({
      messagesFromMastersPeers: updatedMessages,
    });
  };
  checkVerificationAgain = (remoteNodeId, missingCount) => {
    setTimeout(() => {
      console.log("checkVerificationAgain");
      let founded = false;
      const { messagesFromMastersPeers, remoteMasterPeers } = this.state;
      const textToSearch = `${remoteNodeId}_${missingCount}`;
      for (let index = 0; index < messagesFromMastersPeers.length; index++) {
        const { message } = messagesFromMastersPeers[index];
        if (message === textToSearch) {
          founded = true;
          break;
        }
      }
      if (founded) {
        console.log("Founded");
        const filteredMessages = messagesFromMastersPeers.filter(
          ({ message }) => message !== textToSearch
        );
        const updatedPeers = remoteMasterPeers.map((node) => {
          if (node.machine_id === remoteNodeId) {
            if (node.lateVerified !== undefined) {
              node.totalVerifiedMessages =
                parseInt(node.totalVerifiedMessages) + 1;
              node.totalUnverifiedMessages =
                parseInt(node.totalUnverifiedMessages) - 1;
              node.lateVerified = parseInt(node.lateVerified) + 1;
            } else {
              node.totalVerifiedMessages =
                parseInt(node.totalVerifiedMessages) + 1;
              node.totalUnverifiedMessages =
                parseInt(node.totalUnverifiedMessages) - 1;
              node.lateVerified = 1;
            }
            node.currentMessage = `${missingCount}__${remoteNodeId.slice(
              0,
              5
            )}`;
          }
          return node;
        });
        this.setState({
          messagesFromMastersPeers: filteredMessages,
          remoteMasterPeers: updatedPeers,
        });
      } else {
        console.log(
          "Second Verification is also failed : ",
          remoteNodeId,
          " ",
          missingCount
        );
      }
    }, 1000);
  };
  createDataChannelForMasterPeer = (
    peerConnection,
    remoteNodeId,
    dataChannelName
  ) => {
    const { dataChannelOptions } = this.state;
    const dataChannel = peerConnection.createDataChannel(
      dataChannelName,
      dataChannelOptions
    );
    const channelId = uuidv4();
    let messageInterval = null;
    let timeInterval = null;
    let verifyCount = 0;
    let totalVerified = 0;
    dataChannel.onopen = async () => {
      console.log(dataChannelName + " Data Channel is open on 607");
      verifyCount = 1;
      totalVerified = 0;
      let notSendArr = [];
      let delaySendArr = [];
      const {
        remoteMasterPeersWebRtcConnections,
        remoteMasterPeers,
        machineId,
        momentFormat,
        messageSendTime,
      } = this.state;
      dataChannel.send(machineId);
      let verifyCountSender = 1;
      messageInterval = setInterval(() => {
        // If counter mode 12 is zero then send all counters in not_send_arr and add counter to the not_send_arr
        // if counter mode 12 is not zero
        // check if the counter mod 4 is zero
        // zero then then add counter to not_send_arr
        // not zero then normally send the counter
        // console.log("+++++++++++++++++++++++++++++++++++++++");
        if (verifyCountSender % 12 !== 0) {
          if (verifyCountSender % 4 !== 0) {
            dataChannel.send(`${machineId}_${verifyCountSender}`);
          } else {
            notSendArr.push({
              counter: verifyCountSender,
              timeStamp: moment().format(momentFormat),
            });
          }
          verifyCountSender = verifyCountSender + 1;
        } else {
          // If counter mode 12 is zero then send all counters in not_send_arr and add counter to the not_send_arr
          notSendArr.forEach(({ counter }) => {
            dataChannel.send(`${machineId}_${counter}`);
            delaySendArr.push({
              counter: counter,
              timeStamp: moment().format(momentFormat),
            });
          });
          notSendArr = [];
          notSendArr.push({
            counter: verifyCountSender,
            timeStamp: moment().format(momentFormat),
          });
          verifyCountSender = verifyCountSender + 1;
        }
        const { remoteMasterPeers } = this.state;
        const updatedPeers = remoteMasterPeers.map((node) => {
          if (node.machine_id === remoteNodeId) {
            if (node.totalSendMessageCount !== undefined) {
              node.totalSendMessageCount =
                parseInt(node.totalSendMessageCount) + 1;
            } else {
              node.totalSendMessageCount = 1;
            }
            node.lastMessageSendTime = moment().format(momentFormat);
            node.notSendArr = notSendArr;
            node.delaySendArr = delaySendArr;
          }
          return node;
        });
        this.setState({
          remoteMasterPeers: updatedPeers,
        });
      }, messageSendTime);
      const lanUpdatedPeers = remoteMasterPeers.map((node) => {
        if (node.machine_id === remoteNodeId) {
          node.connectionTime = moment().format(momentFormat);
        }
        return node;
      });
      this.setState({
        remoteMasterPeers: lanUpdatedPeers,
      });
      const updatedArr = remoteMasterPeersWebRtcConnections.map((node) => {
        if (node.machine_id === remoteNodeId) {
          console.log("OLD MASTER Updating datachannel on 559");
          const dataChannelObj = {
            id: channelId,
            dataChannel,
          };
          if (node.peerDataChannel && node.peerDataChannel.length >= 0) {
            node.peerDataChannel = [...node.peerDataChannel, dataChannelObj];
          } else {
            node.peerDataChannel = [dataChannelObj];
          }
        }
        return node;
      });
      this.setState({
        remoteMasterPeersWebRtcConnections: updatedArr,
      });
      let totalSecondTimeCount = 0;
      timeInterval = setInterval(() => {
        const { remoteMasterPeers } = this.state;
        const remoteUpdatedPeers = remoteMasterPeers.map((node) => {
          if (node.machine_id === remoteNodeId) {
            totalSecondTimeCount = totalSecondTimeCount + 1;
            node.totalConnectionTime = this.hhmmss(totalSecondTimeCount);
          }
          return node;
        });
        this.setState({
          remoteMasterPeers: remoteUpdatedPeers,
        });
      }, 1000);
    };

    let notReceived = [];
    let delayedReceived = [];
    dataChannel.onerror = (error) => {
      console.log("Error: ", error, " 669");
      const { remoteMasterPeersWebRtcConnections } = this.state;
      const updatedArr = remoteMasterPeersWebRtcConnections.map((node) => {
        if (node.machine_id === remoteNodeId) {
          if (node.peerDataChannel && node.peerDataChannel.length) {
            node.peerDataChannel = node.peerDataChannel.filter(
              (dcObj) => dcObj.id !== channelId
            );
          } else {
            node.peerDataChannel = [];
          }
        }
        return node;
      });
      this.setState({
        remoteMasterPeersWebRtcConnections: updatedArr,
      });
      verifyCount = 1;
      totalVerified = 0;
      notReceived = [];
      delayedReceived = [];
      clearInterval(messageInterval);
      clearInterval(timeInterval);
      this.cleanMessagesMasterPeers(remoteNodeId);
    };
    dataChannel.onmessage = (event) => {
      const { remoteMasterPeers, momentFormat } = this.state;
      const receivedMessage = event.data;
      let receivedMessageCount = receivedMessage.split("_")[1];
      // console.log("receivedMessageCount: ", receivedMessageCount);
      if (receivedMessageCount) {
        receivedMessageCount = parseInt(receivedMessageCount);
        if (receivedMessageCount === verifyCount) {
          // Message is verified
          const updatedPeers = remoteMasterPeers.map((node) => {
            if (node.machine_id === remoteNodeId) {
              if (node.totalVerifiedMessages !== undefined) {
                node.totalVerifiedMessages =
                  parseInt(node.totalVerifiedMessages) + 1;
              } else {
                node.totalVerifiedMessages = totalVerified;
              }
              node.currentMessage = `${verifyCount}__${remoteNodeId.slice(
                0,
                5
              )}`;
            }
            return node;
          });
          totalVerified++;
          this.setState({
            remoteMasterPeers: updatedPeers,
          });
          verifyCount++;
        } else if (receivedMessageCount > verifyCount) {
          // Here we will store all numbers that are
          for (let index = verifyCount; index < receivedMessageCount; index++) {
            notReceived.push({
              counter: index,
              timeStamp: moment().format(momentFormat),
            });
          }
          verifyCount = receivedMessageCount + 1;
          const updatedPeers = remoteMasterPeers.map((node) => {
            if (node.machine_id === remoteNodeId) {
              if (node.totalVerifiedMessages !== undefined) {
                node.totalVerifiedMessages =
                  parseInt(node.totalVerifiedMessages) + 1;
              } else {
                node.totalVerifiedMessages = totalVerified;
              }
              node.currentMessage = `${verifyCount}__${remoteNodeId.slice(
                0,
                5
              )}`;
            }
            return node;
          });
          totalVerified++;
          this.setState({
            remoteMasterPeers: updatedPeers,
          });
        } else if (receivedMessageCount < verifyCount) {
          for (let index = 0; index < notReceived.length; index++) {
            const { counter } = notReceived[index];
            if (counter === receivedMessageCount) {
              notReceived.splice(index, 1);
              delayedReceived.push({
                counter,
                timeStamp: moment().format(momentFormat),
              });
            }
          }
        } else {
          console.log(
            "THIS SHOULD NOT HAPPEN______________-------------------"
          );
          // Not verified
          // const { messagesFromMastersPeers, remoteMasterPeers } = this.state;
          // const updatedPeers = remoteMasterPeers.map((node) => {
          //   if (node.machine_id === remoteNodeId) {
          //     if (node.totalUnverifiedMessages !== undefined) {
          //       node.totalUnverifiedMessages =
          //         parseInt(node.totalUnverifiedMessages) + 1;
          //     } else {
          //       node.totalUnverifiedMessages = 1;
          //     }
          //     this.checkVerificationAgain(remoteNodeId, receivedMessageCount);
          //     node.currentMessage = `${verifyCount}__${remoteNodeId.slice(
          //       0,
          //       5
          //     )}`;
          //   }
          //   return node;
          // });
          // this.setState({
          //   messagesFromMastersPeers: [
          //     ...messagesFromMastersPeers,
          //     { message: event.data },
          //   ],
          //   remoteMasterPeers: updatedPeers,
          // });
        }
      } else {
        const { messagesFromMastersPeers } = this.state;
        this.setState({
          messagesFromMastersPeers: [
            ...messagesFromMastersPeers,
            { message: event.data },
          ],
        });
      }
      const updatedPeers = remoteMasterPeers.map((node) => {
        if (node.machine_id === remoteNodeId) {
          if (node.totalReceiveMessageCount !== undefined) {
            node.totalReceiveMessageCount =
              parseInt(node.totalReceiveMessageCount) + 1;
          } else {
            node.totalReceiveMessageCount = 0;
          }
          node.lastMessageReceiveTime = moment().format(momentFormat);
          node.notReceived = notReceived;
          node.delayedReceived = delayedReceived;
        }
        return node;
      });
      this.setState({
        remoteMasterPeers: updatedPeers,
      });
    };
    return dataChannel;
  };

  onDataChannelForMasterPeer = (event, remoteNodeId) => {
    const dataChannel = event.channel;
    const channelId = uuidv4();
    let messageInterval = null;
    let timeInterval = null;
    let verifyCount = 1;
    let totalVerified = 0;
    dataChannel.onopen = async (event) => {
      console.log("Datachannel is open on 682");
      verifyCount = 1;
      totalVerified = 0;
      let notSendArr = [];
      let delaySendArr = [];
      const {
        remoteMasterPeers,
        machineId,
        remoteMasterPeersWebRtcConnections,
        momentFormat,
        messageSendTime,
      } = this.state;
      dataChannel.send(machineId);
      let verifyCountSender = 1;
      messageInterval = setInterval(() => {
        if (verifyCountSender % 12 !== 0) {
          if (verifyCountSender % 4 !== 0) {
            dataChannel.send(`${machineId}_${verifyCountSender}`);
          } else {
            notSendArr.push({
              counter: verifyCountSender,
              timeStamp: moment().format(momentFormat),
            });
          }
          verifyCountSender = verifyCountSender + 1;
        } else {
          // If counter mode 12 is zero then send all counters in not_send_arr and add counter to the not_send_arr
          notSendArr.forEach(({ counter }) => {
            dataChannel.send(`${machineId}_${counter}`);
            delaySendArr.push({
              counter: counter,
              timeStamp: moment().format(momentFormat),
            });
          });
          notSendArr = [];
          notSendArr.push({
            counter: verifyCountSender,
            timeStamp: moment().format(momentFormat),
          });
          verifyCountSender = verifyCountSender + 1;
        }
        const { remoteMasterPeers } = this.state;
        const remoteUpdatedPeers = remoteMasterPeers.map((node) => {
          if (node.machine_id === remoteNodeId) {
            if (node.totalSendMessageCount !== undefined) {
              node.totalSendMessageCount =
                parseInt(node.totalSendMessageCount) + 1;
            } else {
              node.totalSendMessageCount = 0;
            }
            node.lastMessageSendTime = moment().format(momentFormat);
          }
          return node;
        });
        this.setState({
          remoteMasterPeers: remoteUpdatedPeers,
        });
      }, messageSendTime);
      const updatedPeers = remoteMasterPeers.map((node) => {
        if (node.machine_id === remoteNodeId) {
          node.connectionTime = moment().format(momentFormat);
        }
        return node;
      });
      this.setState({
        remoteMasterPeers: updatedPeers,
      });
      let totalSecondTimeCount = 0;
      timeInterval = setInterval(() => {
        const { remoteMasterPeers } = this.state;
        const remoteUpdatedPeers = remoteMasterPeers.map((node) => {
          if (node.machine_id === remoteNodeId) {
            totalSecondTimeCount = totalSecondTimeCount + 1;
            node.totalConnectionTime = this.hhmmss(totalSecondTimeCount);
          }
          return node;
        });
        this.setState({
          remoteMasterPeers: remoteUpdatedPeers,
        });
      }, 1000);

      const updatedArrDataChannels = remoteMasterPeersWebRtcConnections.map(
        (node) => {
          if (node.machine_id === remoteNodeId) {
            console.log("OLD MASTER Updating datachannel on 559");
            const dataChannelObj = {
              id: channelId,
              dataChannel,
            };
            if (node.peerDataChannel && node.peerDataChannel.length >= 0) {
              node.peerDataChannel = [...node.peerDataChannel, dataChannelObj];
            } else {
              node.peerDataChannel = [dataChannelObj];
            }
          }
          return node;
        }
      );
      this.setState({
        remoteMasterPeersWebRtcConnections: updatedArrDataChannels,
      });
    };
    let notReceived = [];
    let delayedReceived = [];
    dataChannel.onerror = (error) => {
      console.log("Error:", error, " 750");
      verifyCount = 1;
      totalVerified = 0;
      notReceived = [];
      delayedReceived = [];
      clearInterval(messageInterval);
      clearInterval(timeInterval);
      this.cleanMessagesMasterPeers(remoteNodeId);
    };
    dataChannel.onmessage = (event) => {
      const { remoteMasterPeers, momentFormat } = this.state;
      const receivedMessage = event.data;
      let receivedMessageCount = receivedMessage.split("_")[1];
      if (receivedMessageCount) {
        receivedMessageCount = parseInt(receivedMessageCount);
        // console.log("receivedMessageCount: ", receivedMessageCount);
        // If received_counter is equal to verify_count
        // verify_count will increase
        // count will be consider verified
        // If received_counter is less than to verify_count
        // check the counter in not received arr
        // add the counter in the delayed received arr
        // verify_count = received_counter + 1
        // If received_counter is greater than to verify_count
        // add counter in verified
        // add all missing counts from verify_count to received_counter in not received
        // verify_count = received_counter + 1
        if (receivedMessageCount === verifyCount) {
          // Message is verified
          const updatedPeers = remoteMasterPeers.map((node) => {
            if (node.machine_id === remoteNodeId) {
              if (node.totalVerifiedMessages !== undefined) {
                node.totalVerifiedMessages =
                  parseInt(node.totalVerifiedMessages) + 1;
              } else {
                node.totalVerifiedMessages = totalVerified;
              }
              node.currentMessage = `${verifyCount}__${remoteNodeId.slice(
                0,
                5
              )}`;
            }
            return node;
          });
          totalVerified++;
          this.setState({
            remoteMasterPeers: updatedPeers,
          });
          verifyCount++;
        } else if (receivedMessageCount > verifyCount) {
          // Here we will store all numbers that are
          for (let index = verifyCount; index < receivedMessageCount; index++) {
            notReceived.push({
              counter: index,
              timeStamp: moment().format(momentFormat),
            });
          }
          verifyCount = receivedMessageCount + 1;
          const updatedPeers = remoteMasterPeers.map((node) => {
            if (node.machine_id === remoteNodeId) {
              if (node.totalVerifiedMessages !== undefined) {
                node.totalVerifiedMessages =
                  parseInt(node.totalVerifiedMessages) + 1;
              } else {
                node.totalVerifiedMessages = totalVerified;
              }
              node.currentMessage = `${verifyCount}__${remoteNodeId.slice(
                0,
                5
              )}`;
            }
            return node;
          });
          totalVerified++;
          this.setState({
            remoteMasterPeers: updatedPeers,
          });
        } else if (receivedMessageCount < verifyCount) {
          for (let index = 0; index < notReceived.length; index++) {
            const { counter } = notReceived[index];
            if (counter === receivedMessageCount) {
              notReceived.splice(index, 1);
              delayedReceived.push({
                counter,
                timeStamp: moment().format(momentFormat),
              });
            }
          }
        } else {
          console.log(
            "THIS SHOULD NOT HAPPEN______________-------------------"
          );
          // Not verified
          // const { messagesFromMastersPeers, remoteMasterPeers } = this.state;
          // const updatedPeers = remoteMasterPeers.map((node) => {
          //   if (node.machine_id === remoteNodeId) {
          //     if (node.totalUnverifiedMessages !== undefined) {
          //       node.totalUnverifiedMessages =
          //         parseInt(node.totalUnverifiedMessages) + 1;
          //     } else {
          //       node.totalUnverifiedMessages = 1;
          //     }
          //     this.checkVerificationAgain(remoteNodeId, receivedMessageCount);
          //     node.currentMessage = `${verifyCount}__${remoteNodeId.slice(
          //       0,
          //       5
          //     )}`;
          //   }
          //   return node;
          // });
          // this.setState({
          //   messagesFromMastersPeers: [
          //     ...messagesFromMastersPeers,
          //     { message: event.data },
          //   ],
          //   remoteMasterPeers: updatedPeers,
          // });
        }
      } else {
        const { messagesFromMastersPeers } = this.state;
        this.setState({
          messagesFromMastersPeers: [
            ...messagesFromMastersPeers,
            { message: event.data },
          ],
        });
      }
      const updatedPeers = remoteMasterPeers.map((node) => {
        if (node.machine_id === remoteNodeId) {
          if (node.totalReceiveMessageCount !== undefined) {
            node.totalReceiveMessageCount =
              parseInt(node.totalReceiveMessageCount) + 1;
          } else {
            node.totalReceiveMessageCount = 0;
          }
          node.lastMessageReceiveTime = moment().format(momentFormat);
          node.notReceived = notReceived;
          node.delayedReceived = delayedReceived;
        }
        return node;
      });
      this.setState({
        remoteMasterPeers: updatedPeers,
      });
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

  createDCSendOfferToOtherMasterPeers = async (
    channel,
    peerConnection,
    remoteNodeId,
    remoteNodeIp
  ) => {
    const { ip } = this.state;
    this.createDataChannelForMasterPeer(peerConnection, remoteNodeId, "dc_1");
    this.createDataChannelForMasterPeer(peerConnection, remoteNodeId, "dc_2");
    this.createDataChannelForMasterPeer(peerConnection, remoteNodeId, "dc_3");
    this.createDataChannelForMasterPeer(peerConnection, remoteNodeId, "dc_4");
    this.createDataChannelForMasterPeer(peerConnection, remoteNodeId, "dc_4");
    this.createDataChannelForMasterPeer(peerConnection, remoteNodeId, "dc_5");
    const offerForPeerMaster = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offerForPeerMaster);
    channel.push(`web:send_offer_to_peer_master`, {
      offer_for_peer_master: JSON.stringify(offerForPeerMaster),
      ip: ip,
      remote_master_ip: remoteNodeIp,
    });
  };

  createConnectionForNewMaster = async (
    channel,
    remoteNodeIp,
    remoteNodeId
  ) => {
    const { iceConfigs, ip, retryTime } = this.state;
    let iceConfigsControlCounter = 1;
    let otherMasterPeerLayer = 1;
    let isFirstLayerTrying = true;
    let isOtherLayerTrying = false;
    let stunRetryCount = 0;
    let connection = false;
    let dataChannel = null;
    let connectionRetry;
    let connectionCheckingInterval;
    let isOther = true;
    let peerConnection = await this.peerConnectionCreatorMasterPeers(
      channel,
      remoteNodeIp,
      remoteNodeId,
      iceConfigsControlCounter
    );
    this.createDCSendOfferToOtherMasterPeers(
      channel,
      peerConnection,
      remoteNodeId,
      remoteNodeIp
    );
    const updateConnectionType = () => {
      let iceServerType = this.getIceServerType(iceConfigsControlCounter);
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

    const cleanConnection = () => {
      try {
        peerConnection.close();
        dataChannel.close();
      } catch (error) {
        console.error(error);
      }
    };

    const startRetryInterval = () =>
      setInterval(async () => {
        try {
          const { remoteMasterPeersWebRtcConnections } = this.state;
          remoteMasterPeersWebRtcConnections.forEach((remoteNode) => {
            if (remoteNode.machine_id === remoteNodeId) {
              dataChannel = remoteNode.peerDataChannel[0].dataChannel;
              console.log("remoteNode ", remoteNode);
            }
          });
        } catch (error) {
          dataChannel = null;
        }
        let readyState = "";
        try {
          readyState = dataChannel.readyState;
        } catch (error) {
          readyState = "";
        }
        if (readyState !== "open") {
          clearInterval(connectionCheckingInterval);
          if (iceConfigsControlCounter >= iceConfigs.length) {
            console.log("ALL Have Been Tried And Resetting");
            // clearInterval(connectionRetry);
            iceConfigsControlCounter = 1;
            isOther = true;
            return;
          }
          if (isOther) {
            if (isFirstLayerTrying) {
              channel.push(`web:try_to_connect_again_remote_master`, {
                ip: ip,
                remote_node_ip: remoteNodeIp,
                ice_config_control_counter: iceConfigsControlCounter,
              });
              isFirstLayerTrying = false;
              isOtherLayerTrying = true;
            } else {
              if (isOtherLayerTrying) {
                console.log("--------------------------");
                channel.push(`web:try_to_connect_again_remote_master`, {
                  ip: ip,
                  remote_node_ip: remoteNodeIp,
                  ice_config_control_counter: iceConfigsControlCounter,
                });
                isOtherLayerTrying = false;
                return;
              }
              if (otherMasterPeerLayer <= iceConfigs.length) {
                channel.push(`web:updated_peer_connection`, {
                  iceConfigsControlCounter: otherMasterPeerLayer,
                  receiver: remoteNodeIp,
                  sender: ip,
                });
                peerConnection = await this.peerConnectionCreatorMasterPeers(
                  channel,
                  remoteNodeIp,
                  remoteNodeId,
                  iceConfigsControlCounter
                );
                this.createDCSendOfferToOtherMasterPeers(
                  channel,
                  peerConnection,
                  remoteNodeId,
                  remoteNodeIp
                );
                otherMasterPeerLayer = otherMasterPeerLayer + 1;
                isOtherLayerTrying = true;
              } else {
                otherMasterPeerLayer = 1;
                isOther = false;
                isFirstLayerTrying = true;
              }
            }
            console.log("otherMasterPeerLayer: ", otherMasterPeerLayer);

            stunRetryCount = stunRetryCount + 1;
            console.log("OLD MASTER SEND TRY REQUEST");
            console.log(
              "Old MASTER iceConfigsControlCounter: ",
              iceConfigsControlCounter
            );
            return;
          } else {
            stunRetryCount = stunRetryCount + 1;
            if (stunRetryCount > 3) {
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
            }
            this.createDCSendOfferToOtherMasterPeers(
              channel,
              peerConnection,
              remoteNodeId,
              remoteNodeIp
            );
            // cleanConnection();
            console.log("OLD MASTER CREATE DATA CHANNEL");
            console.log(
              "Old MASTER iceConfigsControlCounter: ",
              iceConfigsControlCounter
            );
            isOther = true;
          }
          console.log("stunRetryCount: ", stunRetryCount);
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
                clearInterval(connectionCheckingInterval);
                updateConnectionType();
                // connectionCheckingInterval = checkConnectionInterval();
              } else {
                console.log("Message verification failed");
                clearInterval(connectionCheckingInterval);
                cleanConnection();
              }
            }, 800);
          }, 50);
        }
      }, retryTime);

    let lastTotalSendCount = 0;
    let lastTotalReceiveCount = 0;
    connectionRetry = startRetryInterval();

    const checkConnectionInterval = () =>
      setInterval(() => {
        // console.log("dataChannel.readyState: ", dataChannel.readyState);
        // console.log("iceConfigsControlCounter: ", iceConfigsControlCounter);
        if (
          dataChannel.readyState !== "open" &&
          iceConfigsControlCounter >= iceConfigs.length
        ) {
          iceConfigsControlCounter = 0;
          cleanConnection();
          clearInterval(connectionRetry);
          clearInterval(checkConnectionInterval);
          startRetryInterval();
          console.log("Disconnected with MASTER: ", remoteNodeId);
        } else {
          const { remoteMasterPeers } = this.state;
          for (let index = 0; index <= remoteMasterPeers.length; index++) {
            const { machine_id } = remoteMasterPeers[index];
            if (machine_id === remoteNodeId) {
              try {
                const {
                  totalSendMessageCount,
                  totalReceiveMessageCount,
                } = remoteMasterPeers[index];
                // console.log("lastTotalSendCount: ", lastTotalSendCount);
                // console.log("lastTotalReceiveCount: ", lastTotalReceiveCount);
                // console.log("totalSendMessageCount: ", totalSendMessageCount);
                // console.log(
                //   "totalReceiveMessageCount: ",
                //   totalReceiveMessageCount
                // );
                if (
                  lastTotalSendCount === totalSendMessageCount ||
                  lastTotalReceiveCount === totalReceiveMessageCount
                ) {
                  iceConfigsControlCounter = 0;
                  cleanConnection();
                  clearInterval(connectionRetry);
                  clearInterval(checkConnectionInterval);
                  startRetryInterval();
                } else {
                  if (totalSendMessageCount && totalReceiveMessageCount) {
                    lastTotalSendCount = totalSendMessageCount;
                    lastTotalReceiveCount = totalReceiveMessageCount;
                  }
                }
              } catch (error) {
                lastTotalSendCount = 0;
                lastTotalReceiveCount = 0;
              }
              break;
            }
          }
          console.log("Connected and running with MASTER: ", remoteNodeId);
        }
      }, 5000);

    channel.on(`web:remove_${ip}`, (data) => {
      if (data.machine_id === remoteNodeId) {
        console.log("Master is removed: ", remoteNodeId);
        clearInterval(connectionRetry);
        clearInterval(connectionCheckingInterval);
      }
    });

    channel.on(`web:master_is_removed`, async ({ ip, machine_id }) => {
      if (machine_id === remoteNodeId) {
        console.log("Clearing interval");
        clearInterval(connectionRetry);
        iceConfigsControlCounter = 0;
        cleanConnection();
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
        for (let index = 0; index <= messagesFromMastersPeers.length; index++) {
          const { message } = messagesFromMastersPeers[index];
          if (message.split("_")[0] === remoteNodeId) {
            console.log("Verified------------");
            connection = true;
            break;
          }
        }
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
            console.log("oops...error");
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
    let datachannel;
    let verifyMessage = false;
    let peerConnection = await this.lanPeerConnectionCreator(
      channel,
      ip,
      masterId,
      childId,
      iceConfigsControlCounter
    );

    const updateConnectionType = () => {
      let iceServerType = this.getIceServerType(iceConfigsControlCounter);
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
          if (message === masterId) {
            verifyMessage = true;
          }
        });
        console.log("verifyMessage: ", verifyMessage);
        if (verifyMessage) {
          channel.push("web:verification_received_lan_peer", {
            child_id: childId,
            master_id: masterId,
          });
          updateConnectionType();
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
        // dataChannel = this.lanPeerCreateDataChannel(peerConnection, masterId);
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        channel.push(`web:send_offer_to_master`, {
          child_id: childId,
          offer_for_master: JSON.stringify(offer),
          master_id: masterId,
          ip,
        });
        console.log("CHILD SEND OFFER");
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
            console.log("oops...error");
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
    const { machineId, ip } = this.state;
    channel.on(
      `web:make_me_master_${machineId}`,
      async ({ ip: currentIp, lan_peers, remote_masters_peers }) => {
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
    let messageInterval = null;
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
      if (type === "MASTER") {
        const { lanPeers } = this.state;
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

  hhmmss = (secs) => {
    var minutes = Math.floor(secs / 60);
    secs = secs % 60;
    var hours = Math.floor(minutes / 60);
    minutes = minutes % 60;
    return `${hours}:${minutes}:${secs}`;
    // return pad(hours)+":"+pad(minutes)+":"+pad(secs); for old browsers
  };

  lanPeerCreateDataChannel = (peerConnection, lanPeerId) => {
    const { dataChannelOptions } = this.state;
    const dataChannel = peerConnection.createDataChannel(
      "MyDataChannel",
      dataChannelOptions
    );
    let messageInterval = null;
    let timeInterval = null;
    dataChannel.onopen = () => {
      console.log("LanPeer Data Channel Is Open");
      const {
        lanPeersWebRtcConnections,
        lanPeers,
        machineId,
        momentFormat,
        messageSendTime,
      } = this.state;
      dataChannel.send(machineId);
      let verifyCount = 0;
      messageInterval = setInterval(() => {
        dataChannel.send(`${machineId}_${verifyCount}`);
        verifyCount = verifyCount + 1;
        const { lanPeers } = this.state;
        const updatedPeers = lanPeers.map((node) => {
          if (node.machine_id === lanPeerId) {
            if (node.totalSendMessageCount !== undefined) {
              node.totalSendMessageCount =
                parseInt(node.totalSendMessageCount) + 1;
            } else {
              node.totalSendMessageCount = 0;
            }
            node.lastMessageSendTime = moment().format(momentFormat);
          }
          return node;
        });
        this.setState({
          lanPeers: updatedPeers,
        });
      }, messageSendTime);
      const lanUpdatedPeers = lanPeers.map((node) => {
        if (node.machine_id === lanPeerId) {
          node.connectionTime = moment().format(momentFormat);
        }
        return node;
      });
      this.setState({
        lanPeers: lanUpdatedPeers,
      });

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
      let totalSecondTimeCount = 0;
      timeInterval = setInterval(() => {
        const { lanPeers } = this.state;
        const updatedPeers = lanPeers.map((node) => {
          if (node.machine_id === lanPeerId) {
            totalSecondTimeCount = totalSecondTimeCount + 1;
            node.totalConnectionTime = this.hhmmss(totalSecondTimeCount);
          }
          return node;
        });
        this.setState({
          lanPeers: updatedPeers,
        });
      }, 1000);
    };
    dataChannel.onerror = function (error) {
      console.log("Error:", error);
      clearInterval(messageInterval);
      clearInterval(timeInterval);
    };
    let verifyCount = 0;
    let totalVerified = 0;
    let isFirst = true;
    dataChannel.onmessage = (event) => {
      const {
        messageFromLanPeers,
        lanPeers,
        momentFormat,
        messageVerifyTime,
      } = this.state;
      const updatedPeers = lanPeers.map((node) => {
        if (node.machine_id === lanPeerId) {
          if (node.totalReceiveMessageCount !== undefined) {
            node.totalReceiveMessageCount =
              parseInt(node.totalReceiveMessageCount) + 1;
          } else {
            node.totalReceiveMessageCount = 0;
          }
          node.lastMessageReceiveTime = moment().format(momentFormat);
        }
        return node;
      });
      this.setState({
        messageFromLanPeers: [...messageFromLanPeers, { message: event.data }],
        lanPeers: updatedPeers,
      });
      setTimeout(() => {
        const { messageFromLanPeers, lanPeers } = this.state;
        const filteredMessages = messageFromLanPeers.filter(
          ({ message }) => message !== `${lanPeerId}_${verifyCount - 1}`
        );
        verifyCount++;
        if (filteredMessages.length !== messageFromLanPeers.length) {
          const updatedPeers = lanPeers.map((node) => {
            if (node.machine_id === lanPeerId) {
              if (node.totalVerifiedMessages !== undefined) {
                node.totalVerifiedMessages =
                  parseInt(node.totalVerifiedMessages) + 1;
              } else {
                node.totalVerifiedMessages = totalVerified;
              }
              node.currentMessage = `${verifyCount}__${lanPeerId.slice(0, 5)}`;
            }
            return node;
          });
          totalVerified++;
          this.setState({
            messageFromLanPeers: filteredMessages,
            lanPeers: updatedPeers,
          });
        } else {
          const updatedPeers = lanPeers.map((node) => {
            if (node.machine_id === lanPeerId) {
              if (node.totalUnverifiedMessages !== undefined) {
                node.totalUnverifiedMessages =
                  parseInt(node.totalUnverifiedMessages) + 1;
              } else {
                node.totalUnverifiedMessages = 0;
              }

              node.currentMessage = `${verifyCount}__${lanPeerId.slice(0, 5)}`;
            }
            return node;
          });
          this.setState({
            lanPeers: updatedPeers,
          });
        }
      }, messageVerifyTime);
      isFirst = false;
    };
    return dataChannel;
  };

  onDataChannelForLanPeer = (peerConnection, event, lanPeerId) => {
    const dataChannel = event.channel;
    let messageInterval = null;
    let timeInterval = null;
    console.log("ondatachannel: ", dataChannel);
    dataChannel.onopen = (event) => {
      const {
        lanPeersWebRtcConnections,
        lanPeers,
        machineId,
        momentFormat,
        messageSendTime,
      } = this.state;
      dataChannel.send(machineId);
      let verifyCount = 0;
      messageInterval = setInterval(() => {
        dataChannel.send(`${machineId}_${verifyCount}`);
        verifyCount = verifyCount + 1;
        const { lanPeers } = this.state;
        const lanUpdatedPeers = lanPeers.map((node) => {
          if (node.machine_id === lanPeerId) {
            if (node.totalSendMessageCount !== undefined) {
              node.totalSendMessageCount =
                parseInt(node.totalSendMessageCount) + 1;
            } else {
              node.totalSendMessageCount = 0;
            }
            node.lastMessageSendTime = moment().format(momentFormat);
          }
          return node;
        });
        this.setState({
          lanPeers: lanUpdatedPeers,
        });
      }, messageSendTime);
      const updatedPeers = lanPeers.map((node) => {
        if (node.machine_id === lanPeerId) {
          node.connectionTime = moment().format(momentFormat);
        }
        return node;
      });
      this.setState({
        lanPeers: updatedPeers,
      });
      console.log(
        "onDataChannelForLanPeer LanPeer Data Channel Is Open",
        lanPeersWebRtcConnections
      );
      let totalSecondTimeCount = 0;
      timeInterval = setInterval(() => {
        const { lanPeers } = this.state;
        const updatedPeers = lanPeers.map((node) => {
          if (node.machine_id === lanPeerId) {
            totalSecondTimeCount = totalSecondTimeCount + 1;
            node.totalConnectionTime = this.hhmmss(totalSecondTimeCount);
          }
          return node;
        });
        this.setState({
          lanPeers: updatedPeers,
        });
      }, 1000);
      const lanWebRtcupdatedPeers = lanPeersWebRtcConnections.map((node) => {
        if (node.machine_id === lanPeerId) {
          node.peerDataChannel = dataChannel;
          node.peerConnection = peerConnection;
        }
        return node;
      });
      this.setState({
        lanPeersWebRtcConnections: lanWebRtcupdatedPeers,
      });
    };
    dataChannel.onerror = function (error) {
      console.log("Error:", error);
      clearInterval(messageInterval);
      clearInterval(timeInterval);
    };
    let totalVerified = 0;
    let verifyCount = 0;
    let isFirst = true;
    dataChannel.onmessage = (event) => {
      const {
        messageFromLanPeers,
        lanPeers,
        momentFormat,
        messageVerifyTime,
      } = this.state;
      setTimeout(() => {
        const { messageFromLanPeers, lanPeers } = this.state;
        const filteredMessages = messageFromLanPeers.filter(
          ({ message }) => message !== `${lanPeerId}_${verifyCount - 1}`
        );
        verifyCount++;
        if (filteredMessages.length !== messageFromLanPeers.length) {
          const updatedPeers = lanPeers.map((node) => {
            if (node.machine_id === lanPeerId) {
              if (node.totalVerifiedMessages !== undefined) {
                node.totalVerifiedMessages =
                  parseInt(node.totalVerifiedMessages) + 1;
              } else {
                node.totalVerifiedMessages = totalVerified;
              }
              node.currentMessage = `${verifyCount}__${lanPeerId.slice(0, 5)}`;
            }
            return node;
          });
          totalVerified++;
          this.setState({
            messageFromLanPeers: filteredMessages,
            lanPeers: updatedPeers,
          });
        } else {
          const updatedPeers = lanPeers.map((node) => {
            if (node.machine_id === lanPeerId) {
              if (node.totalUnverifiedMessages !== undefined) {
                node.totalUnverifiedMessages =
                  parseInt(node.totalUnverifiedMessages) + 1;
              } else {
                node.totalUnverifiedMessages = 0;
              }

              node.currentMessage = `${verifyCount}__${lanPeerId.slice(0, 5)}`;
            }
            return node;
          });
          this.setState({
            lanPeers: updatedPeers,
          });
        }
      }, messageVerifyTime);
      isFirst = false;
      const updatedPeers = lanPeers.map((node) => {
        if (node.machine_id === lanPeerId) {
          if (node.totalReceiveMessageCount !== undefined) {
            node.totalReceiveMessageCount =
              parseInt(node.totalReceiveMessageCount) + 1;
          } else {
            node.totalReceiveMessageCount = 0;
          }
          node.lastMessageReceiveTime = moment().format(momentFormat);
        }
        return node;
      });
      this.setState({
        messageFromLanPeers: [...messageFromLanPeers, { message: event.data }],
        lanPeers: updatedPeers,
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
    const { iceConfigs, ip, retryTime } = this.state;
    let iceConfigsControlCounter = 0;
    let connection = false;
    let dataChannel = null;
    let connectionRetry;
    let isOther = true;
    let peerConnection = await this.lanPeerConnectionCreator(
      channel,
      childIp,
      masterId,
      childId,
      iceConfigsControlCounter
    );
    const cleanConnection = () => {
      try {
        dataChannel.close();
        peerConnection.close();
      } catch (error) {
        console.error(error);
      }
    };

    const startRetryInterval = () =>
      setInterval(async () => {
        if (dataChannel.readyState !== "open") {
          if (iceConfigsControlCounter >= iceConfigs.length) {
            console.log("ALL Have Been Tried And Reset");
            // clearInterval(connectionRetry);
            cleanConnection();
            clearInterval(checkConnectionInterval);
            isOther = true;
            iceConfigsControlCounter = 0;
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
            cleanConnection();
            peerConnection = await this.lanPeerConnectionCreator(
              channel,
              ip,
              masterId,
              childId,
              iceConfigsControlCounter
            );
            dataChannel = this.lanPeerCreateDataChannel(
              peerConnection,
              childId
            );
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
                updateConnectionType();
                clearInterval(connectionRetry);
              } else {
                console.log("message verification failed");
                cleanConnection();
              }
            }, 500);
          }, 50);
        }
      }, retryTime);

    let lastTotalSendCount = 0;
    let lastTotalReceiveCount = 0;
    connectionRetry = startRetryInterval();
    const checkConnectionInterval = setInterval(() => {
      // console.log("dataChannel.readyState: ", dataChannel.readyState);
      // console.log("iceConfigsControlCounter: ", iceConfigsControlCounter);
      if (
        dataChannel.readyState !== "open" &&
        iceConfigsControlCounter >= iceConfigs.length
      ) {
        cleanConnection();
        startRetryInterval();
        iceConfigsControlCounter = 0;
        console.log("Disconnected with: ", childId);
      } else {
        const { lanPeers } = this.state;
        for (let index = 0; index <= lanPeers.length; index++) {
          const { machine_id } = lanPeers[index];
          if (machine_id === childId) {
            try {
              const {
                totalSendMessageCount,
                totalReceiveMessageCount,
              } = lanPeers[index];
              // console.log("lastTotalSendCount: ", lastTotalSendCount);
              // console.log("lastTotalReceiveCount: ", lastTotalReceiveCount);
              // console.log("totalSendMessageCount: ", totalSendMessageCount);
              // console.log(
              //   "totalReceiveMessageCount: ",
              //   totalReceiveMessageCount
              // );
              if (
                lastTotalSendCount === totalSendMessageCount ||
                lastTotalReceiveCount === totalReceiveMessageCount
              ) {
                iceConfigsControlCounter = 0;
                cleanConnection();
                clearInterval(checkConnectionInterval);
                clearInterval(connectionRetry);
                startRetryInterval();
              } else {
                lastTotalSendCount = totalSendMessageCount;
                lastTotalReceiveCount = totalReceiveMessageCount;
              }
            } catch (error) {
              lastTotalSendCount = 0;
              lastTotalReceiveCount = 0;
            }
            break;
          }
        }
        console.log("Connected and running with: ", childId);
      }
    }, retryTime);

    const updateConnectionType = () => {
      let iceServerType = this.getIceServerType(iceConfigsControlCounter);
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

    channel.on(`web:remove_${ip}`, (data) => {
      if (data.machine_id === childId) {
        console.log("Child is removed: ", childId);
        clearInterval(connectionRetry);
        clearInterval(checkConnectionInterval);
      }
    });

    channel.on(
      `web:verification_received_from_child_${masterId}_${childId}`,
      ({ ip: currentIp, remote_master_ip }) => {
        const { messageFromLanPeers } = this.state;
        console.log("Verifying child message: ", messageFromLanPeers);
        console.log("childId: ", childId);
        messageFromLanPeers.map(({ message }) => {
          if (message === childId) {
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
            console.log("oops...error", error);
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
    await setNodeId();
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
      // messagesFromChildsPeers,
    } = this.state;
    const style =
      type === "MASTER"
        ? {
            backgroundColor: "black",
          }
        : {
            backgroundColor: "white",
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
              className="form-control"
            />
            <button
              className="btn btn-outline-light m-2"
              onClick={this.handleMessageToChilds}
            >
              Send To Child
            </button>
            <button
              className="btn btn-outline-light m-2"
              onClick={this.handleMessageToMasters}
              id="sendToMaster"
            >
              Send To Masters
            </button>
            <hr />
            <div
              style={{
                width: "100%",
                backgroundColor: "#666666",
                color: "white",
              }}
            >
              <Table
                remotePeers={remoteMasterPeers}
                lanPeers={lanPeers}
                masterPeersMessages={messagesFromMastersPeers}
                lanPeersMessages={messageFromLanPeers}
              />
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
              className="form-control"
            />
            <button
              className="btn btn-outline-dark m-2"
              onClick={this.handleMessageToLanMaster}
            >
              Send To Master
            </button>
            <RenderLanPeers
              lanPeers={lanPeers}
              ip={ip}
              messages={messageFromLanPeers}
            />
          </div>
        )}
      </div>
    );
  }
}

export default Home;
