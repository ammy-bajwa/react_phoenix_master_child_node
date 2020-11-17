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
    channel: null,
  };
  constructor(props) {
    super(props);
  }

  // async componentWillUnmount() {
  //   await setNodeType("");
  // }

  async componentDidMount() {
    const { channel, socket } = await configureChannel();
    channel
      .join()
      .receive("ok", async () => {
        this.handlePeer(channel);
      })
      .receive("error", ({ reason }) => {
        alert("Something wrong with socket");
        console.log("failed join", reason);
      })
      .receive("timeout", () => {
        alert("Networking issue. Still waiting....");
      });
  }

  createDataChannel = (peerConnection) => {
    const dataChannel = peerConnection.createDataChannel("MyDataChannel");
    console.log(dataChannel);
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
  };

  createAndSendOffer = async (peerConnection, channel) => {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log("offer sended", offer);
    channel.push("web:send_offer_to_child", {
      offer: JSON.stringify(offer),
    });
  };

  handlePeer = (channel) => {
    const type = localStorage.getItem("type");

    let peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.test.com:19000" }],
    });

    channel.on("web:receive_candidate", async ({ candidate }) => {
      console.log("ICE candidate Added", type + " ", candidate);
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });

    if (type === "CHILD") {
      channel.on("web:offer_from_master", async ({ offer }) => {
        if (type === "CHILD") {
          const receivedOffer = JSON.parse(offer);
          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(receivedOffer)
          );
          console.log("Offer Received", typeof receivedOffer);
          await peerConnection.createAnswer(
            async (answer) => {
              await peerConnection.setLocalDescription(answer);
              channel.push("web:send_answer_to_master", {
                answer: JSON.stringify(answer),
              });
              console.log("Answer sended", answer);
            },
            function (error) {
              alert("oops...error");
            }
          );
        }
      });
    } else {
      channel.on("web:answer_from_child", async ({ answer }) => {
        if (type === "MASTER") {
          const receivedAnswer = JSON.parse(answer);
          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(receivedAnswer)
          );
          console.log("Answer Received", receivedAnswer);
        }
      });
    }

    peerConnection.onnegotiationneeded = async () => {
      console.log("onnegotiationneeded", type);
      if (type === "MASTER") {
        await this.createAndSendOffer(peerConnection, channel);
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
    };

    peerConnection.onicecandidate = (event) => {
      console.log("iceEvent fired: ", event.candidate);
      if (event.candidate) {
        console.log("candidate request", event.candidate, type);
        channel.push("web:add_ice_candidate", { candidate: event.candidate });
      }
    };
    document.querySelector("#sendOffer").addEventListener("click", async () => {
      await this.createAndSendOffer(peerConnection, channel);
    });

    document.querySelector("#sendData").addEventListener("click", async () => {
      this.createDataChannel(peerConnection);
    });
    document.querySelector("#getState").addEventListener("click", async () => {
      console.log("PeerConn", peerConnection);
    });
  };

  render() {
    return (
      <div>
        <button id="sendOffer">Send Offer</button>
        <button id="sendData">Send Data</button>
        <button id="getState">Get Status</button>
      </div>
    );
  }
}

export default Home;
