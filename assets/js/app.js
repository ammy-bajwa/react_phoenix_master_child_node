// import '../css/app.css';

import "phoenix_html";

import * as React from "react";
import * as ReactDOM from "react-dom";
import Root from "./routes/Root";
import { Provider } from "react-redux";
import { store } from "./redux/store";
// This code starts up the React app when it runs in a browser. It sets up the routing
// configuration and injects the app into a DOM element.
ReactDOM.render(
  <Provider store={store}>
    <Root />
  </Provider>,
  document.getElementById("react-app")
);
