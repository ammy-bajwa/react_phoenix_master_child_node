import React, { Component } from "react";

export const RenderLanPeers = ({ lanPeers, ip, messages }) => {
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
              <span>{node.connectionTime || 0}</span>
            </div>
            <div style={lanPeerContainerStyle}>
              <span>Last Message Send Time</span>
              <hr />
              <span>{node.lastMessageSendTime || 0}</span>
            </div>
            <div style={lanPeerContainerStyle}>
              <span>Last Message Receive Time</span>
              <hr />
              <span>{node.lastMessageReceiveTime || 0}</span>
            </div>
            <div style={lanPeerContainerStyle}>
              <span>Total Messages Send</span>
              <hr />
              <span>{node.totalSendMessageCount || 0}</span>
            </div>
            <div style={lanPeerContainerStyle}>
              <span>Total Messages Receive</span>
              <hr />
              <span>{node.totalReceiveMessageCount || 0}</span>
            </div>
            <div style={lanPeerContainerStyle}>
              <span>Total Connection time</span>
              <hr />
              <span>{node.totalConnectionTime || 0}</span>
            </div>
            <div style={lanPeerContainerStyle}>
              <span>Current Message</span>
              <hr />
              <span>{node.currentMessage || 0}</span>
            </div>
            <div style={lanPeerContainerStyle}>
              <span>Total Verified</span>
              <hr />
              <span>{node.totalVerifiedMessages || 0}</span>
            </div>
            <div style={lanPeerContainerStyle}>
              <span>Total Unverified</span>
              <hr />
              <span>{node.totalUnverifiedMessages || 0}</span>
            </div>
          </div>
        ))}
      {messages.length > 0 &&
        messages.map(({ message }, index) => <p key={index}>{message}</p>)}
    </div>
  );
};
