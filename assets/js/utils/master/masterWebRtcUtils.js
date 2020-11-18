export const masterCreateWebRtcConObj = (channel, ip, masterId, childId) => {
  const peerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: ["stun:avm4962.com:3478", "stun:avm4962.com:5349"],
      },
      // { urls: ["stun:ss-turn1.xirsys.com"] },
      {
        username: "TuR9Us3r",
        credential:
          "T!W779M?Vh#5ewJcT=L4v6NcUE*=4+-*fcy+gLAS$^WJgg+wq%?ca^Br@D%Q2MVpyV2sqTcHmUAdP2z4#=S8FAb*3LKGT%W^4R%h5Tdw%D*zvvdWTzSA@ytvEH!G#^99QmW3*5ps^jv@aLdNSfyYKBUS@CJ#hxSp5PRnzP+_YDcJHN&ng2Q_g6Z!+j_3RD%vc@P4g%tFuAuX_dz_+AQNe$$$%w7A4sW?CDr87ca^rjFBGV??JR$!tCSnZdAJa6P8",
        urls: [
          "turn:avm4962.com:3478?transport=tcp",
          "turn:avm4962.com:5349?transport=tcp",
        ],
      },
      // {
      //   username:
      //     "ZyUlEkJOyQDmJFZ0nkKcAKmrrNayVm-rutt8RNHa1EQe_NQADY6Rk4sM2zVstYo_AAAAAF9xt7VhbGl2YXRlY2g=",
      //   credential: "820f7cf4-0173-11eb-ad8b-0242ac140004",
      //   urls: [
      // "turn:ss-turn1.xirsys.com:80?transport=udp",
      //     "turn:ss-turn1.xirsys.com:3478?transport=udp",
      // "turn:ss-turn1.xirsys.com:80?transport=tcp",
      // "turn:ss-turn1.xirsys.com:3478?transport=tcp",
      // "turns:ss-turn1.xirsys.com:443?transport=tcp",
      // "turns:ss-turn1.xirsys.com:5349?transport=tcp",
      //   ],
      // },
    ],
  });
  // const peerConnection = new RTCPeerConnection({ iceServers: [] });

  channel.on(
    `web:add_ice_candidate_to_master${ip}`,
    async ({ child_id, candidate }) => {
      const parsedCandidate = JSON.parse(candidate);
      await peerConnection.addIceCandidate(
        new RTCIceCandidate(parsedCandidate)
      );
      console.log("MASTER Added Ice Candidate From Child: ", parsedCandidate);
    }
  );

  channel.on(
    `web:answer_from_child_${ip}`,
    async ({ master_id, answer_for_master, child_id }) => {
      const answerFromChild = JSON.parse(answer_for_master);
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(answerFromChild)
      );
      console.log("MASTER setRemoteDescription Answer: ", answerFromChild);
    }
  );

  peerConnection.onicecandidate = (event) => {
    console.log("MASTER IceEvent: ", event.candidate);
    if (event.candidate) {
      console.log("MASTER Ice Candidate Send To Child");
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
      dataChannel.send("Hello from amir again");
    };
    dataChannel.onerror = function (error) {
      console.log("Error:", error);
    };

    dataChannel.onmessage = function (event) {
      console.log("Got message:", event.data);
    };
  };

  peerConnection.onnegotiationneeded = async () => {
    console.log("NEGOTIATION MASTER");
    const offerForChild = await peerConnection.createOffer();
    console.log("MASTER createOffer: ", offerForChild);
    await peerConnection.setLocalDescription(offerForChild);
    console.log("MASTER setLocalDescription Offer");
    channel.push(`web:send_offer_to_child`, {
      child_id: childId,
      offer_for_child: JSON.stringify(offerForChild),
      master_id: masterId,
      ip,
    });
    console.log("MASTER Send Offer");
  };

  document.querySelector("#dataChannelMaster").addEventListener("click", () => {
    const dataChannel = createDataChannel(peerConnection);
    console.log("MASTER DataChannel Created", dataChannel);
  });

  document.querySelector("#stateMaster").addEventListener("click", () => {
    console.log("MASTER Peer Coonection", peerConnection);
  });

  document
    .querySelector("#sendOfferMaster")
    .addEventListener("click", async () => {
      const offerForChild = await peerConnection.createOffer();
      console.log("MASTER createOffer: ", offerForChild);
      await peerConnection.setLocalDescription(offerForChild);
      console.log("MASTER setLocalDescription Offer: ", offerForChild);
      channel.push(`web:send_offer_to_child`, {
        child_id: childId,
        offer_for_child: JSON.stringify(offerForChild),
        master_id: masterId,
        ip,
      });
    });
};

const createDataChannel = (peerConnection) => {
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
