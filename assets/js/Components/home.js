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
    type: "",
  };
  constructor(props) {
    super(props);
  }

  // async componentWillUnmount() {
  //   await setNodeType("");
  // }

  async componentDidMount() {
    // const { channel, socket } = await configureChannel();
    // channel
    //   .join()
    //   .receive("ok", async () => {
    //     const type = localStorage.getItem("type");
    //     this.setState({
    //       type,
    //     });
    //     this.handlePeer(channel);
    //   })
    //   .receive("error", ({ reason }) => {
    //     alert("Something wrong with socket");
    //     console.log("failed join", reason);
    //   })
    //   .receive("timeout", () => {
    //     alert("Networking issue. Still waiting....");
    //   });

    document.getElementById("createOfferButton").onclick = function () {
      createOffer();
    };

    document.getElementById("answerButton").onclick = function () {
      createAnswer();
    };

    document.getElementById("sendButton").onclick = function () {
      sendMessage();
    };

    const peerConnectionConfig = {
      iceServers: [
        // {
        //   urls: ["stun:avm4962.com:3478", "stun:avm4962.com:5349"],
        // },
        { urls: ["stun:ss-turn1.xirsys.com"] },
        // {
        //   username: "TuR9Us3r",
        //   credential:
        //     "T!W779M?Vh#5ewJcT=L4v6NcUE*=4+-*fcy+gLAS$^WJgg+wq%?ca^Br@D%Q2MVpyV2sqTcHmUAdP2z4#=S8FAb*3LKGT%W^4R%h5Tdw%D*zvvdWTzSA@ytvEH!G#^99QmW3*5ps^jv@aLdNSfyYKBUS@CJ#hxSp5PRnzP+_YDcJHN&ng2Q_g6Z!+j_3RD%vc@P4g%tFuAuX_dz_+AQNe$$$%w7A4sW?CDr87ca^rjFBGV??JR$!tCSnZdAJa6P8",
        //   urls: ["turn:avm4962.com:3478?transport=tcp", "turn:avm4962.com:5349?transport=tcp"],
        // },
        // {
        //   username:
        //     "ZyUlEkJOyQDmJFZ0nkKcAKmrrNayVm-rutt8RNHa1EQe_NQADY6Rk4sM2zVstYo_AAAAAF9xt7VhbGl2YXRlY2g=",
        //   credential: "820f7cf4-0173-11eb-ad8b-0242ac140004",
        //   urls: [
        //     "turn:ss-turn1.xirsys.com:80?transport=udp",
        //     "turn:ss-turn1.xirsys.com:3478?transport=udp",
        //     "turn:ss-turn1.xirsys.com:80?transport=tcp",
        //     "turn:ss-turn1.xirsys.com:3478?transport=tcp",
        //     "turns:ss-turn1.xirsys.com:443?transport=tcp",
        //     "turns:ss-turn1.xirsys.com:5349?transport=tcp",
        //   ],
        // },
      ],
    };

    let peerConnection = new RTCPeerConnection(peerConnectionConfig);
    let dataChannel = null;

    function createOffer() {
      dataChannel = peerConnection.createDataChannel("dataChannel");
      dataChannelHandlers();

      peerConnection
        .createOffer()
        .then(function (description) {
          console.log("createOffer ok ");
          peerConnection
            .setLocalDescription(description)
            .then(function () {
              console.log("offer: ", description);
              setTimeout(function () {
                console.log(
                  "peerConnection.iceGatheringState = " +
                    peerConnection.iceGatheringState
                );

                document.getElementById("offerInput").value = JSON.stringify(
                  peerConnection.localDescription
                );

                if (peerConnection.iceGatheringState == "complete") {
                  return;
                } else {
                  console.log("after iceGathering Timeout");
                  document.getElementById("offerInput").value = JSON.stringify(
                    peerConnection.localDescription
                  );
                }
              }, 2000);
              console.log("setLocalDescription ok");
            })
            .catch(handleCreateDescriptionError);
        })
        .catch(handleCreateDescriptionError);
    }

    function createAnswer() {
      const remoteOffer = new RTCSessionDescription(
        JSON.parse(document.getElementById("answerOfferInput").value)
      );

      console.log("remoteOffer:\n", remoteOffer);

      peerConnection
        .setRemoteDescription(remoteOffer)
        .then(function () {
          console.log("setRemoteDescription ok");

          if (remoteOffer.type == "offer") {
            peerConnection
              .createAnswer()
              .then(function (description) {
                console.log("createAnswer:\n", description);

                peerConnection
                  .setLocalDescription(description)
                  .then(function () {
                    document.getElementById(
                      "answerOfferInput"
                    ).value = JSON.stringify(peerConnection.localDescription);
                  })
                  .catch(handleCreateDescriptionError);
              })
              .catch(handleCreateDescriptionError);
          }
        })
        .catch(handleCreateDescriptionError);
    }

    function handleCreateDescriptionError(error) {
      console.log("Unable to create an offer: " + error.toString());
    }

    peerConnection.onicecandidate = function (event) {
      const cand = event.candidate;
      if (!cand) {
        console.log("iceGatheringState complete:");
        console.log(peerConnection.localDescription.sdp);
        document.getElementById("offerInput").value = JSON.stringify(
          peerConnection.localDescription
        );
      } else {
        console.log(cand.candidate);
      }
    };

    peerConnection.oniceconnectionstatechange = function () {
      if (peerConnection) {
        console.log("oniceconnectionstatechange:");
        console.log(peerConnection.iceConnectionState);

        if (peerConnection.iceConnectionState == "disconnected") {
          alert("You are disconnected with from partner");
        }
      }
    };

    peerConnection.onconnection = function (event) {
      console.log("onconnection ", event);
    };

    peerConnection.ondatachannel = function (event) {
      if (event.channel.label == "dataChannel") {
        console.log("dataChannel received: ", event);
        dataChannel = event.channel;
        dataChannelHandlers();
      }
    };

    function dataChannelHandlers() {
      console.log(
        "dataChannelHandlers: " + JSON.stringify(dataChannel, null, "\t")
      );
      dataChannel.onopen = function (event) {
        console.log("data channel is open", event);
        document.getElementById("channelStatus").innerText = event.type;
      };

      dataChannel.onmessage = function (event) {
        console.log("new message:", event.data);

        document.getElementById("receivebox").innerHTML +=
          "<pre class=sent>" + event.data + "<" + "/pre>";
      };

      dataChannel.onclose = function () {
        console.log("data channel closed");
        document.getElementById("channelStatus").innerText = "closed";
      };
    }

    function sendMessage() {
      var messageInputBox = document.getElementById("message");
      const message = messageInputBox.value;

      dataChannel.send(message);

      // Clear the input box and re-focus it, so that we're
      // ready for the next message.
      messageInputBox.value = "";
      messageInputBox.focus();
    }
  }

  handlePeer = async (channel) => {
    const { type } = this.state;
    const peerConnectionConfig = {
      iceServers: [
        // {
        //   urls: ["stun:avm4962.com:3478", "stun:avm4962.com:5349"],
        // },
        // { urls: ["stun:ss-turn1.xirsys.com"] },
        // {
        //   username: "TuR9Us3r",
        //   credential:
        //     "T!W779M?Vh#5ewJcT=L4v6NcUE*=4+-*fcy+gLAS$^WJgg+wq%?ca^Br@D%Q2MVpyV2sqTcHmUAdP2z4#=S8FAb*3LKGT%W^4R%h5Tdw%D*zvvdWTzSA@ytvEH!G#^99QmW3*5ps^jv@aLdNSfyYKBUS@CJ#hxSp5PRnzP+_YDcJHN&ng2Q_g6Z!+j_3RD%vc@P4g%tFuAuX_dz_+AQNe$$$%w7A4sW?CDr87ca^rjFBGV??JR$!tCSnZdAJa6P8",
        //   urls: [
        //     "turn:avm4962.com:3478?transport=tcp",
        //     "turn:avm4962.com:5349?transport=tcp",
        //   ],
        // },
        // {
        //   username:
        //     "ZyUlEkJOyQDmJFZ0nkKcAKmrrNayVm-rutt8RNHa1EQe_NQADY6Rk4sM2zVstYo_AAAAAF9xt7VhbGl2YXRlY2g=",
        //   credential: "820f7cf4-0173-11eb-ad8b-0242ac140004",
        //   urls: [
        //     "turn:ss-turn1.xirsys.com:80?transport=udp",
        //     "turn:ss-turn1.xirsys.com:3478?transport=udp",
        //     "turn:ss-turn1.xirsys.com:80?transport=tcp",
        //     "turn:ss-turn1.xirsys.com:3478?transport=tcp",
        //     "turns:ss-turn1.xirsys.com:443?transport=tcp",
        //     "turns:ss-turn1.xirsys.com:5349?transport=tcp",
        //   ],
        // },
      ],
    };
    if (type === "MASTER") {
      // const peerConnection = new RTCPeerConnection();
      const peerConnection = new RTCPeerConnection(peerConnectionConfig);
      channel.on("web:receive_ice_from_child", async ({ candidate }) => {
        const parsedCandidate = JSON.parse(candidate);
        console.log("Master Ice is added from child: ", candidate);
        await peerConnection.addIceCandidate(
          new RTCIceCandidate(parsedCandidate)
        );
      });
      channel.on("web:receive_answer", async ({ answer }) => {
        const parsedAnswer = JSON.parse(answer);
        console.log("Master Parsed Answer: ", parsedAnswer);
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(parsedAnswer)
        );
      });
      peerConnection.onnegotiationneeded = async () => {
        console.log("On negotiation Needed");
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        channel.push("web:send_offer", { offer: JSON.stringify(offer) });
      };
      peerConnection.onicecandidate = (event) => {
        console.log("Master Ice event: ", event.candidate);
        if (event.candidate) {
          channel.push("web:send_ice_to_child", {
            candidate: JSON.stringify(event.candidate),
          });
        }
      };
      setTimeout(() => {
        const dataChannel = peerConnection.createDataChannel("dataChannel");
        dataChannel.onopen = function (event) {
          console.log("data channel is open", event);
        };

        dataChannel.onmessage = function (event) {
          console.log("new message:", event.data);
        };

        dataChannel.onclose = function () {
          console.log("data channel closed");
        };
      }, 1000);
      document.getElementById("getState").addEventListener("click", () => {
        console.log("Master Peerconnection: ", peerConnection);
      });
    } else {
      // const peerConnection = new RTCPeerConnection();
      const peerConnection = new RTCPeerConnection(peerConnectionConfig);
      channel.on("web:receive_ice_from_master", async ({ candidate }) => {
        const parsedCandidate = JSON.parse(candidate);
        console.log("Child Ice is added from master: ", candidate);
        await peerConnection.addIceCandidate(
          new RTCIceCandidate(parsedCandidate)
        );
      });
      channel.on("web:receive_offer", async ({ offer }) => {
        const parsedOffer = JSON.parse(offer);
        console.log("parsedOffer: ", parsedOffer);
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(parsedOffer)
        );
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        channel.push("web:send_answer", { answer: JSON.stringify(answer) });
      });
      peerConnection.onicecandidate = (event) => {
        console.log("Child Ice event: ", event.candidate);
        if (event.candidate) {
          channel.push("web:send_ice_to_master", {
            candidate: JSON.stringify(event.candidate),
          });
        }
      };

      peerConnection.ondatachannel = this.ondatachannelHandler;
      document.getElementById("getState").addEventListener("click", () => {
        console.log("Child Peerconnection: ", peerConnection);
      });
    }
  };

  ondatachannelHandler = (event) => {
    const dataChannel = event.channel;
    dataChannel.onopen = function (event) {
      console.log("data channel is open", event);
    };

    dataChannel.onmessage = function (event) {
      console.log("new message:", event.data);
    };

    dataChannel.onclose = function () {
      console.log("data channel closed");
    };
  };

  render() {
    return (
      <div>
        <h3>WebRTC</h3>
        <button id="createOfferButton">Create Offer</button>
        <br />
        <br />
        <textarea rows="10" cols="150" id="offerInput"></textarea>
        <br />
        <br />
        <br />
        <br />
        Paste Remote user Offer
        <br />
        <textarea id="answerOfferInput" rows="10" cols="150"></textarea>
        <br />
        <button id="answerButton">Create Answer for Above Offer</button>
        <br />
        <br />
        <br />
        <div className="messageContainer">
          <h3>Chat</h3>
          <br />
          <span id="channelStatus">Stats: N/A</span>
          <br />
          Enter a message:
          <br />
          <textarea id="message" rows="2" cols="150"></textarea>
          <br />
          <button id="sendButton" name="sendButton">
            Send
          </button>
          <br />
        </div>
        <div
          className="messageContainer"
          id="receivebox"
          style={{
            overflow: "scroll",
          }}
        >
          <p>Messages received:</p>
        </div>
      </div>
    );
  }
}

export default Home;
