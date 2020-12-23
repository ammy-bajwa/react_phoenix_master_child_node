import React, { Component } from "react";

export const TableRow = ({ messages, peer, index, type }) => {
  const myMessages = messages.filter(
    ({ message }) => message.split("_")[0] === peer.machine_id
  );
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
      <td>{(peer.notReceived && peer.notReceived.length) || "0"}</td>
      <td>{(peer.delayedReceived && peer.delayedReceived.length) || "0"}</td>
      <td>
        <button
          type="button"
          className="btn btn-light"
          data-toggle="modal"
          data-target={`#modelNumber_${type}_${index}`}
        >
          Messages
        </button>

        <div
          className="modal fade"
          id={`modelNumber_${type}_${index}`}
          tabIndex="-1"
          role="dialog"
          aria-labelledby="exampleModalLongTitle"
          aria-hidden="true"
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="exampleModalLongTitle">
                  {peer.machine_id || "No Id...."}
                </h5>
                <button
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body mh-50 text-dark">
                {myMessages.length > 0 &&
                  myMessages.map(({ message }, index) => (
                    <p key={index}>{message}</p>
                  ))}

                <hr />
                <h3>Not Received Messages</h3>
                {peer.notReceived &&
                  peer.notReceived.map(({ counter, timeStamp }, index) => (
                    <p key={index}>
                      <b>Counter: </b>
                      {counter} : {timeStamp}
                    </p>
                  ))}

                <hr />
                <h3>Delayed Received Messages</h3>
                {peer.delayedReceived &&
                  peer.delayedReceived.map(({ counter, timeStamp }, index) => (
                    <p key={index}>
                      <b>Counter: </b>
                      {counter} : {timeStamp}
                    </p>
                  ))}
              </div>
              {/* <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-dismiss="modal"
                >
                  Close
                </button>
              </div> */}
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};
