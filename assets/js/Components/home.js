import React from "react";

import { getMyIp } from "../utils";
import { configureChannel } from "../socket";

class Home extends React.Component {
  state = {};
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    configureChannel();
    getMyIp();
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
