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
        document
          .querySelector("#createPeer")
          .addEventListener("click", (event) => {
            this.handleCreatePeer(channel);
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

  handleCreatePeer = (channel) => {
    var configuration = {
      iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
    };

    const type = localStorage.getItem("type");
    const myConnection = new webkitRTCPeerConnection(configuration, {
      optional: [{ RtpDataChannels: true }],
    });
    // myConnection = new webkitRTCPeerConnection();

    myConnection.onicegatheringstatechange = function (event) {
      console.log("ICE State Change: ", event);
    };

    if (type === "CHILD") {
      myConnection.ondatachannel = function (event) {
        const dataChannel = event.channel;
        console.log("Channel Successfull.......", dataChannel);

        dataChannel.onopen = function (event) {
          console.log("myDataChannel is open", dataChannel);
          console.log("Ready........");
        };
        dataChannel.onerror = function (error) {
          console.log("Error:", error);
        };

        dataChannel.onmessage = function (event) {
          console.log("Got message:", event.data);
        };
      };
    } else {
      const dataChannel = myConnection.createDataChannel(
        "myDataChannel",
        dataChannelOptions
      );
      dataChannel.onopen = function (event) {
        console.log("myDataChannel is open", dataChannel);
        console.log("Ready........");
      };
      dataChannel.onerror = function (error) {
        console.log("Error:", error);
      };

      dataChannel.onmessage = function (event) {
        console.log("Got message:", event.data);
      };

      document
        .querySelector("#sendData")
        .addEventListener("click", async () => {
          console.log("dataChannel: ", dataChannel);
        });
    }

    channel.on("web:receive_candidate", async ({ candidate }) => {
      await myConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log("ICE candidate Added", candidate);
    });

    channel.on("web:offer_from_master", async ({ offer }) => {
      if (type === "CHILD") {
        await myConnection.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        console.log("Offer Received", offer);
      }
    });

    channel.on("web:answer_from_child", async ({ answer }) => {
      if (type === "MASTER") {
        await myConnection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        console.log("Answer Received", answer);
      }
    });

    //setup ice handling
    //when the browser finds an ice candidate we send it to another peer
    myConnection.onicecandidate = function (event) {
      if (event.candidate) {
        console.log("candidate request", event.candidate, type);
        channel.push("web:add_ice_candidate", { candidate: event.candidate });
      }
    };

    myConnection.onnegotiationneeded = () => {
      console.log("Negotiation needed ", type);
    };

    document.querySelector("#sendOffer").addEventListener("click", async () => {
      await myConnection.createOffer(
        async function (offer) {
          channel.push("web:send_offer_to_child", { offer });
          await myConnection.setLocalDescription(offer);
          console.log("Offer sended", offer);
        },
        function (error) {
          alert("An error has occurred.");
        }
      );
    });

    document
      .querySelector("#sendAnswer")
      .addEventListener("click", async () => {
        await myConnection.createAnswer(
          async (answer) => {
            await myConnection.setLocalDescription(answer);
            channel.push("web:send_answer_to_master", { answer });
            console.log("Answer sended", answer);
          },
          function (error) {
            alert("oops...error");
          }
        );
      });

    console.log("RTCPeerConnection object was created");
    console.log(myConnection);

    myConnection.onconnectionstatechange = (event) => {
      console.log("State Change: ", event);
    };

    console.log("Ready for offer.......");
    const dataChannelOptions = {
      reliable: true,
    };
  };

  render() {
    return (
      <div>
        <button id="createPeer">Create Peer Connection</button>
        <button id="sendOffer">Send Offer</button>
        <button id="sendAnswer">Send Answer</button>
        <button id="sendData">Send Data</button>
      </div>
    );
  }
}

export default Home;
