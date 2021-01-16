import React from "react";

import { RenderFileNames } from "./renderFileNames";

class FileUploadMaster extends React.Component {
  state = {
    chunkSize: 60000, // Bytes
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
          files[`file__${file.name}`] = fileObj;
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

<<<<<<< HEAD
  getChunkOfFile = async (fileName, file) => {
    const { files } = this.state;
    const fileChunkPromise = new Promise((resolve, reject) => {
      try {
        const slicedFilePart = file.slice(
          files[fileName].startSliceIndex,
          files[fileName].endSliceIndex
        );
        const fileReader = new FileReader();
        fileReader.addEventListener("load", async (event) => {
          let fileChunk = event.target.result;
          resolve(fileChunk);
        });
        fileReader.readAsDataURL(slicedFilePart);
      } catch (error) {
        console.error(error);
        reject(error);
      }
=======
  getChunkOfFile = async (file, startSliceIndex, endSliceIndex) => {
    const fileChunkPromise = new Promise((resolve, reject) => {
      const slicedFilePart = file.slice(startSliceIndex, endSliceIndex);
      const fileReader = new FileReader();
      fileReader.addEventListener("load", (event) => {
        let fileChunk = event.target.result;
        resolve(fileChunk);
      });
      fileReader.readAsArrayBuffer(slicedFilePart);
>>>>>>> parent of bc5c7b2... Fixing bug in chunking indexex
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
      try {
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
              console.log("Datachannel already exists");
              return;
            } else {
              const {
                dataChannel,
                peerConnection,
              } = await this.createFileDataChannel(
                remoteMasterNodeObj.peerConnection,
                fileName
              );
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
        resolve(true);
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
    return await setupDataChannelPromise;
  };

<<<<<<< HEAD
  sendFileChunkOverDataChannel = async (fileName, fileChunkToSend, counter) => {
    const sendFileChunkPromise = new Promise((resolve, reject) => {
      const { remoteMasterPeersWebRtcConnections, chunkSize } = this.state;
      try {
        remoteMasterPeersWebRtcConnections.map(async (remoteMasterNodeObj) => {
          if (remoteMasterNodeObj.filesDataChannels) {
            let dataChannel =
              remoteMasterNodeObj.filesDataChannels[fileName].dataChannel;
            if (dataChannel.readyState === "open") {
              dataChannel.send(
                JSON.stringify({
                  startSliceIndex: counter,
                  endSliceIndex: counter + chunkSize,
                  fileChunk: fileChunkToSend,
                  fileName,
                  masterPeerId: remoteMasterNodeObj.machine_id,
                })
              );
            } else {
              console.log("Datachannel state is not open: ", dataChannel);
              reject("Datachannel is not open");
            }
          }
        });
        resolve(true);
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
    return await sendFileChunkPromise;
  };

  chunkAndUpdateIndex = async (fileName, file, counter) => {
    let fileChunkToSend = await this.getChunkOfFile(fileName, file);
    await this.sendFileChunkOverDataChannel(fileName, fileChunkToSend, counter);
    await this.updateSliceIndexes(fileName);
  };

  causeDelay = async () => {
    const delayPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(true);
      }, 500);
    });
    return await delayPromise;
  };

  createAndSendChunksOfFile = async ({ fileName, file, size }) => {
    const createAndSendChunksPromise = new Promise(async (resolve, reject) => {
      try {
        const { chunkSize } = this.state;
        let counter = 0;
        const fileDataChannelName = `file__${fileName}`;
        await this.setupDataChannel(fileDataChannelName);
        console.log("loop status: ", counter < size);
        while (counter < size) {
          try {
            await this.causeDelay();
            await this.chunkAndUpdateIndex(fileDataChannelName, file, counter);
            counter = counter + chunkSize;
            console.log(counter);
          } catch (error) {
            console.error(error);
            reject(error);
            break;
          }
        }
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
=======
  chunkAndUpdateIndex = async (
    fileName,
    file,
    size,
    startSliceIndex,
    endSliceIndex
  ) => {
    let fileChunkToSend = await this.getChunkOfFile(
      file,
      startSliceIndex,
      endSliceIndex,
      size
    );
    this.sendChunk(fileChunkToSend);
    await this.updateSliceIndexes(fileName);
  };

  createAndSendChunksOfFile = async ({
    fileName,
    file,
    size,
    startSliceIndex,
    endSliceIndex,
  }) => {
    const { chunkSize } = this.state;
    let counter = startSliceIndex;
    while (counter < size) {
      await this.chunkAndUpdateIndex(
        fileName,
        file,
        size,
        startSliceIndex,
        endSliceIndex
      );
      counter = counter + chunkSize;
      console.log(counter);
    }
>>>>>>> parent of bc5c7b2... Fixing bug in chunking indexex
    console.log("While loop end");
    return await createAndSendChunksPromise;
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
            Choose files
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
