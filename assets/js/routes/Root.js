import React from "react";

import { RestrictedRoute } from "./RestrictedRoute";
import PrivateRoute from "./PrivateRoute";

import Home from "../Components/home";
import Login from "../Components/login";
import Register from "../Components/register";

import history from "../history";

import { Router, Switch, Route } from "react-router-dom";

class Root extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <Router history={history}>
          <Switch>
            <PrivateRoute exact path="/" component={Home} />
            <Route path="/login">
              <Login />
            </Route>
            <Route path="/register">
              <Register />
            </Route>
          </Switch>
        </Router>
      </div>
    );
  }
}

export default Root;
