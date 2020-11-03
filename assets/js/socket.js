import { Socket } from "phoenix";
import { getMyIp } from "./utils/index";
import history from "./history";

export async function configureChannel() {
  const ip = await getMyIp();
  const socket = new Socket("/socket");
  socket.connect();
  socket.onOpen = function (event) {
    console.log("Socket is Open ");
    // const channel = socket.channel("initial:peer", {});
  };

  const channel = socket.channel("initial:peer", { ip });

  return { channel, socket };
}
