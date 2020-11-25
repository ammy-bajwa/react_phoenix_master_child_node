import React from "react";
// import "./Root.css";
import { Socket } from "phoenix";
import { store } from "./redux/store";
import history from "./history";

import { configureChannel } from "./socket";
import { Router, Switch, Route, Link, Redirect } from "react-router-dom";

import Home from "./Components/home";

class Root extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <Router history={history}>
          <Switch>
            <Route exact path="/">
              <Home />
            </Route>
          </Switch>
        </Router>
      </div>
    );
  }
}

export default Root;
