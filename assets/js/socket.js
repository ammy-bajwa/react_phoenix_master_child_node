import { Socket } from "phoenix";
import { getMyIp } from "./utils/index";
import { setIdIfRequired, getMachineId } from "./utils/indexedDbUtils";
import history from "./history";

export async function configureChannel() {
  const ip = await getMyIp();
  await setIdIfRequired();
  const machineId = await getMachineId();
  const socket = new Socket("/socket");
  socket.connect();
  socket.onOpen = function (event) {
    console.log("Socket is Open ");
  };

  const channel = socket.channel("web:peer", { machineId, ip });

  return { channel, socket };
}
