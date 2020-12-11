import React, { Component } from "react";

export const TableRow = ({ peer }) => {
  return (
    <tr>
      <td>{peer.connectionType || "Connecting........."}</td>
      <td>{peer.ip || "0"}</td>
      <td>{peer.machine_id || "0"}</td>
      <td>{peer.type || "0"}</td>
      <td>{peer.connectionTime || "0"}</td>
      <td>{peer.lastMessageSendTime || "0"}</td>
      <td>{peer.lastMessageReceiveTime || "0"}</td>
      <td>{peer.totalConnectionTime || "0"}</td>
      <td>{peer.totalSendMessageCount || "0"}</td>
      <td>{peer.totalReceiveMessageCount || "0"}</td>
      <td>{peer.currentMessage || "0"}</td>
      <td>{peer.totalVerifiedMessages || "0"}</td>
      <td>{peer.totalUnverifiedMessages || "0"}</td>
    </tr>
  );
};
