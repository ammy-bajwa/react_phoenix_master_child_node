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
  channel
    .join()
    .receive("ok", (data) => console.log("Ok data ", data))
    .receive("error", ({ reason }) => {
      alert("Something wrong with socket");
      console.log("failed join", reason);
    })
    .receive("timeout", () => {
      alert("Networking issue. Still waiting....");
    });
  return { channel, socket };
}
