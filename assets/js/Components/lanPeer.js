import React, { Component } from "react";

export const RenderLanPeers = ({ lanPeers, ip }) => {
  const lanPeerContainerStyle = {
    border: "2px solid black",
    padding: "3px",
    margin: "15px 5px",
    display: "inline-block",
    color: "black",
  };
  return (
    <div>
      <h1>Lan Peers</h1>
      {lanPeers.length > 0 &&
        lanPeers.map((node, i) => (
          <div key={i} style={{ ...lanPeerContainerStyle, borderWidth: "5px" }}>
            <div style={lanPeerContainerStyle}>
              <span>Ice Server Status</span>
              <hr />
              <span>{node.connectionType || "Connecting........."}</span>
            </div>
            <div style={lanPeerContainerStyle}>
              <span>IP</span>
              <hr />
              <span>{ip}</span>
            </div>
            <div style={lanPeerContainerStyle}>
              <span>ID</span>
              <hr />
              <span>{node.machine_id}</span>
            </div>
            <div style={lanPeerContainerStyle}>
              <span>Type</span>
              <hr />
              <span>{node.type}</span>
            </div>
            <div style={lanPeerContainerStyle}>
              <span>Last Connect Time</span>
              <hr />
              <span>0</span>
            </div>
            <div style={lanPeerContainerStyle}>
              <span>Last Message Send Time</span>
              <hr />
              <span>0</span>
            </div>
            <div style={lanPeerContainerStyle}>
              <span>Last Message Receive Time</span>
              <hr />
              <span>0</span>
            </div>
            <div style={lanPeerContainerStyle}>
              <span>Total Message Send</span>
              <hr />
              <span>0</span>
            </div>
            <div style={lanPeerContainerStyle}>
              <span>Total Message Receive</span>
              <hr />
              <span>0</span>
            </div>
            <div style={lanPeerContainerStyle}>
              <span>Total Connection time</span>
              <hr />
              <span>0</span>
            </div>
          </div>
        ))}
    </div>
  );
};
