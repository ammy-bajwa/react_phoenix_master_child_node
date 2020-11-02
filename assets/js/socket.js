import { Socket } from "phoenix";
import history from "./history";

export function configureChannel() {
  const socket = new Socket("/socket");
  socket.connect();
  socket.onOpen = function (event) {
    console.log("Socket Open ", socket);
    // const channel = socket.channel("initial:peer", {});
  };

  const channel = socket.channel("initial:peer");

  return { channel, socket };
}
