import React, { Children } from "react";

import { RenderFileNames } from "./renderFileNames";

class FileUploadMaster extends React.Component {
  state = {
    chunkSize: 64000, // Bytes
    files: {},
    filesBufferArr: [],
    fileNamesArr: [],
    remoteMasterPeersWebRtcConnections: [],
    dataChannelOptions: {
      ordered: true, // do not guarantee order
      // maxPacketLifeTime: 300, // in milliseconds
    },
  };
  componentDidMount() {
    const { remoteMasterPeersWebRtcConnections } = this.props;
    this.setState({ remoteMasterPeersWebRtcConnections });
  }
  componentWillReceiveProps(nextProps) {
    this.setState({
      remoteMasterPeersWebRtcConnections:
        nextProps.remoteMasterPeersWebRtcConnections,
    });
  }
  handleChange = (event) => {
    const { chunkSize } = this.state;
    const inputElement = document.getElementById("masterFileUpload");
    if (inputElement.files && inputElement.files.length > 0) {
      let fileNamesArr = [];
      let files = {};
      for (const key in inputElement.files) {
        if (Object.hasOwnProperty.call(inputElement.files, key)) {
          const file = inputElement.files[key];
          fileNamesArr.push(file.name);
          const fileObj = {
            fileName: file.name,
            file,
            size: file.size,
            startSliceIndex: 0,
            endSliceIndex: chunkSize,
          };
          files[file.name] = fileObj;
          this.setState({
            files,
          });
        }
      }
      this.setState({ fileNamesArr });
    } else {
      console.log("No file selected");
    }
  };

  getChunkOfFile = async (fileName, file) => {
    const { files } = this.state;
    const fileChunkPromise = new Promise((resolve, reject) => {
      const slicedFilePart = file.slice(
        files[fileName].startSliceIndex,
        files[fileName].endSliceIndex
      );
      const fileReader = new FileReader();
      fileReader.addEventListener("load", (event) => {
        let fileChunk = event.target.result;
        resolve(fileChunk);
      });
      fileReader.readAsArrayBuffer(slicedFilePart);
    });
    return await fileChunkPromise;
  };

  updateSliceIndexes = async (fileName) => {
    const { chunkSize, files } = this.state;
    const updateIndexPromise = new Promise((resolve, reject) => {
      files[fileName].startSliceIndex =
        files[fileName].startSliceIndex + chunkSize;
      files[fileName].endSliceIndex = files[fileName].endSliceIndex + chunkSize;
      this.setState(
        {
          files,
        },
        () => {
          resolve(`indexes updated for ${fileName}`);
        }
      );
    });

    return await updateIndexPromise;
  };

  createFileDataChannel = async (peerConnection, fileName) => {
    const { dataChannelOptions } = this.state;
    const dataChannelPromise = new Promise((resolve, reject) => {
      const dataChannel = peerConnection.createDataChannel(
        fileName,
        dataChannelOptions
      );

      dataChannel.onopen = () => {
        console.log(`${fileName} datachannel is open`);
        resolve({ dataChannel, peerConnection });
      };
      dataChannel.onerror = () => {
        console.log(`${fileName} datachannel has error`);
        reject(dataChannel);
      };
    });
    try {
      return await dataChannelPromise;
    } catch (error) {
      console.error(error);
      return error;
    }
  };

  setupDataChannel = async (fileName) => {
    const { remoteMasterPeersWebRtcConnections } = this.state;
    // If does not exist create one and send chunk
    const setupDataChannelPromise = new Promise(async (resolve, reject) => {
      const updatedRemoteMasterPeers = remoteMasterPeersWebRtcConnections.map(
        async (remoteMasterNodeObj) => {
          // Checking if file data channel already exists
          let isFileDataChannelExists = false;
          if (remoteMasterNodeObj.filesDataChannels) {
            if (remoteMasterNodeObj.filesDataChannels[fileName]) {
              isFileDataChannelExists = true;
            }
          }
          if (isFileDataChannelExists) {
            console.log("this should execute");
            console.log(remoteMasterNodeObj.filesDataChannels[fileName]);
          } else {
            console.log("remoteMasterNodeObj: ", remoteMasterNodeObj);
            const {
              dataChannel,
              peerConnection,
            } = await this.createFileDataChannel(
              remoteMasterNodeObj.peerConnection,
              fileName
            );
            console.log(dataChannel, peerConnection);
            const fileDataChannelObj = {
              dataChannel,
              fileName,
            };
            if (!remoteMasterNodeObj.filesDataChannels) {
              remoteMasterNodeObj.filesDataChannels = {};
            }
            remoteMasterNodeObj.filesDataChannels[
              fileName
            ] = fileDataChannelObj;
            remoteMasterNodeObj.peerConnection = peerConnection;
          }
          return remoteMasterNodeObj;
        }
      );
      const resolvingPromises = await Promise.all(updatedRemoteMasterPeers);
      console.log(resolvingPromises);
      this.setState({
        remoteMasterPeersWebRtcConnections: resolvingPromises,
      });
    });
    return await setupDataChannelPromise;
  };

  chunkAndUpdateIndex = async (fileName, file) => {
    let fileChunkToSend = await this.getChunkOfFile(fileName, file);
    await this.updateSliceIndexes(fileName);
  };

  createAndSendChunksOfFile = async ({ fileName, file, size }) => {
    const { chunkSize } = this.state;
    let counter = 0;
    const fileDataChannelName = `file__${fileName}`;
    this.setupDataChannel(fileDataChannelName);
    while (counter < size) {
      await this.chunkAndUpdateIndex(fileName, file);
      counter = counter + chunkSize;
      console.log(counter);
    }
    console.log("While loop end");
  };

  handleFilesToMasters = async (event) => {
    const { files } = this.state;
    if (Object.keys(files).length > 0) {
      for (const key in files) {
        if (Object.hasOwnProperty.call(files, key)) {
          const fileObj = files[key];
          await this.createAndSendChunksOfFile(fileObj);
        }
      }
    }
  };
  render() {
    const { fileNamesArr } = this.state;
    return (
      <div>
        <div className="custom-file mt-2 mb-2">
          <input
            type="file"
            className="custom-file-input"
            onChange={this.handleChange}
            id="masterFileUpload"
            multiple
          />
          <label className="custom-file-label" htmlFor="masterFileUpload">
            Choose file
          </label>
        </div>
        <RenderFileNames fileNamesArr={fileNamesArr} />
        <div>
          <button
            className="btn btn-outline-light m-2"
            // onClick={this.handleFilesToChilds}
          >
            Send Files To Child
          </button>
          <button
            className="btn btn-outline-light m-2"
            onClick={this.handleFilesToMasters}
          >
            Send Files To Masters
          </button>
        </div>
      </div>
    );
  }
}

export default FileUploadMaster;
