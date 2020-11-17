export const masterCreateWebRtcConObj = (channel, ip, masterId, childId) => {
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
      channel.push(`web:send_ice_candidate`, {
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
