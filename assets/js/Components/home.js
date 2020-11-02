import React from "react";

import { getMyIp } from "../utils";
import { configureChannel } from "../socket";

class Home extends React.Component {
  state = {
    ip: "",
  };
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    // configureChannel();
    const { channel, socket } = configureChannel();
    console.log(socket.connectionState());
    
    // console.log(await getMyIp());
  }

  render() {
    return (
      <div>
        <h1>Home</h1>
      </div>
    );
  }
}

export default Home;
