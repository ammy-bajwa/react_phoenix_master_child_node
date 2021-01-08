export const getMyIp = async function () {
  const { ip } = await (
    await fetch("https://api.ipify.org?format=json")
  ).json();
  return ip;
};

export const cleanPeerConnection = (peerConnection) => {
  try {
    peerConnection.close();
    return true;
  } catch (error) {
    console.error(error);
    return error;
  }
};
