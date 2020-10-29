import { store } from "../redux/store";

import { login } from "../redux/actions";

import React from "react";

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect,
} from "react-router-dom";
// let channel = configureChannel();
// const socket = new Socket('ws://127.0.0.1:4000/socket');
// socket.connect();
// const channel = socket.channel('users:join');

let token = localStorage.getItem("UserToken");
export function getData(channel) {
  channel
    .join()
    .receive("ok", (response) => {
      console.log("Joined successfully", response);
      store.dispatch({
        type: "SET_ALL_DATA",
        payload: response.products,
      });
    })
    .receive("error", (resp) => {
      console.log("Unable to join", resp);
    });
}

export function insertUser(channel, product) {
  channel.push("products:new_msg", { body: product });
}
export function registerUser(user, props) {
  // channel.push("products:new_msg", { body: product });
  fetch("/api/registration", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user,
    }),
  })
    .then((res) => {
      if (res.ok) {
        return res.json();
      } else {
        // throw new Error ('Something went wrong with your fetch');
        alert("Something went wrong with your fetch");
        console.assert(res);
      }
    })
    .then((json) => {
      console.log(json);
      // localStorage.setItem('UserToken',json.data.token)
      json.data.token
        ? props.history.push("/login")
        : props.history.push("/register");
    });
}

export function loginUser(user, props) {
  // channel.push("products:new_msg", { body: product });
  fetch("/api/session", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      // 'x-access-token': token
      Authorization: token,
    },
    body: JSON.stringify({
      user,
    }),
  })
    .then((res) => {
      if (res.ok) {
        return res.json();
      } else {
        // throw new Error ('Something went wrong with your fetch');
        alert(res.statusText);
      }
    })
    .then((json) => {
      console.log(json);
      localStorage.setItem("UserToken", json.data.token);
      const data = {
        renew_token: json.data.renew_token,
        toke: json.data.token
      }
      store.dispatch(login(data));
      json.data.token
        ? props.history.push("/")
        : props.history.push("/register");
    });
}

export function logoutUser(props) {
  // channel.push("products:new_msg", { body: product });
  fetch("/api/session", {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      // 'x-access-token': token
      Authorization: token,
    },
  })
    .then((res) => {
      if (res.ok) {
        return res.json();
      } else {
        // throw new Error ('Something went wrong with your fetch');
        alert("Something went wrong with your fetch");
      }
    })
    .then((json) => {
      console.log(json);
      localStorage.clear();
      localStorage.getItem("UserToken") === null
        ? props.history.push("/login")
        : props.history.push("/");
    });
}
