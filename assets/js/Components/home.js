import React from "react";

import { configureChannel } from "../socket";

class Home extends React.Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    configureChannel();
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
