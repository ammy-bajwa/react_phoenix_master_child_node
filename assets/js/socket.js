import { Socket } from "phoenix";


export function configureChannel() {
  // const socket = new Socket("/socket", {
  //   params: { token: localStorage.getItem("UserToken") },
  // });
  // socket.connect();
  // console.log("Ok ", socket);

  // const channel = socket.channel("products:join");
  return { channel, socket };
}
