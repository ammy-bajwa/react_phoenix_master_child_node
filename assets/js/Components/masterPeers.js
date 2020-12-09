import React, { Component } from "react";

export const RenderRemoteMasterPeers = ({ remoteMasterPeers, ip }) => {
  const remotePeerContainerStyle = {
    border: "2px solid white",
    padding: "3px",
    margin: "15px 5px",
    display: "inline-block",
  };
  return (
    <div>
      <h1 style={{ color: "white", textAlign: "center" }}>Remote Masters</h1>
      {remoteMasterPeers.length > 0 &&
        remoteMasterPeers.map((node, i) => (
          <div
            key={i}
            style={{
              ...remotePeerContainerStyle,
              borderWidth: "5px",
            }}
          >
            <div style={remotePeerContainerStyle}>
              <span>Ice Server Status</span>
              <hr />
              <span>{node.connectionType || "Connecting........."}</span>
            </div>
            <div style={remotePeerContainerStyle}>
              <span>IP</span>
              <hr />
              <span>{node.ip}</span>
            </div>
            <div style={remotePeerContainerStyle}>
              <span>ID</span>
              <hr />
              <span>{node.machine_id}</span>
            </div>
            <div style={remotePeerContainerStyle}>
              <span>Type</span>
              <hr />
              <span>{node.type}</span>
            </div>
            <div style={remotePeerContainerStyle}>
              <span>Last Connect Time</span>
              <hr />
              <span>{node.connectionTime || 0}</span>
            </div>
            <div style={remotePeerContainerStyle}>
              <span>Last Message Send Time</span>
              <hr />
              <span>{node.lastMessageSendTime || 0}</span>
            </div>
            <div style={remotePeerContainerStyle}>
              <span>Last Message Receive Time</span>
              <hr />
              <span>{node.lastMessageReceiveTime || 0}</span>
            </div>
            <div style={remotePeerContainerStyle}>
              <span>Total Message Send</span>
              <hr />
              <span>{node.totalSendMessageCount || 0}</span>
            </div>
            <div style={remotePeerContainerStyle}>
              <span>Total Message Receive</span>
              <hr />
              <span>{node.totalReceiveMessageCount || 0}</span>
            </div>
            <div style={remotePeerContainerStyle}>
              <span>Total Connection time</span>
              <hr />
              <span>{node.totalConnectionTime || 0}</span>
            </div>
          </div>
        ))}
    </div>
  );
};
