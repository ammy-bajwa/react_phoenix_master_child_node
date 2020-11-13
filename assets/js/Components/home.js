import React from "react";

import { getMyIp } from "../utils/index";
import {
  setIdIfRequired,
  getMachineId,
  setNodeType,
  getNodeType,
} from "../utils/indexedDbUtils";
import { configureChannel } from "../socket";

class Home extends React.Component {
  state = {};
  constructor(props) {
    super(props);
  }

  componentDidMount() {}
  render() {
    <div>
      <h1>Home</h1>
    </div>;
  }
}

export default Home;
