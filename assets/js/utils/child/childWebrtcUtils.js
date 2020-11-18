export const childCreateWebRtcConObj = (channel, ip, childId) => {
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

  //   const peerConnection = new RTCPeerConnection({ iceServers: [] });

  channel.on(
    `web:add_ice_candidate_to_child${childId}`,
    async ({ child_id, candidate }) => {
      const parsedCandidate = JSON.parse(candidate);
      await peerConnection.addIceCandidate(
        new RTCIceCandidate(parsedCandidate)
      );
      console.log("CHILD Added Ice Candidate From Child:", parsedCandidate);
    }
  );

  channel.on(
    `web:offer_from_master_${childId}`,
    async ({ offer_from_master, master_id, child_id }) => {
      const parsedMasterOffer = JSON.parse(offer_from_master);

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(parsedMasterOffer)
      );
      console.log("CHILD setRemoteDescription offer: ", parsedMasterOffer);
      await peerConnection.createAnswer(
        async (answer) => {
          await peerConnection.setLocalDescription(answer);
          channel.push("web:send_answer_to_master", {
            answer_for_master: JSON.stringify(answer),
            master_id,
            child_id,
            ip: ip,
          });
          console.log("CHILD Send Answer: ", answer);
        },
        function (error) {
          alert("oops...error");
        }
      );
    }
  );

  peerConnection.onicecandidate = (event) => {
    console.log("CHILD IceEvent ", event.candidate);
    if (event.candidate) {
      console.log("CHILD Send Candidate To Master");
      channel.push(`web:add_ice_candidate_from_child`, {
        candidate: JSON.stringify(event.candidate),
        child_id: childId,
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

  document.querySelector("#stateChild").addEventListener("click", () => {
    console.log("CHILD peerconnection", peerConnection);
  });
};
