import React from "react";
import { Route, Redirect } from "react-router-dom";
import { store } from "../redux/store";

const PrivateRoute = ({ component: Component, ...rest }) => {
  const { user } = store.getState();
  return (
    // restricted = false meaning public route
    // restricted = true meaning restricted route
    <Route
      {...rest}
      render={(props) =>
        user ? <Component {...props} /> : <Redirect to="/login" />
      }
    />
  );
};

export default PrivateRoute;
