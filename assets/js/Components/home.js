import React from "react";

import { getMyIp } from "../utils/index";
import {
  setIdIfRequired,
  getMachineId,
  setNodeType,
  getNodeType,
} from "../utils/indexedDbUtils";
import { configureChannel } from "../socket";
import { formatCountdown } from "antd/lib/statistic/utils";

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
    const { channel, socket } = await configureChannel();
    channel
      .join()
      .receive("ok", async () => {
        const type = localStorage.getItem("type");
        this.setState({
          type,
        });
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

  createMyDataChannel = (peerConnection, dataChannelName) => {
    const dataChannel = peerConnection.createDataChannel(dataChannelName);
    dataChannel.onopen = function (event) {
      console.log("data channel is open", event);
    };

    dataChannel.onmessage = function (event) {
      console.log("new message: " + dataChannelName, event.data);
    };

    dataChannel.onclose = function () {
      console.log("data channel closed");
    };

    document
      .getElementById("sendMessageToChildBtn")
      .addEventListener("click", () => {
        const masterText = document.querySelector("#masterText").value;
        dataChannel.send(masterText);
      });
  };

  handlePeer = async (channel) => {
    const { type } = this.state;
    const peerConnectionConfig = {
      // iceServers: [
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
      // "turn:ss-turn1.xirsys.com:80?transport=udp",
      // "turn:ss-turn1.xirsys.com:3478?transport=udp",
      // "turn:ss-turn1.xirsys.com:80?transport=tcp",
      // "turn:ss-turn1.xirsys.com:3478?transport=tcp",
      // "turns:ss-turn1.xirsys.com:443?transport=tcp",
      //     "turns:ss-turn1.xirsys.com:5349?transport=tcp",
      //   ],
      // },
      // ],
    };
    if (type === "MASTER") {
      const peerConnection = new RTCPeerConnection({
        // iceServers: [
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
        //   {
        //     username:
        //       "ZyUlEkJOyQDmJFZ0nkKcAKmrrNayVm-rutt8RNHa1EQe_NQADY6Rk4sM2zVstYo_AAAAAF9xt7VhbGl2YXRlY2g=",
        //     credential: "820f7cf4-0173-11eb-ad8b-0242ac140004",
        //     urls: [
        //       // "turn:ss-turn1.xirsys.com:80?transport=udp",
        //       // "turn:ss-turn1.xirsys.com:3478?transport=udp",
        //       // "turn:ss-turn1.xirsys.com:80?transport=tcp",
        //       // "turn:ss-turn1.xirsys.com:3478?transport=tcp",
        //       // "turns:ss-turn1.xirsys.com:443?transport=tcp",
        //       "turns:ss-turn1.xirsys.com:5349?transport=tcp",
        //     ],
        //   },
        // ],
      });
      // const peerConnection = new RTCPeerConnection(peerConnectionConfig);
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
      // peerConnection.onnegotiationneeded = async () => {
      //   console.log("On negotiation Needed");
      //   const offer = await peerConnection.createOffer();
      //   await peerConnection.setLocalDescription(offer);
      //   channel.push("web:send_offer", { offer: JSON.stringify(offer) });
      //   console.log("Master Send Offer: ", offer);
      // };
      peerConnection.onicecandidate = (event) => {
        console.log("Master Ice event: ", event.candidate);
        if (event.candidate) {
          channel.push("web:send_ice_to_child", {
            candidate: JSON.stringify(event.candidate),
          });
        }
      };
      this.createMyDataChannel(peerConnection, "dc_1");
      this.createMyDataChannel(peerConnection, "dc_2");
      this.createMyDataChannel(peerConnection, "dc_3");
      this.createMyDataChannel(peerConnection, "dc_4");
      this.createMyDataChannel(peerConnection, "dc_5");
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      channel.push("web:send_offer", { offer: JSON.stringify(offer) });
      console.log("Master Send Offer: ", offer);
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

    document
      .getElementById("sendMessageToMasterBtn")
      .addEventListener("click", () => {
        const childText = document.querySelector("#childText").value;
        dataChannel.send(childText);
      });
  };

  render() {
    const { type } = this.state;
    return (
      <div>
        <h1>
          This is <i>{type}</i>
        </h1>
        <button id="getState">Get Status</button>
        {type === "MASTER" && (
          <div>
            <input type="text" id="masterText" />
            <button id="sendMessageToChildBtn">Send Message To Child</button>
          </div>
        )}
        {type === "CHILD" && (
          <div>
            <input type="text" id="childText" />
            <button id="sendMessageToMasterBtn">Send Message To Master</button>
          </div>
        )}
      </div>
    );
  }
}

export default Home;
