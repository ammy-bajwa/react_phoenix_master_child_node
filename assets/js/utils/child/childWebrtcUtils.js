export const childCreateWebRtcConObj = (channel, ip, childId) => {
  const peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.test.com:19000" }],
  });

  channel.on(
    `web:add_ice_candidate_${childId}`,
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
      channel.push(`web:send_ice_candidate`, {
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
