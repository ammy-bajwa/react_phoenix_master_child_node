import React from "react";
import { TableRow } from "./peer";

export const Table = ({ remotePeers, lanPeers }) => {
  return (
    <table className="table table-striped table-dark table-bordered">
      <thead>
        <tr>
          <th scope="col">Ice Server Status</th>
          <th scope="col">IP</th>
          <th scope="col">ID</th>
          <th scope="col">Type</th>
          <th scope="col">Last Connect Time</th>
          <th scope="col">Last Send</th>
          <th scope="col">Last Receive</th>
          <th scope="col">Total Time</th>
          <th scope="col">Send</th>
          <th scope="col">Receive</th>
          <th scope="col">Current Message</th>
          <th scope="col">Received Verification</th>
          <th scope="col">Not Received</th>
        </tr>
      </thead>
      <tbody>
        {remotePeers.length > 0 &&
          remotePeers.map((node, i) => <TableRow peer={node} key={i} />)}
        {lanPeers.length > 0 &&
          lanPeers.map((node, i) => <TableRow peer={node} key={i} />)}
      </tbody>
    </table>
  );
};
